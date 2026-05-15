import { NextRequest, NextResponse } from "next/server";
import { ensureReady } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await ensureReady();
  const sql =
    user.role === "admin"
      ? `SELECT p.*, u.username AS creator_username FROM puzzle p LEFT JOIN user u ON u.id = p.user_id ORDER BY p.updated_at DESC`
      : "SELECT * FROM puzzle WHERE user_id = ? ORDER BY updated_at DESC";
  const args = user.role === "admin" ? [] : [user.id];
  const result = await db.execute({ sql, args });
  const puzzles = result.rows.map((r) => ({ ...r, data: JSON.parse(r.data as string) }));
  return NextResponse.json(puzzles);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await ensureReady();
  const body = await req.json();
  const { title = "Untitled", description = "", data = {} } = body;
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: "INSERT INTO puzzle (title, description, data, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [title, description, JSON.stringify(data), user.id, now, now],
  });
  const row = await db.execute({
    sql: "SELECT * FROM puzzle WHERE id = ?",
    args: [Number(result.lastInsertRowid)],
  });
  const r = row.rows[0];
  return NextResponse.json({ ...r, data: JSON.parse(r.data as string) }, { status: 201 });
}
