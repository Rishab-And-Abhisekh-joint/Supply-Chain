import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBlxWnsCc4D2IPdGkLK1980sBGV3Ll9iRk",
  authDomain: "supplychainai-cdqvg.firebaseapp.com",
  projectId: "supplychainai-cdqvg",
  storageBucket: "supplychainai-cdqvg.appspot.com",
  messagingSenderId: "348749817829",
  appId: "1:348749817829:web:14cc068ab6dea01527310c"
};

console.log("Firebase Config:", firebaseConfig);

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  app = getApp();
  console.log("Existing Firebase app retrieved.");
}

const auth = getAuth(app);

export { app, auth };
