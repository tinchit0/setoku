import { NextRequest, NextResponse } from "next/server";
import { ensureReady } from "@/lib/db";

export async function GET() {
  const db = await ensureReady();
  const result = await db.execute("SELECT * FROM puzzle ORDER BY updated_at DESC");
  const puzzles = result.rows.map((r) => ({ ...r, data: JSON.parse(r.data as string) }));
  return NextResponse.json(puzzles);
}

export async function POST(req: NextRequest) {
  const db = await ensureReady();
  const body = await req.json();
  const { title = "Untitled", description = "", data = {} } = body;
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: "INSERT INTO puzzle (title, description, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    args: [title, description, JSON.stringify(data), now, now],
  });
  const row = await db.execute({
    sql: "SELECT * FROM puzzle WHERE id = ?",
    args: [Number(result.lastInsertRowid)],
  });
  const r = row.rows[0];
  return NextResponse.json({ ...r, data: JSON.parse(r.data as string) }, { status: 201 });
}
