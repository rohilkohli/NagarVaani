export type RuntimeMode = 'live' | 'demo';

function getRuntimeEnv() {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env;
  }

  if (typeof process !== 'undefined') {
    return process.env;
  }

  return {} as Record<string, string | undefined>;
}

export function hasLiveFirebaseConfig(env: Record<string, string | undefined> = getRuntimeEnv()): boolean {
  const requiredKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  return requiredKeys.every((key) => {
    const value = env[key];
    if (!value || !value.trim()) return false;
    const normalized = value.trim().toLowerCase();
    return !/(demo|dummy|placeholder|example|replace-me|not-set|fake|changeme)/i.test(normalized);
  });
}

export function getRuntimeMode(env: Record<string, string | undefined> = getRuntimeEnv()): RuntimeMode {
  const explicitMode = String(env.APP_MODE || env.VITE_APP_MODE || '').trim().toLowerCase();
  if (explicitMode === 'live') return 'live';
  if (explicitMode === 'demo') return 'demo';

  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return hasLiveFirebaseConfig(env) ? 'live' : 'demo';
  }

  return hasLiveFirebaseConfig(env) ? 'live' : 'demo';
}

export function isLiveDataConfigured(): boolean {
  return getRuntimeMode() === 'live';
}

export function isDemoMode(): boolean {
  return getRuntimeMode() === 'demo';
}
