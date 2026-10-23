import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = initial loading
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const isConfigured = Boolean(supabase);

  // Fetch server profile if authenticated
  const fetchProfile = async (token) => {
    if (!token) return;
    try {
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {
      // Non-fatal if offline or profile route fails
    }
  };

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setSession(null);
      return;
    }

    // Check existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.access_token) {
        fetchProfile(data.session.access_token);
      }
    });

    // Listen to auth state transitions
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.access_token) {
        fetchProfile(currentSession.access_token);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function signInWithEmail(email, password) {
    if (!supabase) {
      throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env");
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUpWithEmail(email, password) {
    if (!supabase) {
      throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env");
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  function getToken() {
    return session?.access_token ?? null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isConfigured,
        isLoading: user === undefined,
        isAuthenticated: Boolean(user),
        signInWithEmail,
        signUpWithEmail,
        signOut,
        getToken,
        refreshProfile: () => fetchProfile(session?.access_token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
