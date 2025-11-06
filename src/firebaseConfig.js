// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAKHxOgIFelgPshx2LyY5mAqAK8cBrMlZs",
  authDomain: "bhejochalo-3d292.firebaseapp.com",
  projectId: "bhejochalo-3d292",
  storageBucket: "bhejochalo-3d292.firebasestorage.app",
  messagingSenderId: "528917615335",
  appId: "1:528917615335:web:283e2edf0f601d47cac842",
  databaseURL: "https://bhejochalo-3d292-default-rtdb.firebaseio.com",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
