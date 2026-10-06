"use client";
import { useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { performRefresh } from "@/lib/refresh-flight";

export function useAuthFetch() {
  const { accessToken, setAccessToken, setUser } = useAuth();

  const authFetch = useCallback(async (url: string, options?: RequestInit): Promise<Response> => {
    const headers = new Headers(options?.headers || {});
    const token = accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);

    let res = await fetch(url, { ...options, headers, credentials: "include" });

    if (res.status === 401) {
      const newToken = await performRefresh();
      if (newToken) {
        setAccessToken(newToken);
        const retryHeaders = new Headers(options?.headers || {});
        retryHeaders.set("Authorization", `Bearer ${newToken}`);
        res = await fetch(url, { ...options, headers: retryHeaders, credentials: "include" });
      } else {
        setAccessToken(null);
        setUser(null);
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        throw new Error("Refresh failed");
      }
    }

    if (res.status === 401) {
      return res;
    }

    return res;
  }, [accessToken, setAccessToken]);

  return authFetch;
}
