"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Puzzle = {
  id: number;
  title: string;
  description: string;
  user_id: number | null;
  creator_username: string | null;
  created_at: string;
  updated_at: string;
};

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (res.status === 401) { window.location.href = "/login"; throw new Error("Unauthorized"); }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function PuzzlesPanel() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setPuzzles(await apiJson<Puzzle[]>("/api/puzzles"));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load puzzles");
    }
  };

  useEffect(() => { load(); }, []);

  const deletePuzzle = async (puzzle: Puzzle) => {
    if (!confirm(`Delete "${puzzle.title}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      await apiJson<void>(`/api/puzzles/${puzzle.id}`, { method: "DELETE" });
      setPuzzles((prev) => prev.filter((p) => p.id !== puzzle.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete puzzle");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-content">
      <div className="admin-section-header">
        <h2>// puzzles</h2>
        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{puzzles.length} total</span>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <div className="user-table">
        <div className="puzzle-table-head">
          <span>Title</span>
          <span>Creator</span>
          <span>Updated</span>
          <span></span>
        </div>
        {puzzles.length === 0 && !error && (
          <p style={{ color: "var(--text-dim)", fontSize: 12, padding: "12px 0" }}>No puzzles yet.</p>
        )}
        {puzzles.map((p) => (
          <div key={p.id} className="puzzle-admin-row">
            <span className="user-name">{p.title}</span>
            <span className="user-email">{p.creator_username ?? "—"}</span>
            <span className="user-date">{new Date(p.updated_at).toLocaleDateString()}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <Link
                href={`/build/${p.id}`}
                style={{ fontSize: 11, padding: "3px 8px", border: "1px solid var(--border)", borderRadius: 2, color: "var(--text-dim)", textDecoration: "none" }}
              >
                Edit
              </Link>
              <button
                className="danger"
                onClick={() => deletePuzzle(p)}
                disabled={busy}
                style={{ fontSize: 11, padding: "3px 8px" }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
