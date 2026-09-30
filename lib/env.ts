export type RequiredEnvOptions = {
  allowMissingClient?: boolean;
  environment?: 'development' | 'production' | 'test';
  /** When true the caller is running in APP_MODE=demo and production-only
   *  requirements (APP_URL, ADMIN_SESSION_SECRET, Firebase Admin credentials)
   *  are not enforced even if NODE_ENV=production. */
  isDemoMode?: boolean;
};

const PLACEHOLDER_PATTERNS = [
  /^my[_-]/i,
  /^your[_-]/i,
  /^demo$/i,
  /^replace[-_ ]?(?:with|me)/i,
  /^insert[-_ ]?your/i,
  /_key$/i,
  /_token$/i,
  /_secret$/i,
  /placeholder/i,
  /replace-me/i,
  /todo/i,
  /test$/i,
  /^nagarvaani$/i,
  /fake/i,
  /dummy/i,
  /^your[-_]?cloud[-_]?run[-_]?url\.(run\.app|app)$/i,
];

export function sanitizeRequiredValue(value: string | undefined, name: string): string {
  const sanitized = (value ?? '').trim();

  if (!sanitized) {
    throw new Error(`Missing required environment value: ${name}`);
  }

  const normalized = sanitized.toLowerCase();
  const looksPlaceholder = PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(sanitized)) ||
    normalized.includes('changeme') ||
    normalized.includes('not-set') ||
    normalized.includes('mock');

  if (looksPlaceholder) {
    throw new Error(`Environment value for ${name} looks like a placeholder: ${sanitized}`);
  }

  return sanitized;
}

/** Returns true when APP_MODE=demo is set in env (server-side). */
export function isDemoEnv(env: Record<string, string | undefined> = process.env): boolean {
  return String(env.APP_MODE || env.VITE_APP_MODE || '').trim().toLowerCase() === 'demo';
}

export function validateRequiredEnv(
  env: Record<string, string | undefined>,
  options: RequiredEnvOptions = {}
) {
  const { allowMissingClient = false, environment = process.env.NODE_ENV || 'development' } = options;

  // Demo mode relaxes all production-only constraints — judges open the live URL
  // with zero credentials other than optionally GEMINI_API_KEY.
  const demoMode = options.isDemoMode ?? isDemoEnv(env);

  // In demo mode GEMINI_API_KEY is optional (rule-based classifier is the fallback)
  const requiredServer: string[] = [];
  if (!demoMode) {
    // production requires GEMINI_API_KEY; development already warns-not-throws
    if (environment === 'production') {
      requiredServer.push('GEMINI_API_KEY');
    } else {
      requiredServer.push('GEMINI_API_KEY');
    }
  }

  // APP_URL and ADMIN_SESSION_SECRET are only required in live production
  if (environment === 'production' && !demoMode) {
    requiredServer.push('APP_URL', 'ADMIN_SESSION_SECRET');
  }

  const requiredClient = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_GOOGLE_MAPS_API_KEY',
  ];

  const isProduction = environment === 'production';
  // In demo mode Firebase client config is optional (sandbox uses in-memory store)
  const checkClient = !demoMode && (isProduction || !allowMissingClient);
  const varsToCheck = [...requiredServer, ...(checkClient ? requiredClient : [])];

  const values: Record<string, string> = {};

  for (const key of varsToCheck) {
    if (!env[key]) {
      if ((environment === 'production' || !allowMissingClient) && !demoMode) {
        values[key] = sanitizeRequiredValue(env[key], key);
      } else {
        console.warn(`Environment variable ${key} is not set. Running in ${demoMode ? 'demo' : 'development'} mode with degraded functionality.`);
        values[key] = '';
      }
      continue;
    }

    values[key] = sanitizeRequiredValue(env[key], key);
  }

  // Firebase Admin credentials: required only in live production (not demo)
  if (environment === 'production' && !demoMode) {
    if (!env.FIREBASE_SERVICE_ACCOUNT_JSON && !env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('Missing required Firebase Admin credentials: FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS');
    }
  }

  return values;
}

export function getSafeEnvironment(env: Record<string, string | undefined> = process.env) {
  return {
    NODE_ENV: env.NODE_ENV || 'development',
    APP_MODE: env.APP_MODE || 'live',
    GEMINI_API_KEY: env.GEMINI_API_KEY ? 'configured' : 'missing',
    APP_URL: env.APP_URL || 'missing',
    VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY ? 'configured' : 'missing',
    VITE_GOOGLE_MAPS_API_KEY: env.VITE_GOOGLE_MAPS_API_KEY ? 'configured' : 'missing',
  };
}
