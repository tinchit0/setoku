import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/session";
import { ensureReady } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

async function requireAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const userId = Number(id);
  const { role } = await req.json();

  if (role !== "admin" && role !== "user") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Prevent the last admin from being demoted
  if (role === "user") {
    const db = await ensureReady();
    const r = await db.execute({
      sql: "SELECT COUNT(*) as n FROM user WHERE role = 'admin' AND id != ?",
      args: [userId],
    });
    if (Number(r.rows[0].n) === 0) {
      return NextResponse.json({ error: "Cannot demote the last admin" }, { status: 400 });
    }
  }

  const db = await ensureReady();
  const existing = await db.execute({ sql: "SELECT * FROM user WHERE id = ?", args: [userId] });
  if (existing.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.execute({ sql: "UPDATE user SET role = ? WHERE id = ?", args: [role, userId] });
  const updated = await db.execute({
    sql: "SELECT id, username, email, role, created_at FROM user WHERE id = ?",
    args: [userId],
  });
  return NextResponse.json(updated.rows[0]);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const userId = Number(id);

  if (userId === admin.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const db = await ensureReady();
  const existing = await db.execute({ sql: "SELECT * FROM user WHERE id = ?", args: [userId] });
  if (existing.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.execute({ sql: "DELETE FROM puzzle WHERE user_id = ?", args: [userId] });
  await db.execute({ sql: "DELETE FROM user WHERE id = ?", args: [userId] });
  return new NextResponse(null, { status: 204 });
}
