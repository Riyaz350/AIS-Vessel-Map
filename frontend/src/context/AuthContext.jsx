import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import posthog from '../lib/posthog';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        posthog.identify(u.uid, { email: u.email });
      } else {
        posthog.reset();
      }
    });
    return () => unsub();
  }, []);

  async function signUp(email, password) {
    if (!auth) throw new Error('Authentication is not configured.');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    posthog.capture('user_signed_up', { email });
    return cred;
  }

  async function signIn(email, password) {
    if (!auth) throw new Error('Authentication is not configured.');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    posthog.capture('user_signed_in', { email });
    return cred;
  }

  async function signOut() {
    if (!auth) return;
    await firebaseSignOut(auth);
    posthog.capture('user_signed_out');
  }

  /** If authenticated, run the callback. Otherwise open the login modal. */
  function requireAuth(callback) {
    if (user) {
      callback();
    } else {
      setShowAuthModal(true);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        requireAuth,
        showAuthModal,
        setShowAuthModal,
        isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
