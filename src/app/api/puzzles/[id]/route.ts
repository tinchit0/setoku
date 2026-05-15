import { NextRequest, NextResponse } from "next/server";
import { ensureReady } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const db = await ensureReady();
  const { id } = await params;
  const result = await db.execute({ sql: "SELECT * FROM puzzle WHERE id = ?", args: [Number(id)] });
  if (result.rows.length === 0) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const r = result.rows[0];
  return NextResponse.json({ ...r, data: JSON.parse(r.data as string) });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const db = await ensureReady();
  const { id } = await params;
  const existing = await db.execute({ sql: "SELECT * FROM puzzle WHERE id = ?", args: [Number(id)] });
  if (existing.rows.length === 0) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const row = existing.rows[0];
  const body = await req.json();
  const title       = body.title       ?? row.title;
  const description = body.description ?? row.description;
  const data        = body.data        ?? JSON.parse(row.data as string);
  await db.execute({
    sql: "UPDATE puzzle SET title = ?, description = ?, data = ?, updated_at = datetime('now') WHERE id = ?",
    args: [title, description, JSON.stringify(data), Number(id)],
  });
  const updated = await db.execute({ sql: "SELECT * FROM puzzle WHERE id = ?", args: [Number(id)] });
  const r = updated.rows[0];
  return NextResponse.json({ ...r, data: JSON.parse(r.data as string) });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const db = await ensureReady();
  const { id } = await params;
  const existing = await db.execute({ sql: "SELECT * FROM puzzle WHERE id = ?", args: [Number(id)] });
  if (existing.rows.length === 0) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  await db.execute({ sql: "DELETE FROM puzzle WHERE id = ?", args: [Number(id)] });
  return new NextResponse(null, { status: 204 });
}
