import { jsonResponse } from '@/lib/api';

export async function POST(req: Request) {
  return jsonResponse({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Password authentication is disabled. Sign in with the configured identity provider.'
      : 'Password authentication has been removed. Sign in with Firebase Auth.',
  }, 410);
}
