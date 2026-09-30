import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

const hasRequiredFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
const app = hasRequiredFirebaseConfig
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null;

export const db: Firestore = app ? getFirestore(app) : (undefined as unknown as Firestore);
export const auth: Auth = app ? getAuth(app) : (undefined as unknown as Auth);
export const storage: FirebaseStorage = app ? getStorage(app) : (undefined as unknown as FirebaseStorage);

export default app;
