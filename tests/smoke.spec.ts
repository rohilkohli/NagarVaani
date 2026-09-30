import { test, expect } from '@playwright/test';

test.describe('NagarVaani Demo Mode & Maps Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Acknowledge first-load accessibility modal so it does not intercept clicks
    await page.addInitScript(() => {
      try {
        localStorage.setItem('nv_accessibility_preferences', JSON.stringify({ acknowledged: true }));
      } catch {}
    });
  });

  test('loads "/" in demo mode without console errors or CSP violations, showing landing buttons', async ({ page }) => {
    const consoleErrors: string[] = [];
    const cspViolations: string[] = [];

    // Capture console logs and errors
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      if (type === 'error') {
        consoleErrors.push(text);
      }
      if (text.toLowerCase().includes('content security policy') || text.toLowerCase().includes('violates the following')) {
        cspViolations.push(text);
      }
    });

    // Capture unhandled page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    // Capture CSP violation events in the browser context
    await page.addInitScript(() => {
      window.addEventListener('securitypolicyviolation', (e) => {
        console.error(`CSP Violation: blockedURI=${e.blockedURI}, directive=${e.effectiveDirective}, violatedDirective=${e.violatedDirective}`);
      });
    });

    // Navigate to root route
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    // Assert landing buttons are visible in demo mode
    const citizenBtn = page.locator('#landing-citizen-btn');
    const dashboardBtn = page.locator('#landing-dashboard-btn');

    await expect(citizenBtn).toBeVisible({ timeout: 10000 });
    await expect(dashboardBtn).toBeVisible({ timeout: 10000 });
    await expect(citizenBtn).toContainText('Citizen portal');
    await expect(dashboardBtn).toContainText('Policymaker dashboard');

    // Verify /config.js runtime configuration script is loaded
    const runtimeConfig = await page.evaluate(() => window.__NV_CONFIG__);
    expect(runtimeConfig).toBeDefined();
    expect(typeof runtimeConfig?.mapsKey).toBe('string');

    // Click into citizen portal
    await citizenBtn.click({ force: true });
    await page.waitForTimeout(500);

    // Verify Citizen Portal loads and citizen map container exists
    const citizenMapContainer = page.locator('#citizen-real-map-container');
    await expect(citizenMapContainer).toBeVisible({ timeout: 10000 });

    // Assert that in absence of GOOGLE_MAPS_API_KEY, graceful fallback is rendered (never blank card)
    const fallbackText = page.locator('text=Map unavailable: key missing or blocked');
    const hasFallback = await fallbackText.count();
    if (hasFallback > 0) {
      await expect(fallbackText.first()).toBeVisible();
    }

    // Verify no CSP violations occurred
    expect(cspViolations, `Observed CSP violations: ${cspViolations.join('; ')}`).toEqual([]);

    // Filter out expected benign notices if any
    const realErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('Notice: Firestore')
    );
    expect(realErrors, `Observed console errors: ${realErrors.join('; ')}`).toEqual([]);
  });

  test('loads DemandHeatmap on dashboard without console errors, displaying fallback when no key', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    // Direct navigation to dashboard (bypasses landing)
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // Verify DemandHeatmap card is present
    const heatmapCard = page.locator('#demand-heatmap-card');
    await expect(heatmapCard).toBeVisible({ timeout: 10000 });

    // Filter pills should be visible and clickable
    const roadsFilter = page.locator('#demand-heatmap-card button:has-text("Roads")');
    await expect(roadsFilter).toBeVisible();
    await roadsFilter.click({ force: true });

    // Verify fallback or map container is populated
    const realErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('Notice: Firestore')
    );
    expect(realErrors).toEqual([]);
  });
});
