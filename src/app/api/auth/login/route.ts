import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, verifyPassword, toSessionUser } from "@/lib/auth";
import { signToken, COOKIE_NAME, cookieOptions } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const row = await getUserByEmail(email);
  if (!row) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, row.password_hash as string);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const user = toSessionUser(row as Record<string, unknown>);
  const token = await signToken(user);

  const res = NextResponse.json(user);
  res.cookies.set(COOKIE_NAME, token, cookieOptions());
  return res;
}
