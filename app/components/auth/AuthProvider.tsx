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
  login: () => void;
  signup: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  signup: () => {},
  logout: () => {},
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
    // Load the Netlify Identity widget via script tag
    const script = document.createElement("script");
    script.src = "https://identity.netlify.com/v1/netlify-identity-widget.js";
    script.async = true;
    script.onload = () => {
      const identity = getIdentity();
      if (!identity) {
        setLoading(false);
        return;
      }

      identity.init();
      setReady(true);

      const currentUser = identity.currentUser();
      if (currentUser) {
        setUser(currentUser);
      }
      setLoading(false);

      identity.on("login", (loggedInUser?: User) => {
        if (loggedInUser) setUser(loggedInUser);
        identity.close();
      });

      identity.on("logout", () => {
        setUser(null);
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
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

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
