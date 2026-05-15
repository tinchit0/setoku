"use client";

import { useState } from "react";
import { UsersPanel } from "./UsersPanel";
import { PuzzlesPanel } from "./PuzzlesPanel";

type Tab = "users" | "puzzles";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="admin-page">
      <div className="admin-tabs">
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
          Users
        </button>
        <button className={tab === "puzzles" ? "active" : ""} onClick={() => setTab("puzzles")}>
          Puzzles
        </button>
      </div>
      {tab === "users" ? <UsersPanel /> : <PuzzlesPanel />}
    </div>
  );
}
