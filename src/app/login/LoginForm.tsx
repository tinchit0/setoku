"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function LoginFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailRef.current!.value,
          password: passwordRef.current!.value,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push(params.get("from") ?? "/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <span className="auth-logo">&gt; SETOKU_</span>
        <p className="auth-subtitle">// authenticate to continue</p>
      </div>
      <form onSubmit={onSubmit} className="auth-form">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" ref={emailRef} required autoFocus autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" ref={passwordRef} required autoComplete="current-password" />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="primary" disabled={busy}>
          {busy ? "..." : "Login"}
        </button>
      </form>
      <p className="auth-footer">
        No account?{" "}
        <Link href="/register" className="auth-link">Register</Link>
      </p>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <LoginFormInner />
    </Suspense>
  );
}
