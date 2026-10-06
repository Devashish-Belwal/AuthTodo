"use client";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthFetch } from "@/components/auth/auth-fetch";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

function TodoItem({
  todo,
  editingTodoId,
  editingTitle,
  onToggleComplete,
  onEdit,
  onUpdateEditingTitle,
  onSave,
  onCancel,
  onDelete,
  updatingTodoId,
  deletingTodoId,
  savingTodoId,
}: {
  todo: Todo;
  editingTodoId: string | null;
  editingTitle: string;
  onToggleComplete: (id: string, currentCompleted: boolean) => void;
  onEdit: (todo: Todo) => void;
  onUpdateEditingTitle: (title: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  updatingTodoId: string | null;
  deletingTodoId: string | null;
  savingTodoId: string | null;
}) {
  const isEditing = editingTodoId !== null && editingTodoId === todo.id;
  const isUpdating = updatingTodoId !== null && updatingTodoId === todo.id;
  const isDeleting = deletingTodoId !== null && deletingTodoId === todo.id;

  return (
    <Card className={`transition-all duration-200 hover:shadow-xl rounded-2xl border ${todo.completed ? "bg-slate-50/80 border-slate-200/60" : "bg-white border-slate-200/80 shadow-sm"}`}>
      <CardContent className="p-4 flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Checkbox
            id={`todo-check-${todo.id}`}
            checked={!!todo.completed}
            disabled={isUpdating}
            onCheckedChange={() => onToggleComplete(todo.id, !!todo.completed)}
            aria-label={`Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`}
          />
          {isEditing ? (
            <form
              className="flex-1 min-w-0"
              onSubmit={(e) => { e.preventDefault(); onSave(); }}
              onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onCancel(); } }}
            >
              <Input
                aria-label="Edit todo title"
                value={editingTitle}
                onChange={(e) => onUpdateEditingTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSave(); } if (e.key === "Escape") { e.preventDefault(); onCancel(); } }}
                className="flex-1 min-w-0"
                autoFocus
              />
            </form>
          ) : (
            <label htmlFor={`todo-check-${todo.id}`} className={`flex-1 min-w-0 break-words text-base sm:text-base leading-relaxed cursor-pointer ${todo.completed ? "text-slate-400 line-through" : "text-slate-800 font-medium"}`}>
              {todo.title}
            </label>
          )}
        </div>
        <div className="flex gap-2 ml-auto">
          {isEditing ? (
            <>
              <Button size="sm" variant="outline" onClick={onCancel} aria-label="Cancel edit" className="rounded-lg">Cancel</Button>
              <Button size="sm" variant="default" onClick={onSave} disabled={savingTodoId === todo.id} aria-label="Save edit" className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                {savingTodoId === todo.id ? "Saving…" : "Save"}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => onEdit(todo)} disabled={todo.completed || isDeleting} aria-label={`Edit "${todo.title}"`} className="rounded-lg text-xs sm:text-sm px-2.5 py-1.5">
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => onDelete(todo.id)} disabled={isDeleting} aria-label={`Delete "${todo.title}"`} className={`rounded-lg text-xs sm:text-sm px-2.5 py-1.5 ${isDeleting ? "text-rose-600 border-rose-200" : ""}`}>
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TodosPage() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const initRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [error, setError] = useState("");
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [updatingTodoId, setUpdatingTodoId] = useState<string | null>(null);
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);
  const [savingTodoId, setSavingTodoId] = useState<string | null>(null);

  useEffect(() => {
    if (initRef.current) return;
    let cancelled = false;
    const init = async () => {
      try {
        const res = await authFetch("/api/auth/me");
        if (res.ok) {
          if (!cancelled) {
            const data = await res.json();
            setUser(data.user || null);
            setIsReady(true);
          }
        } else if (!cancelled && typeof window !== "undefined" && window.location.pathname !== "/login") {
          router.replace("/login");
        }
      } catch {
        if (!cancelled && typeof window !== "undefined" && window.location.pathname !== "/login") {
          router.replace("/login");
        }
      } finally {
        if (!cancelled) initRef.current = true;
      }
    };
    init();
    return () => { cancelled = true; };
  }, [authFetch, router, setUser]);

  useEffect(() => {
    if (!isReady) return;
    (async () => {
      setIsLoadingTodos(true);
      try {
        const res = await authFetch("/api/todos");
        if (res.ok) {
          const data = await res.json();
          setTodos(data.todos || []);
        } else {
          setError("Failed to load todos");
        }
      } catch {
        setError("Failed to load todos");
      } finally {
        setIsLoadingTodos(false);
      }
    })();
  }, [isReady, authFetch]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError("Title cannot be empty");
      return;
    }
    setError("");
    setIsAddingTodo(true);
    try {
      const res = await authFetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        const { todo: newTodoRaw } = await res.json();
        setTodos(prev => [newTodoRaw, ...prev]);
        setNewTitle("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create todo");
      }
    } catch {
      setError("Failed to create todo");
    } finally {
      setIsAddingTodo(false);
    }
  }, [newTitle, authFetch]);

  const handleToggleComplete = useCallback(async (id: string, currentCompleted: boolean) => {
    setUpdatingTodoId(id);
    try {
      const res = await authFetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      if (res.ok) {
        const { todo: updatedTodo } = await res.json();
        setTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update todo");
      }
    } catch {
      setError("Failed to update todo");
    } finally {
      setUpdatingTodoId(null);
    }
  }, [authFetch]);

  const handleEdit = useCallback((todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingTitle(todo.title);
    setError("");
  }, []);

  const handleUpdateEditingTitle = useCallback((title: string) => {
    setEditingTitle(title);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingTodoId) return;
    if (!editingTitle.trim()) {
      setError("Title cannot be empty");
      return;
    }
    setSavingTodoId(editingTodoId);
    setError("");
    try {
      const res = await authFetch(`/api/todos/${editingTodoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });
      if (res.ok) {
        const { todo: updatedTodo } = await res.json();
        setTodos(prev => prev.map(t => t.id === editingTodoId ? updatedTodo : t));
        setEditingTodoId(null);
        setEditingTitle("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save edit");
      }
    } catch {
      setError("Failed to save edit");
    } finally {
      setSavingTodoId(null);
    }
  }, [editingTodoId, editingTitle, authFetch]);

  const handleCancelEdit = useCallback(() => {
    setEditingTodoId(null);
    setEditingTitle("");
    setError("");
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingTodoId(id);
    setError("");
    try {
      const res = await authFetch(`/api/todos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTodos(prev => prev.filter(t => t.id !== id));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete todo");
      }
    } catch {
      setError("Failed to delete todo");
    } finally {
      setDeletingTodoId(null);
    }
  }, [authFetch]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200/60 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">AuthTodo 2</h1>
          <p className="text-xs text-slate-500 font-medium">Your personal task dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 font-medium hidden sm:inline">{user?.name || "User"}</span>
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold" aria-label="User avatar">
            {(user?.name || "U").charAt(0)}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="rounded-lg text-xs sm:text-sm px-2.5 py-1.5 border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/30"
            aria-label="Log out"
          >
            Logout
          </Button>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">My Todos only mine</h2>
          <p className="text-slate-500 text-base">Stay organized. Create, complete, and manage your tasks.</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl shadow-sm" role="alert" aria-live="polite">
            <p className="text-rose-700 font-medium text-sm">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"
          aria-label="Create new todo"
        >
          <label htmlFor="new-todo-input" className="sr-only">New todo title</label>
          <Input
            id="new-todo-input"
            placeholder="What needs to be done?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 h-11 text-base"
            aria-required="true"
          />
          <Button
            type="submit"
            className="h-11 px-6 text-base font-semibold shadow-md shadow-blue-600/10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/40"
            disabled={isAddingTodo}
            aria-label="Add todo"
          >
            {isAddingTodo ? "Adding…" : "Add Todo"}
          </Button>
        </form>

        {isLoadingTodos ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading todos">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-16 rounded-2xl bg-slate-200/60 animate-pulse border-0" />
            ))}
          </div>
        ) : todos.length > 0 ? (
          <div className="space-y-3" role="list" aria-label="Todos">
            {todos.map((todo) => (
              <div key={todo.id} role="listitem">
                <TodoItem
                  todo={todo}
                  editingTodoId={editingTodoId}
                  editingTitle={editingTitle}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEdit}
                  onUpdateEditingTitle={handleUpdateEditingTitle}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  onDelete={handleDelete}
                  updatingTodoId={updatingTodoId}
                  deletingTodoId={deletingTodoId}
                  savingTodoId={savingTodoId}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-14 bg-white rounded-3xl border border-slate-200 shadow-sm" aria-label="Empty state">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No todos yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Create your first todo above to start organizing your tasks. You can edit, complete, or delete them anytime.</p>
          </div>
        )}
      </section>
    </main>
  );
}
