import { chromium } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

async function waitForServer(url: string, timeoutMs: number = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function run() {
  const PORT = process.env.PORT || '3055';
  const BASE_URL = `http://localhost:${PORT}`;
  let serverProcess: ChildProcess | null = null;

  console.log(`Starting NagarVaani in demo mode on ${BASE_URL}...`);

  // Start production server bundle in demo mode
  serverProcess = spawn('node', ['dist/server.cjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      APP_MODE: 'demo',
      PORT,
    },
    stdio: 'inherit',
  });

  try {
    const isUp = await waitForServer(BASE_URL, 20000);
    if (!isUp) {
      throw new Error(`Server failed to respond at ${BASE_URL}/api/health within 20s`);
    }
    console.log(`Server is healthy at ${BASE_URL}`);

    console.log('Launching headless Chromium via Playwright...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    const cspViolations: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      if (type === 'error') {
        consoleErrors.push(text);
      }
      if (text.toLowerCase().includes('content security policy') || text.toLowerCase().includes('violates the following directive')) {
        cspViolations.push(text);
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    // Listen for CSP violation events and dismiss initial accessibility modal
    await page.addInitScript(() => {
      try {
        localStorage.setItem('nv_accessibility_preferences', JSON.stringify({ acknowledged: true }));
      } catch {}
      window.addEventListener('securitypolicyviolation', (e) => {
        console.error(`CSP Violation event: blockedURI=${e.blockedURI}, directive=${e.effectiveDirective}`);
      });
    });

    console.log(`Navigating to ${BASE_URL}/ in demo mode...`);
    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    console.log(`HTTP Status: ${response?.status()}`);

    // Verify /config.js loaded
    const runtimeConfig = await page.evaluate(() => (window as any).__NV_CONFIG__);
    console.log('Runtime config loaded:', JSON.stringify(runtimeConfig));
    if (!runtimeConfig || typeof runtimeConfig.mapsKey !== 'string') {
      throw new Error('window.__NV_CONFIG__ missing or invalid');
    }

    // Assert landing buttons are visible
    const citizenBtn = await page.waitForSelector('#landing-citizen-btn', { timeout: 10000 });
    const dashboardBtn = await page.waitForSelector('#landing-dashboard-btn', { timeout: 10000 });

    const citizenText = await citizenBtn.innerText();
    const dashboardText = await dashboardBtn.innerText();

    console.log(`Found landing button 1: ${citizenText.replace(/\n/g, ' ')}`);
    console.log(`Found landing button 2: ${dashboardText.replace(/\n/g, ' ')}`);

    if (!citizenText.includes('Citizen portal') || !dashboardText.includes('Policymaker dashboard')) {
      throw new Error('Landing buttons text did not match expected labels');
    }

    // Click into citizen portal
    console.log('Navigating to Citizen Portal...');
    await citizenBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // Assert citizen map container exists
    const mapContainer = await page.waitForSelector('#citizen-real-map-container', { timeout: 10000 });
    if (!mapContainer) {
      throw new Error('Citizen map container not found');
    }
    console.log('Citizen map container rendered successfully.');

    // Navigate to /dashboard
    console.log('Navigating to Dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    const heatmapCard = await page.waitForSelector('#demand-heatmap-card', { timeout: 10000 });
    if (!heatmapCard) {
      throw new Error('Demand heatmap card not found on dashboard');
    }
    console.log('Demand heatmap card rendered successfully.');

    // Report CSP Violations
    if (cspViolations.length > 0) {
      console.error('CSP Violations detected:', cspViolations);
      throw new Error(`CSP Violations encountered: ${cspViolations.join('; ')}`);
    } else {
      console.log('CSP Check Passed: 0 CSP violations detected.');
    }

    // Filter out expected benign notices if any
    const realErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('Notice: Firestore')
    );

    if (realErrors.length > 0) {
      console.error('Console errors detected:', realErrors);
      throw new Error(`Console errors encountered: ${realErrors.join('; ')}`);
    } else {
      console.log('Console Errors Check Passed: 0 unhandled console errors.');
    }

    await browser.close();
    console.log('Playwright smoke test PASSED successfully!');
  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGINT');
    }
  }
}

run().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
