import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/session";
import { ensureReady } from "@/lib/db";
import { createUser } from "@/lib/auth";

async function requireAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = await ensureReady();
  const result = await db.execute(
    "SELECT id, username, email, role, created_at FROM user ORDER BY created_at ASC",
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { username, email, password, role = "user" } = await req.json();
  if (!username || !email || !password) {
    return NextResponse.json({ error: "username, email and password are required" }, { status: 400 });
  }
  try {
    const row = await createUser(username, email, password, role);
    const { password_hash: _, ...safe } = row as Record<string, unknown>;
    return NextResponse.json(safe, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Username or email already in use" }, { status: 409 });
  }
}
