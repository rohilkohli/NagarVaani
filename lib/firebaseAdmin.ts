import { applicationDefault, cert, getApps, getApp, initializeApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let firestore: Firestore | null = null;

function createAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return initializeApp({ credential: cert(serviceAccount) });
  }

  if (process.env.NODE_ENV === 'production' || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({ credential: applicationDefault() });
  }

  throw new Error('Firebase Admin credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.');
}

export function getAdminFirestore(): Firestore {
  if (!firestore) {
    firestore = getFirestore(createAdminApp());
  }

  return firestore;
}

export function getAdminAuth(): Auth {
  const app = getApps().length > 0 ? getApp() : createAdminApp();
  return getAuth(app);
}

export function getAdminStorageBucket() {
  return getStorage(getApps().length > 0 ? getApp() : createAdminApp()).bucket();
}
