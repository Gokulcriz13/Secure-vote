// lib/firebase.ts

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCRxEUH2idOh17c9KCOgHKzXca-4JoKSLQ",
  authDomain: "remote-voting-76822.firebaseapp.com",
  projectId: "remote-voting-76822",
  storageBucket: "remote-voting-76822.appspot.com", // ✅ Corrected here
  messagingSenderId: "766414828891",
  appId: "1:766414828891:web:bb28c28294589c1881567e",
  measurementId: "G-6K9KFBBFDE",
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Auth instance
const auth = getAuth(app);

export { auth, app };
