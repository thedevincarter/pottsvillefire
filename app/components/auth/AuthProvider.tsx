"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
  app_metadata?: {
    roles?: string[];
  };
  token?: {
    access_token: string;
    expires_at: number;
    expires_in: number;
    refresh_token: string;
    token_type: string;
  };
}

interface NetlifyIdentityAPI {
  init: (opts?: { APIUrl?: string }) => void;
  open: (tab?: "login" | "signup") => void;
  close: () => void;
  logout: () => Promise<void>;
  currentUser: () => User | null;
  on: (event: string, callback: (user?: User) => void) => void;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => void;
  signup: () => void;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  login: () => {},
  signup: () => {},
  logout: () => {},
  getToken: () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}

declare global {
  interface Window {
    netlifyIdentity?: NetlifyIdentityAPI;
  }
}

function getIdentity(): NetlifyIdentityAPI | null {
  if (typeof window !== "undefined" && window.netlifyIdentity) {
    return window.netlifyIdentity;
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The widget script and init() are called synchronously in
    // layout.tsx <head>, so it should already be available.
    // We just attach React-side listeners and read current user.
    function setup() {
      const identity = getIdentity();
      if (!identity) return false;

      identity.init({ APIUrl: "https://pottsvillefire.netlify.app/.netlify/identity" });
      const currentUser = identity.currentUser();
      if (currentUser) setUser(currentUser);
      setReady(true);
      setLoading(false);

      identity.on("login", (loggedInUser?: User) => {
        if (loggedInUser) setUser(loggedInUser);
        identity.close();
      });

      identity.on("logout", () => {
        setUser(null);
      });

      return true;
    }

    if (!setup()) {
      // Widget script may still be loading on slow connections
      const interval = setInterval(() => {
        if (setup()) clearInterval(interval);
      }, 50);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setLoading(false);
      }, 5000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, []);

  const login = useCallback(() => {
    getIdentity()?.open("login");
  }, [ready]);

  const signup = useCallback(() => {
    getIdentity()?.open("signup");
  }, [ready]);

  const logout = useCallback(() => {
    getIdentity()?.logout();
  }, [ready]);

  const getToken = useCallback(() => {
    return user?.token?.access_token ?? null;
  }, [user]);

  const isAdmin = user?.app_metadata?.roles?.includes("admin") ?? false;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, signup, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}
