import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    (typeof window !== "undefined" ? (window as any).__ENV?.VITE_FIREBASE_API_KEY || (window as any).__ENV?.NEXT_PUBLIC_FIREBASE_API_KEY : "") ||
    "AIzaSyClH7DM6-Z60uUH7mEha5gwrbxRO_pyLRY",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    (typeof window !== "undefined" ? (window as any).__ENV?.VITE_FIREBASE_AUTH_DOMAIN : "") ||
    "nagarvaani-4a9c2.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    (typeof window !== "undefined" ? (window as any).__ENV?.VITE_FIREBASE_PROJECT_ID : "") ||
    "nagarvaani-4a9c2",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    (typeof window !== "undefined" ? (window as any).__ENV?.VITE_FIREBASE_STORAGE_BUCKET : "") ||
    "nagarvaani-4a9c2.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    (typeof window !== "undefined" ? (window as any).__ENV?.VITE_FIREBASE_MESSAGING_SENDER_ID : "") ||
    "31801776981",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    (typeof window !== "undefined" ? (window as any).__ENV?.VITE_FIREBASE_APP_ID : "") ||
    "1:31801776981:web:37019c3740cfcdd26c2ddc",
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

export default app;
