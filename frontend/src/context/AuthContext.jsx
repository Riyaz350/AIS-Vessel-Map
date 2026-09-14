import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import posthog from '../lib/posthog';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
      } else {
        posthog.reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email, password) {
    if (!supabase) throw new Error('Authentication is not configured.');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    posthog.capture('user_signed_up', { email });
    return data;
  }

  async function signIn(email, password) {
    if (!supabase) throw new Error('Authentication is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data.user);
    posthog.capture('user_signed_in', { email });
    return data;
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    posthog.capture('user_signed_out');
  }

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
        isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
