import { getSafeEnvironment, validateRequiredEnv } from "../lib/env";

const environment = (process.env.NODE_ENV || "production") as "development" | "production" | "test";

try {
  validateRequiredEnv(process.env, {
    environment,
    allowMissingClient: environment !== "production",
  });
  if (environment === "production") {
    const requiredProduction = [
      "APP_URL",
      "ADMIN_SESSION_SECRET",
      "INTERNAL_JOB_KEY",
      "FIREBASE_SERVICE_ACCOUNT_JSON",
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_PROJECT_ID",
      "VITE_FIREBASE_STORAGE_BUCKET",
      "VITE_FIREBASE_MESSAGING_SENDER_ID",
      "VITE_FIREBASE_APP_ID",
    ];
    const missing = requiredProduction.filter((key) => !process.env[key] && !(key === "FIREBASE_SERVICE_ACCOUNT_JSON" && process.env.GOOGLE_APPLICATION_CREDENTIALS));
    if (missing.length > 0) {
      throw new Error(`Missing production deployment values: ${missing.join(", ")}`);
    }
  }
  console.log(JSON.stringify({ status: "valid", environment, config: getSafeEnvironment() }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    status: "invalid",
    environment,
    error: error instanceof Error ? error.message : "Environment validation failed.",
  }, null, 2));
  process.exitCode = 1;
}
