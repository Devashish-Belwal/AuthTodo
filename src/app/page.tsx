import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardContent className="p-10 text-center space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">AuthTodo</h1>
          <p className="text-slate-500 text-lg">Simple Todo Manager</p>
          <Button className="w-full py-6 text-base font-semibold" variant="outline">Continue with Google</Button>
        </CardContent>
      </Card>
    </main>
  );
}
