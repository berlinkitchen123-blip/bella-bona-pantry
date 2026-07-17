import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCZJUrbaPd06YVm4xD2iOVD89-M_rl7Ylk",
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

// Initialize Auth (email/password + Google sign-in)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function createAuthAccount(email: string, tempPassword: string): Promise<string> {
  // Use a secondary app instance so admin stays logged in
  const secondaryApp = initializeApp(firebaseConfig, `secondary_${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword);
    const uid = cred.user.uid;
    await secondaryAuth.signOut();
    return uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}
