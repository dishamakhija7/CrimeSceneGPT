import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAH1b_7ercnpsoU9-4LQc1wVWHNjmYvXfg",
  authDomain: "crimescenegpt.firebaseapp.com",
  projectId: "crimescenegpt",
  storageBucket: "crimescenegpt.firebasestorage.app",
  messagingSenderId: "468084143300",
  appId: "1:468084143300:web:7da1abf773f0bb2eb3c591"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
