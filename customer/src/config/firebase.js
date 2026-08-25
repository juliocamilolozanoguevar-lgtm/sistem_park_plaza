import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB5A2nLykV2dmMoSV0aer6933-85HSCauo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "parkplaza-3b1e7.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "parkplaza-3b1e7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "parkplaza-3b1e7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "890547793187",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:890547793187:web:7ea452fdd8f579ea9a3096"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export { auth, googleProvider, signInWithPopup };
