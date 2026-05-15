import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getUserByUsername, createUser, countUsers, toSessionUser } from "@/lib/auth";
import { signToken, COOKIE_NAME, cookieOptions } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { username, email, password } = await req.json();

  if (!username || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (username.length < 3 || username.length > 32) {
    return NextResponse.json({ error: "Username must be 3–32 characters" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }
  if (await getUserByUsername(username)) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  // First user becomes admin
  const total = await countUsers();
  const role: "admin" | "user" = total === 0 ? "admin" : "user";

  const row = await createUser(username, email, password, role);
  const user = toSessionUser(row as Record<string, unknown>);
  const token = await signToken(user);

  const res = NextResponse.json(user, { status: 201 });
  res.cookies.set(COOKIE_NAME, token, cookieOptions());
  return res;
}
