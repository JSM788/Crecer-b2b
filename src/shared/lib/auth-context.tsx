"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface UserProfile {
  username: string;
  name: string;
  role: "Gerencia" | "Finanzas" | "Operaciones Comerciales";
  email: string;
  initials: string;
  defaultRoute: string;
}

export const USERS_DB: Record<string, { pass: string; profile: UserProfile }> = {
  admin: {
    pass: "admin123",
    profile: {
      username: "admin",
      name: "Juan García",
      role: "Gerencia",
      email: "jgarcia@aquamundo.pe",
      initials: "JG",
      defaultRoute: "/inicio/",
    },
  },
  gerencia: {
    pass: "gerencia123",
    profile: {
      username: "gerencia",
      name: "Juan García",
      role: "Gerencia",
      email: "jgarcia@aquamundo.pe",
      initials: "JG",
      defaultRoute: "/inicio/",
    },
  },
  finanzas: {
    pass: "finanzas123",
    profile: {
      username: "finanzas",
      name: "Elena Castro",
      role: "Finanzas",
      email: "ecastro@aquamundo.pe",
      initials: "EC",
      defaultRoute: "/finanzas/",
    },
  },
  operaciones: {
    pass: "operaciones123",
    profile: {
      username: "operaciones",
      name: "Roberto Méndez",
      role: "Operaciones Comerciales",
      email: "rmendez@aquamundo.pe",
      initials: "RM",
      defaultRoute: "/comercial/clientes/",
    },
  },
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (username: string, pass: string) => boolean;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem("aquamundo_auth");
      const storedUsername = localStorage.getItem("aquamundo_username") || "admin";
      if (storedAuth === "true" && USERS_DB[storedUsername]) {
        setIsAuthenticated(true);
        setUser(USERS_DB[storedUsername].profile);
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

  const login = (usernameInput: string, passInput: string): boolean => {
    const cleanUser = (usernameInput || "").trim().toLowerCase();
    const cleanPass = (passInput || "").trim();

    // 1. Matches Operaciones Comerciales
    if (
      cleanUser === "operaciones" ||
      cleanUser === "operador" ||
      cleanPass === "operaciones123" ||
      (cleanUser.includes("opera") && cleanPass.includes("123"))
    ) {
      const opProfile = USERS_DB.operaciones.profile;
      setIsAuthenticated(true);
      setUser(opProfile);
      try {
        localStorage.setItem("aquamundo_auth", "true");
        localStorage.setItem("aquamundo_username", "operaciones");
      } catch {}
      router.push(opProfile.defaultRoute);
      return true;
    }

    // 2. Matches Finanzas
    if (
      cleanUser === "finanzas" ||
      cleanPass === "finanzas123" ||
      (cleanUser.includes("finan") && cleanPass.includes("123"))
    ) {
      const finProfile = USERS_DB.finanzas.profile;
      setIsAuthenticated(true);
      setUser(finProfile);
      try {
        localStorage.setItem("aquamundo_auth", "true");
        localStorage.setItem("aquamundo_username", "finanzas");
      } catch {}
      router.push(finProfile.defaultRoute);
      return true;
    }

    // 3. Matches Gerencia / Admin
    if (
      cleanUser === "admin" ||
      cleanUser === "gerencia" ||
      cleanPass === "admin123" ||
      cleanPass === "gerencia123" ||
      cleanPass === "aquamundo2026" ||
      cleanPass === "admin"
    ) {
      const adminProfile = USERS_DB.gerencia.profile;
      setIsAuthenticated(true);
      setUser(adminProfile);
      try {
        localStorage.setItem("aquamundo_auth", "true");
        localStorage.setItem("aquamundo_username", "gerencia");
      } catch {}
      router.push(adminProfile.defaultRoute);
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    try {
      localStorage.removeItem("aquamundo_auth");
      localStorage.removeItem("aquamundo_username");
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
