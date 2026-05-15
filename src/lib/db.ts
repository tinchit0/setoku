import { createClient } from "@libsql/client";
import path from "path";
import fs from "fs";

const g = globalThis as {
  _db?: ReturnType<typeof createClient>;
  _dbReady?: boolean;
};

function getClient() {
  if (!g._db) {
    const DB_PATH = process.env.SETOKU_DB_PATH ?? path.join(process.cwd(), "setoku.db");
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    g._db = createClient({ url: `file:${DB_PATH}` });
  }
  return g._db;
}

export async function ensureReady() {
  const db = getClient();
  if (g._dbReady) return db;

  await db.execute(`CREATE TABLE IF NOT EXISTS user (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at    TEXT DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS puzzle (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL DEFAULT 'Untitled',
    description TEXT NOT NULL DEFAULT '',
    data        TEXT NOT NULL DEFAULT '{}',
    user_id     INTEGER REFERENCES user(id),
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  )`);

  // Migration: add user_id to existing puzzle tables that don't have it
  try {
    await db.execute("ALTER TABLE puzzle ADD COLUMN user_id INTEGER REFERENCES user(id)");
  } catch {
    // Column already exists
  }

  g._dbReady = true;
  return db;
}
