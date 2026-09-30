const baseUrl = (process.argv[2] || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

const checks = ["/api/health", "/api/ready"];
let failed = false;

let isDemoServer = false;

for (const path of checks) {
  try {
    const response = await fetch(`${baseUrl}${path}`);
    const body = await response.text();
    const isHealthy = path === "/api/health" ? response.ok : response.status < 500;
    console.log(`${isHealthy ? "PASS" : "FAIL"} ${path} (${response.status}) ${body}`);
    if (!isHealthy) failed = true;
    if ((path === "/api/health" || path === "/api/ready") && response.ok) {
      try {
        const parsed = JSON.parse(body);
        if (parsed.mode === "demo") isDemoServer = true;
      } catch {
        // ignore JSON parse issues
      }
    }
  } catch (error) {
    failed = true;
    console.error(`FAIL ${path}: ${error instanceof Error ? error.message : "request failed"}`);
  }
}

const protectedChecks = [
  { path: "/api/auth/validate", expectedStatus: 401 },
  { path: "/api/metrics", expectedStatus: 403 },
  { path: "/api/admin/submissions", expectedStatus: 401 },
  { path: "/api/internal/retention", expectedStatus: 401, method: "POST" as const },
  { path: "/api/auth/login", expectedStatus: 410, method: "POST" as const },
];

for (const check of protectedChecks) {
  try {
    const response = await fetch(`${baseUrl}${check.path}`, { method: check.method || "GET" });
    const body = await response.text();
    const passed = response.status === check.expectedStatus;
    console.log(`${passed ? "PASS" : "FAIL"} ${check.path} (${response.status}) ${body}`);
    if (!passed) failed = true;
  } catch (error) {
    failed = true;
    console.error(`FAIL ${check.path}: ${error instanceof Error ? error.message : "request failed"}`);
  }
}

if (isDemoServer) {
  try {
    const demoRes = await fetch(`${baseUrl}/api/demo/submissions`);
    const demoJson = await demoRes.json();
    const passed = demoRes.ok && demoJson.success === true && Array.isArray(demoJson.submissions) && demoJson.submissions.length >= 60;
    console.log(`${passed ? "PASS" : "FAIL"} /api/demo/submissions (${demoRes.status}) count=${demoJson.submissions?.length ?? 0}`);
    if (!passed) failed = true;

    // Verify /api/demo/prioritize with national-data joined scoring
    const prioRes = await fetch(`${baseUrl}/api/demo/prioritize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissions: (demoJson.submissions || []).slice(0, 15) }),
    });
    const prioJson = await prioRes.json();
    const prioPassed =
      prioRes.ok &&
      prioJson.success === true &&
      Array.isArray(prioJson.recommendations) &&
      prioJson.recommendations.length > 0 &&
      typeof prioJson.recommendations[0].need_weighted_score === "number" &&
      typeof prioJson.recommendations[0].raw_rank === "number";
    console.log(`${prioPassed ? "PASS" : "FAIL"} /api/demo/prioritize (${prioRes.status}) engine=${prioJson.engine} count=${prioJson.recommendations?.length ?? 0}`);
    if (!prioPassed) failed = true;

    // Verify /data/SOURCES.md route returns provenance documentation
    const sourcesRes = await fetch(`${baseUrl}/data/SOURCES.md`);
    const sourcesText = await sourcesRes.text();
    const sourcesPassed = sourcesRes.ok && sourcesText.includes("Census 2011") && sourcesText.includes("NITI Aayog");
    console.log(`${sourcesPassed ? "PASS" : "FAIL"} /data/SOURCES.md (${sourcesRes.status}) length=${sourcesText.length}`);
    if (!sourcesPassed) failed = true;
  } catch (error) {
    failed = true;
    console.error(`FAIL demo tests: ${error instanceof Error ? error.message : "request failed"}`);
  }
}

if (failed) process.exitCode = 1;

