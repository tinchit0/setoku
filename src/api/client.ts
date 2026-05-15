import type { Constraint } from "../types/constraints";

export type PuzzleSummary = {
  id: number;
  title: string;
  description: string;
  data: { constraints: Constraint[] };
  created_at: string;
  updated_at: string;
};

const BASE = "/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  list: () => req<PuzzleSummary[]>("/puzzles"),
  get: (id: number) => req<PuzzleSummary>(`/puzzles/${id}`),
  create: (title: string, description: string, constraints: Constraint[]) =>
    req<PuzzleSummary>("/puzzles", {
      method: "POST",
      body: JSON.stringify({ title, description, data: { constraints } }),
    }),
  update: (id: number, patch: Partial<{ title: string; description: string; data: { constraints: Constraint[] } }>) =>
    req<PuzzleSummary>(`/puzzles/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    }),
  remove: (id: number) => req<void>(`/puzzles/${id}`, { method: "DELETE" }),
};
