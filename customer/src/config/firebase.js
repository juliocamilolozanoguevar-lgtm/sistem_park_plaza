import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB5A2nLykV2dmMoSV0aer6933-85HSCauo",
  authDomain: "parkplaza-3b1e7.firebaseapp.com",
  projectId: "parkplaza-3b1e7",
  storageBucket: "parkplaza-3b1e7.firebasestorage.app",
  messagingSenderId: "890547793187",
  appId: "1:890547793187:web:7ea452fdd8f579ea9a3096",
  measurementId: "G-W3RTZJDKRY"
};

const app = initializeApp(firebaseConfig);
let analytics;
// getAnalytics can fail in some environments (like node/SSR if not careful), 
// but this is standard React SPA so we just initialize it safely
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Analytics no pudo inicializarse", e);
}
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, googleProvider, signInWithPopup };
