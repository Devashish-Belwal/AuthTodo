"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthFetch } from "@/components/auth/auth-fetch";

export default function LoginPage() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const [checking, setChecking] = useState(true);
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/auth/me");
        if (!cancelled && res.ok) {
          router.replace("/todos");
        }
      } catch {
        // ignore; stay on login
      } finally {
        if (!cancelled) {
          initDone.current = true;
          setChecking(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [authFetch, router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 sm:px-6" role="main" aria-busy="true">
        <Card className="w-full max-w-md shadow-xl border border-slate-200 bg-white rounded-3xl p-10 text-center space-y-6 animate-pulse">
          <div className="mx-auto w-10 h-10 rounded-xl bg-slate-200 mb-2" />
          <div className="h-6 bg-slate-200 rounded w-32 mx-auto" />
          <div className="h-10 bg-slate-200 rounded-xl w-full" />
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 sm:px-6" role="main">
      <Card className="w-full max-w-md shadow-xl border border-slate-200 bg-white rounded-3xl p-8 sm:p-10 space-y-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-md shadow-blue-600/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">AuthTodo</h1>
          <p className="text-slate-500">A focused space for your tasks.</p>
        </div>
        <div className="space-y-4">
          <a href="/api/auth/google" className="block">
            <Button type="button" className="w-full h-11 text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Continue with Google">
              <span className="flex items-center gap-3 justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </span>
            </Button>
          </a>
          <p className="text-xs text-slate-400 text-center">Secure sign-in via OAuth. No passwords stored.</p>
        </div>
      </Card>
    </main>
  );
}
