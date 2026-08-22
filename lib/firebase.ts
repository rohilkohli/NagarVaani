import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    (typeof window !== "undefined" ? (window as any).__ENV?.VITE_FIREBASE_API_KEY || (window as any).__ENV?.NEXT_PUBLIC_FIREBASE_API_KEY : "") ||
    "AIzaSyDummyKeyForInitialDevSetup1234567890",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    (typeof window !== "undefined" ? (window as any).__ENV?.VITE_FIREBASE_AUTH_DOMAIN : "") ||
    "nagarvaani-app.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    (typeof window !== "undefined" ? (window as any).__ENV?.VITE_FIREBASE_PROJECT_ID : "") ||
    "nagarvaani-app",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    (typeof window !== "undefined" ? (window as any).__ENV?.VITE_FIREBASE_STORAGE_BUCKET : "") ||
    "nagarvaani-app.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    (typeof window !== "undefined" ? (window as any).__ENV?.VITE_FIREBASE_MESSAGING_SENDER_ID : "") ||
    "1234567890",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    (typeof window !== "undefined" ? (window as any).__ENV?.VITE_FIREBASE_APP_ID : "") ||
    "1:1234567890:web:abcdef123456",
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

export default app;
