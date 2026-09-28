import crypto from 'node:crypto';
import { getAdminAuth, getAdminFirestore } from './firebaseAdmin.ts';

export const USER_ROLES = ['admin', 'supervisor', 'operator', 'auditor'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type AdminSessionPayload = {
  sub: string;
  role: UserRole;
  email?: string;
  iat: number;
  exp: number;
};

function getSessionSecret(): string {
  const value = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!value) {
    throw new Error('Missing required env: ADMIN_SESSION_SECRET');
  }
  if (/^(replace|your|my_|demo|example|fake|dummy|changeme|not-set|local-dev)/i.test(value)) {
    throw new Error('Environment value for ADMIN_SESSION_SECRET looks like a placeholder');
  }
  return value;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signToken(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createAdminSessionToken(payload: Omit<AdminSessionPayload, 'iat' | 'exp'>, ttlSeconds = 60 * 60): string {
  if (!payload.sub || !USER_ROLES.includes(payload.role)) {
    throw new Error('A valid authenticated user and role are required.');
  }

  const now = Math.floor(Date.now() / 1000);
  const session: AdminSessionPayload = { ...payload, iat: now, exp: now + ttlSeconds };
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify(session));
  const signingInput = `${header}.${body}`;
  return `${signingInput}.${signToken(signingInput, getSessionSecret())}`;
}

export function verifyAdminSessionToken(token: string): { valid: boolean; payload?: AdminSessionPayload; reason?: string } {
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
    return { valid: false, reason: 'Invalid session token format.' };
  }

  try {
    const [headerPart, payloadPart, signaturePart] = token.split('.');
    const expectedSignature = signToken(`${headerPart}.${payloadPart}`, getSessionSecret());
    const expected = Buffer.from(expectedSignature);
    const actual = Buffer.from(signaturePart);
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      return { valid: false, reason: 'Session token signature mismatch.' };
    }

    const header = JSON.parse(decodeBase64Url(headerPart)) as { alg?: string; typ?: string };
    const payload = JSON.parse(decodeBase64Url(payloadPart)) as AdminSessionPayload;
    const now = Math.floor(Date.now() / 1000);

    if (header.alg !== 'HS256' || header.typ !== 'JWT' || !payload.sub || !USER_ROLES.includes(payload.role)) {
      return { valid: false, reason: 'Unexpected token claims.' };
    }
    if (!Number.isInteger(payload.exp) || payload.exp <= now) {
      return { valid: false, reason: 'Session token expired.' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, reason: error instanceof Error ? error.message : 'Session token verification failed.' };
  }
}

export async function authenticateFirebaseUser(idToken: string) {
  if (!idToken.trim()) {
    throw new Error('Missing Firebase identity token.');
  }

  const decoded = await getAdminAuth().verifyIdToken(idToken, true);
  const userSnapshot = await getAdminFirestore().collection('users').doc(decoded.uid).get();
  const stored = userSnapshot.exists ? userSnapshot.data() : undefined;
  const role = stored?.role ?? decoded.role;

  if (!USER_ROLES.includes(role as UserRole) || stored?.disabled === true || decoded.disabled === true) {
    throw new Error('Your account is not provisioned for dashboard access.');
  }

  return {
    uid: decoded.uid,
    email: decoded.email,
    role: role as UserRole,
  };
}
