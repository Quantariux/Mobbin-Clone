import { createContext, useContext, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "./supabase";
import AuthModal from "../components/AuthModal";

const AuthContext = createContext({
  user: null,
  loading: true,
  openAuth: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [modal, setModal] = useState(null); // null | "signin" | "signup"

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    openAuth: (mode = "signin") => setModal(mode),
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modal && <AuthModal mode={modal} onClose={() => setModal(null)} />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
