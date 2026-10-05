import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TodosPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight">AuthTodo</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 font-medium">User</span>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <h2 className="text-2xl font-bold">My Todos</h2>

        <div className="flex gap-3">
          <Input placeholder="What needs to be done?" className="flex-1" readOnly />
          <Button>Add</Button>
        </div>

        <div className="space-y-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input type="checkbox" disabled className="w-5 h-5 rounded border-slate-300" />
                <span>Example Todo</span>
              </div>
              <div className="flex gap-2 text-sm">
                <Button size="sm" variant="outline">Edit</Button>
                <Button size="sm" variant="outline">Delete</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input type="checkbox" disabled checked className="w-5 h-5 rounded border-slate-300" />
                <span className="line-through text-slate-400">Another Example Todo</span>
              </div>
              <div className="flex gap-2 text-sm">
                <Button size="sm" variant="outline">Edit</Button>
                <Button size="sm" variant="outline">Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
