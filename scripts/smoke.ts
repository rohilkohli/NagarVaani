const baseUrl = (process.argv[2] || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

const checks = ["/api/health", "/api/ready"];
let failed = false;

for (const path of checks) {
  try {
    const response = await fetch(`${baseUrl}${path}`);
    const body = await response.text();
    const isHealthy = path === "/api/health" ? response.ok : response.status < 500;
    console.log(`${isHealthy ? "PASS" : "FAIL"} ${path} (${response.status}) ${body}`);
    if (!isHealthy) failed = true;
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

if (failed) process.exitCode = 1;
