import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBlxWnsCc4D2IPdGkLK1980sBGV3Ll9iR",
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
