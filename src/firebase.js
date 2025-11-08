// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "bhejochalo-3d292.firebaseapp.com",
  projectId: "bhejochalo-3d292",
  storageBucket: "bhejochalo-3d292.appspot.com",
  messagingSenderId: "528917615335",
  appId: "1:528917615335:web:d4e91a3b6f9f2337e5d5b3",
};

// ✅ Prevent multiple initializations during Hot Reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Firestore instance
export const db = getFirestore(app);
