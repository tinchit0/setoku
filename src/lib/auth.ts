import bcrypt from "bcryptjs";
import { ensureReady } from "./db";
import type { SessionUser } from "./session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getUserByEmail(email: string) {
  const db = await ensureReady();
  const r = await db.execute({ sql: "SELECT * FROM user WHERE email = ?", args: [email] });
  return r.rows[0] ?? null;
}

export async function getUserByUsername(username: string) {
  const db = await ensureReady();
  const r = await db.execute({ sql: "SELECT * FROM user WHERE username = ?", args: [username] });
  return r.rows[0] ?? null;
}

export async function countUsers(): Promise<number> {
  const db = await ensureReady();
  const r = await db.execute("SELECT COUNT(*) as n FROM user");
  return Number(r.rows[0].n);
}

export async function createUser(
  username: string,
  email: string,
  password: string,
  role: "admin" | "user" = "user",
) {
  const db = await ensureReady();
  const hash = await hashPassword(password);
  const result = await db.execute({
    sql: "INSERT INTO user (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
    args: [username, email, hash, role],
  });
  const row = await db.execute({
    sql: "SELECT * FROM user WHERE id = ?",
    args: [Number(result.lastInsertRowid)],
  });
  return row.rows[0];
}

export function toSessionUser(row: Record<string, unknown>): SessionUser {
  return {
    id: Number(row.id),
    username: row.username as string,
    email: row.email as string,
    role: row.role as "admin" | "user",
  };
}
