"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { isOfficerRank } from "@/lib/ranks";

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  rank: string | null;
  phone: string | null;
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isOfficer: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isOfficer: false,
  login: async () => null,
  logout: async () => {},
  getToken: async () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseBrowser
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    role: data.role,
    rank: data.rank ?? null,
    phone: data.phone,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabaseBrowser.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const p = await fetchProfile(session.user.id);
          setProfile(p);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }, []);

  const logout = useCallback(async () => {
    await supabaseBrowser.auth.signOut();
    router.push("/");
  }, [router]);

  const getToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const isAdmin = profile?.role === "admin";
  // Officers can triage maintenance requests alongside admins.
  const isOfficer = isAdmin || isOfficerRank(profile?.rank);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isAdmin, isOfficer, login, logout, getToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}
