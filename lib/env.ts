export type RequiredEnvOptions = {
  allowMissingClient?: boolean;
  environment?: 'development' | 'production' | 'test';
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

export function validateRequiredEnv(
  env: Record<string, string | undefined>,
  options: RequiredEnvOptions = {}
) {
  const { allowMissingClient = false, environment = process.env.NODE_ENV || 'development' } = options;

  const requiredServer = environment === 'production' ? ['GEMINI_API_KEY', 'APP_URL'] : ['GEMINI_API_KEY'];
  if (environment === 'production') {
    requiredServer.push('ADMIN_SESSION_SECRET');
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
  const varsToCheck = [...requiredServer, ...(isProduction || !allowMissingClient ? requiredClient : [])];

  const values: Record<string, string> = {};

  for (const key of varsToCheck) {
    if (!env[key]) {
      if (environment === 'production' || !allowMissingClient) {
        values[key] = sanitizeRequiredValue(env[key], key);
      } else {
        console.warn(`Environment variable ${key} is not set. Running in development mode with degraded functionality.`);
        values[key] = '';
      }
      continue;
    }

    values[key] = sanitizeRequiredValue(env[key], key);
  }

  if (environment === 'production' && !env.FIREBASE_SERVICE_ACCOUNT_JSON && !env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Missing required Firebase Admin credentials: FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS');
  }

  return values;
}

export function getSafeEnvironment(env: Record<string, string | undefined> = process.env) {
  return {
    NODE_ENV: env.NODE_ENV || 'development',
    GEMINI_API_KEY: env.GEMINI_API_KEY ? 'configured' : 'missing',
    APP_URL: env.APP_URL || 'missing',
    VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY ? 'configured' : 'missing',
    VITE_GOOGLE_MAPS_API_KEY: env.VITE_GOOGLE_MAPS_API_KEY ? 'configured' : 'missing',
  };
}
