"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; role: string; email: string } | null;
  login: (pass: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => false,
  logout: () => {},
  isLoading: true,
});

export const DEMO_PASSWORD = "aquamundo2026";
export const DEMO_USER = {
  name: "Juan Pérez",
  role: "Comercial",
  email: "jperez@aquamundo.pe",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ name: string; role: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("aquamundo_auth");
      if (stored === "true") {
        setIsAuthenticated(true);
        setUser(DEMO_USER);
      }
    } catch {
      // LocalStorage not available or SSR
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !pathname?.startsWith("/login")) {
        router.push("/login/");
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const login = (pass: string) => {
    if (pass === DEMO_PASSWORD || pass === "admin") {
      setIsAuthenticated(true);
      setUser(DEMO_USER);
      try {
        localStorage.setItem("aquamundo_auth", "true");
      } catch {}
      router.push("/comercial/clientes/");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    try {
      localStorage.removeItem("aquamundo_auth");
    } catch {}
    router.push("/login/");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
