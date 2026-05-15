import { NextRequest, NextResponse } from "next/server";
import { ensureReady } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

async function getPuzzleRow(db: Awaited<ReturnType<typeof ensureReady>>, id: number) {
  const result = await db.execute({ sql: "SELECT * FROM puzzle WHERE id = ?", args: [id] });
  return result.rows[0] ?? null;
}

function canAccess(row: Record<string, unknown>, userId: number, role: string): boolean {
  return role === "admin" || row.user_id === userId || row.user_id === null;
}

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await ensureReady();
  const { id } = await params;
  const row = await getPuzzleRow(db, Number(id));
  if (!row) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  if (!canAccess(row as Record<string, unknown>, user.id, user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ ...row, data: JSON.parse(row.data as string) });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await ensureReady();
  const { id } = await params;
  const row = await getPuzzleRow(db, Number(id));
  if (!row) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  if (!canAccess(row as Record<string, unknown>, user.id, user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await ensureReady();
  const { id } = await params;
  const row = await getPuzzleRow(db, Number(id));
  if (!row) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  if (!canAccess(row as Record<string, unknown>, user.id, user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.execute({ sql: "DELETE FROM puzzle WHERE id = ?", args: [Number(id)] });
  return new NextResponse(null, { status: 204 });
}
