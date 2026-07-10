import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import { auth, googleProvider, db } from '../firebase';
import type { User } from '../types';

const ADMIN_EMAIL = 'berlinkitchen123@gmail.com';

interface ProfileDetails {
  name: string;
  company: string;
  companyAddress: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signupWithEmail: (email: string, password: string, details: ProfileDetails) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  completeProfile: (details: ProfileDetails) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function roleForEmail(email: string): 'admin' | 'customer' {
  return email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'customer';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const profileRef = ref(db, `users/${fbUser.uid}`);
      unsubscribeProfile = onValue(profileRef, (snapshot) => {
        const profile = snapshot.val();
        const role = roleForEmail(fbUser.email || '');

        if (!profile) {
          // First sign-in via Google — seed a minimal profile; company info collected on Complete Profile page.
          const seeded: User = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || (fbUser.email || '').split('@')[0],
            company: '',
            companyAddress: '',
            role,
          };
          set(profileRef, seeded);
          setUser(seeded);
        } else {
          setUser({ ...profile, uid: fbUser.uid, email: fbUser.email || profile.email, role } as User);
        }
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signupWithEmail = async (email: string, password: string, details: ProfileDetails) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profile: User = {
      uid: cred.user.uid,
      email,
      name: details.name,
      company: details.company,
      companyAddress: details.companyAddress,
      role: roleForEmail(email),
    };
    await set(ref(db, `users/${cred.user.uid}`), profile);
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const completeProfile = async (details: ProfileDetails) => {
    if (!user) throw new Error('Not signed in.');
    await set(ref(db, `users/${user.uid}`), { ...user, ...details });
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === 'admin',
        signupWithEmail,
        loginWithEmail,
        loginWithGoogle,
        completeProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
