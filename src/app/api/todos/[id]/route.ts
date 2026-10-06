import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Todo from "@/models/Todo";
import { getAuthUserId } from "@/lib/auth-helper";
import mongoose from "mongoose";

function normalizeTodo(doc: any): { id: string; title: string; completed: boolean; createdAt: string; updatedAt: string; userId: string } {
  return {
    id: doc._id?.toString ? doc._id.toString() : String(doc._id),
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

function validateCompleted(completed: unknown): boolean {
  if (typeof completed !== "boolean") throw new Error("Completed must be a boolean");
  return completed;
}

function validatePatchBody(body: unknown): { title?: string; completed?: boolean } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid request body");
  }
  const obj = body as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 0) throw new Error("Empty patch body");
  const result: { title?: string; completed?: boolean } = {};
  for (const key of keys) {
    if (key === "title") {
      result.title = validateTitle(obj[key]);
    } else if (key === "completed") {
      result.completed = validateCompleted(obj[key]);
    } else {
      throw new Error(`Unknown field: ${key}`);
    }
  }
  return result;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try {
    userId = await getAuthUserId(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 });
    }
    const body = await req.json();
    const updates = validatePatchBody(body);
    await dbConnect();
    const todo = await Todo.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    ).lean();
    if (!todo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ todo: normalizeTodo(todo) });
  } catch (e: any) {
    if (e.message === "Title must be a string" || e.message === "Title cannot be empty" || e.message === "Title exceeds 200 characters" || e.message === "Completed must be a boolean" || e.message === "Invalid request body" || e.message === "Empty patch body" || e.message.startsWith("Unknown field")) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try {
    userId = await getAuthUserId(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 });
    }
    await dbConnect();
    const result = await Todo.findOneAndDelete({ _id: id, userId }).lean();
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}