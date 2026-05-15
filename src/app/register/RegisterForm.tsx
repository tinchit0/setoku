"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameRef.current!.value,
          email: emailRef.current!.value,
          password: passwordRef.current!.value,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <span className="auth-logo">&gt; SETOKU_</span>
        <p className="auth-subtitle">// create account</p>
      </div>
      <form onSubmit={onSubmit} className="auth-form">
        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" ref={usernameRef} required autoFocus minLength={3} maxLength={32} autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" ref={emailRef} required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" ref={passwordRef} required minLength={8} autoComplete="new-password" />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="primary" disabled={busy}>
          {busy ? "..." : "Create account"}
        </button>
      </form>
      <p className="auth-footer">
        Already have an account?{" "}
        <Link href="/login" className="auth-link">Login</Link>
      </p>
    </div>
  );
}
