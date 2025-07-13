import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// IMPORTANT: This is a public sample configuration.
// Replace with your own project's configuration.
const firebaseConfig = {
  apiKey: "AIzaSyC0cE4aC0g8f2e4b6d8c0e4f2g6h2j4k2l",
  authDomain: "supplychainai-cdqvg.firebaseapp.com",
  projectId: "supplychainai-cdqvg",
  storageBucket: "supplychainai-cdqvg.appspot.com",
  messagingSenderId: "348749817829",
  appId: "1:348749817829:web:14cc068ab6dea01527310c"
};


// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
