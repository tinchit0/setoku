import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
}

export const COOKIE_NAME = "setoku-session";
const EXPIRE_DAYS = 7;

function getSecret() {
  const secret = process.env.SETOKU_AUTH_SECRET ?? "setoku-dev-secret-please-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRE_DAYS}d`)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: EXPIRE_DAYS * 24 * 60 * 60,
    path: "/",
  };
}

export async function getUserFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
