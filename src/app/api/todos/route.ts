import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Todo from "@/models/Todo";
import { getAuthUserId } from "@/lib/auth-helper";

function normalizeTodo(doc: any): { id: string; title: string; completed: boolean; createdAt: string; updatedAt: string; userId: string } {
  return {
    id: doc._id?.toString() || doc.id,
    title: doc.title,
    completed: doc.completed,
    createdAt: doc.createdAt?.toISOString ? doc.createdAt.toISOString() : String(doc.createdAt),
    updatedAt: doc.updatedAt?.toISOString ? doc.updatedAt.toISOString() : String(doc.updatedAt),
    userId: doc.userId?.toString ? doc.userId.toString() : String(doc.userId),
  };
}

function validateTitle(title: unknown): string {
  if (typeof title !== "string") throw new Error("Title must be a string");
  const trimmed = title.trim();
  if (trimmed.length === 0) throw new Error("Title cannot be empty");
  if (trimmed.length > 200) throw new Error("Title exceeds 200 characters");
  return trimmed;
}

export async function GET(req: NextRequest) {
  let userId: string;
  try {
    userId = await getAuthUserId(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await dbConnect();
    const todos = await Todo.find({ userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ todos: todos.map(normalizeTodo) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await getAuthUserId(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const title = validateTitle(body.title);
    await dbConnect();
    const todo = await Todo.create({ userId, title, completed: false });
    const normalized = normalizeTodo(todo.toObject ? todo.toObject() : todo);
    return NextResponse.json({ todo: normalized }, { status: 201 });
  } catch (e: any) {
    if (e.message === "Title must be a string" || e.message === "Title cannot be empty" || e.message === "Title exceeds 200 characters") {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}