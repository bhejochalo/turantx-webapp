// src/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";


const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "bhejochalo-3d292.firebaseapp.com",
  projectId: "bhejochalo-3d292",
  storageBucket: "bhejochalo-3d292.appspot.com",
  messagingSenderId: "528917615335",
  appId: "1:528917615335:web:d4e91a3b6f9f2337e5d5b3",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);

// Setup messaging safely (prevents crash on Safari)
export const messaging = (await isSupported())
  ? getMessaging(app)
  : null;