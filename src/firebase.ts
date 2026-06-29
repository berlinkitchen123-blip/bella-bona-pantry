import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAGoSEWebkSJcbzAFHDV0O0ZdyLyHHqhb8",
  authDomain: "bellabona-pantry.firebaseapp.com",
  databaseURL: "https://bellabona-pantry-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bellabona-pantry",
  storageBucket: "bellabona-pantry.firebasestorage.app",
  messagingSenderId: "252713383826",
  appId: "1:252713383826:web:1b24933e8f83db2ded734b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);
