"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
};

type CreateForm = { username: string; email: string; password: string; role: "admin" | "user" };

const emptyForm: CreateForm = { username: "", email: "", password: "", role: "user" };

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

export function UsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    try {
      setUsers(await apiJson<User[]>("/api/admin/users"));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    }
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    setBusy(true);
    setError(null);
    try {
      const updated = await apiJson<User>(`/api/admin/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async (user: User) => {
    if (!confirm(`Delete user "${user.username}"? Their puzzles will also be deleted.`)) return;
    setBusy(true);
    setError(null);
    try {
      await apiJson<void>(`/api/admin/users/${user.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setBusy(false);
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const created = await apiJson<User>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setUsers((prev) => [...prev, created]);
      setForm(emptyForm);
      setShowCreate(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-content">
      <div className="admin-section-header">
        <h2>// users</h2>
        <button onClick={() => setShowCreate((v) => !v)} className={showCreate ? "active" : ""}>
          {showCreate ? "✕ Cancel" : "+ New user"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={onCreate} className="admin-create-form">
          <div className="field">
            <label>Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
              minLength={3}
              maxLength={32}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
            />
          </div>
          <div className="field">
            <label>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "admin" | "user" }))}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {formError && <p className="auth-error">{formError}</p>}
          <div className="toolbar-row">
            <button type="submit" className="primary" disabled={busy}>Create</button>
            <button type="button" onClick={() => { setShowCreate(false); setForm(emptyForm); }}>Cancel</button>
          </div>
        </form>
      )}

      {error && <p className="auth-error">{error}</p>}

      <div className="user-table">
        <div className="user-table-head">
          <span>Username</span>
          <span>Email</span>
          <span>Role</span>
          <span>Joined</span>
          <span></span>
        </div>
        {users.length === 0 && !error && (
          <p style={{ color: "var(--text-dim)", fontSize: 12, padding: "12px 0" }}>No users yet.</p>
        )}
        {users.map((u) => (
          <div key={u.id} className="user-row">
            <span className="user-name">{u.username}</span>
            <span className="user-email">{u.email}</span>
            <button
              className={u.role === "admin" ? "active" : ""}
              onClick={() => toggleRole(u)}
              disabled={busy}
              title={u.role === "admin" ? "Click to demote to user" : "Click to promote to admin"}
              style={{ fontSize: 10, padding: "3px 8px", letterSpacing: "0.5px", textTransform: "uppercase" }}
            >
              {u.role}
            </button>
            <span className="user-date">{new Date(u.created_at).toLocaleDateString()}</span>
            <button
              className="danger"
              onClick={() => deleteUser(u)}
              disabled={busy}
              style={{ fontSize: 11, padding: "3px 8px" }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
