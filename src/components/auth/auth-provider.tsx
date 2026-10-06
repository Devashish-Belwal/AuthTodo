"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AuthCtx {
  accessToken: string | null;
  user: { id: string; email: string; name: string; avatarUrl?: string } | null;
  loading: boolean;
  setAccessToken: (t: string | null) => void;
  setUser: (u: AuthCtx["user"]) => void;
  setLoading: (l: boolean) => void;
  refresh: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

import { performRefresh } from "@/lib/refresh-flight";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthCtx["user"]>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (): Promise<boolean> => {
    const token = await performRefresh();
    if (token) {
      setAccessToken(token);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAccessToken(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ accessToken, user, loading, setAccessToken, setUser, setLoading, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}
