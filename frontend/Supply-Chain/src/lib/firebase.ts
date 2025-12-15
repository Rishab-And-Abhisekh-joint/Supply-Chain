// src/lib/firebase.ts
// Fixed Firebase initialization with SSR protection

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBlxWnsCc4D2IPdGkLK1980sBGV3Ll9iRg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "supplychainai-cdqvg.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "supplychainai-cdqvg",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "supplychainai-cdqvg.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "348749817829",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:348749817829:web:14cc068ab6dea01527310c"
};

// Initialize Firebase - with proper singleton pattern
function initializeFirebase(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

// Only initialize on client side
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (typeof window !== 'undefined') {
  try {
    app = initializeFirebase();
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

// For server-side, create a getter that will work when called on client
function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth is only available on the client side');
  }
  
  if (!auth) {
    app = initializeFirebase();
    auth = getAuth(app);
  }
  
  return auth;
}

// Export auth as a getter to ensure it's always initialized when accessed
export { app, auth, getFirebaseAuth };

// Default export for compatibility
export default { app, auth, getFirebaseAuth };