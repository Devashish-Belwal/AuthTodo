"use client";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TodosPage() {
  const { accessToken, setAccessToken, setUser, setLoading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLoading(true);
    (async () => {
      let token = accessToken;
      if (!token) {
        const refreshRes = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data.accessToken) {
            token = data.accessToken;
            setAccessToken(token);
          }
        }
      }
      if (token) {
        try {
          const me = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
          if (me.ok) {
            const data = await me.json();
            setUser(data.user || null);
            setReady(true);
          } else {
            router.replace("/login");
          }
        } catch {
          router.replace("/login");
        }
      } else {
        router.replace("/login");
      }
      setLoading(false);
    })();
  }, [accessToken, setAccessToken, setUser, setLoading, router]);

  const { user, loading } = useAuth();
  if (loading || !ready) return <main className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</main>;
  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight">AuthTodo</h1>
        <div className="flex items-center gap-3"><span className="text-sm text-slate-600 font-medium">{user.name}</span></div>
      </header>
      <section className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <h2 className="text-2xl font-bold">My Todos</h2>
        <div className="flex gap-3"><Input placeholder="What needs to be done?" className="flex-1" readOnly /><Button>Add</Button></div>
        <div className="space-y-3">
          <Card className="hover:shadow-md transition-shadow"><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><input type="checkbox" disabled className="w-5 h-5 rounded border-slate-300" /><span>Example Todo</span></div><div className="flex gap-2 text-sm"><Button size="sm" variant="outline">Edit</Button><Button size="sm" variant="outline">Delete</Button></div></CardContent></Card>
          <Card className="hover:shadow-md transition-shadow"><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><input type="checkbox" disabled checked className="w-5 h-5 rounded border-slate-300" /><span className="line-through text-slate-400">Another Example Todo</span></div><div className="flex gap-2 text-sm"><Button size="sm" variant="outline">Edit</Button><Button size="sm" variant="outline">Delete</Button></div></CardContent></Card>
        </div>
      </section>
    </main>
  );
}
