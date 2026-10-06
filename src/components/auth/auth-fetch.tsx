"use client";
import { useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export function useAuthFetch() {
  const { accessToken, setAccessToken, setUser } = useAuth();

  const authFetch = useCallback(async (url: string, options?: RequestInit): Promise<Response> => {
    const headers = new Headers(options?.headers || {});
    const token = accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);

    let res = await fetch(url, { ...options, headers, credentials: "include" });

    if (res.status === 401) {
      const refreshRes = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      if (refreshRes.ok) {
        try {
          const data = await refreshRes.json();
          if (data.accessToken) {
            setAccessToken(data.accessToken);
            const retryHeaders = new Headers(options?.headers || {});
            retryHeaders.set("Authorization", `Bearer ${data.accessToken}`);
            res = await fetch(url, { ...options, headers: retryHeaders, credentials: "include" });
          } else {
            setAccessToken(null);
            setUser(null);
            window.location.href = "/login";
            throw new Error("Refresh missing token");
          }
        } catch {
          setAccessToken(null);
          setUser(null);
          window.location.href = "/login";
          throw new Error("Refresh parse failed");
        }
      } else {
        setAccessToken(null);
        setUser(null);
        window.location.href = "/login";
        throw new Error("Refresh failed");
      }
    }

    // If retried request also returns 401, do not refresh/retry again
    if (res.status === 401) {
      // Already retried once above; just return the final 401 response
      return res;
    }

    return res;
  }, [accessToken, setAccessToken]);

  return authFetch;
}
