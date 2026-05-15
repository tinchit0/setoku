"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type User = { id: number; username: string; role: "admin" | "user" };

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => null);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const isActive = (href: string) =>
    href === "/build" ? pathname.startsWith("/build") : pathname === href;

  return (
    <nav className="navbar">
      <Link href="/explore" className="navbar-logo">
        SETOKU
      </Link>
      <div className="navbar-links">
        <Link href="/explore" className={isActive("/explore") ? "active" : ""}>
          Explore
        </Link>
        <Link href="/build" className={isActive("/build") ? "active" : ""}>
          Build
        </Link>
        <Link href="/profile" className={isActive("/profile") ? "active" : ""}>
          Profile
        </Link>
        {user?.role === "admin" && (
          <Link href="/admin" className={isActive("/admin") ? "active" : ""}>
            Admin
          </Link>
        )}
      </div>
      {user && (
        <div className="navbar-user">
          <span className="navbar-username">{user.username}</span>
          <button onClick={logout} style={{ padding: "4px 10px", fontSize: 11 }}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
