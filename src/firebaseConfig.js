import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
const firebaseConfig = {
  apiKey: "AIzaSyAKHxOgIFelgPshx2LyY5mAqAK8cBrMlZs",
  authDomain: "bhejochalo-3d292.firebaseapp.com",
  projectId: "bhejochalo-3d292",
  storageBucket: "bhejochalo-3d292.firebasestorage.app",
  messagingSenderId: "528917615335",
  appId: "1:528917615335:web:283e2edf0f601d47cac842",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app, "us-central1"); // ✅ match region
export const callSaveTraveler = httpsCallable(functions, "saveTraveler");
export { db };