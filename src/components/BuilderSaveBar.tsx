"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "../state/store";
import { api } from "../api/client";

export function BuilderSaveBar() {
  const router = useRouter();
  const puzzleId = useStore((s) => s.puzzleId);
  const puzzleTitle = useStore((s) => s.puzzleTitle);
  const setPuzzleTitle = useStore((s) => s.setPuzzleTitle);
  const setPuzzleId = useStore((s) => s.setPuzzleId);
  const constraints = useStore((s) => s.constraints);
  const solveStatus = useStore((s) => s.solveStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      if (puzzleId === null) {
        const saved = await api.create(puzzleTitle || "Untitled", "", constraints);
        setPuzzleId(saved.id);
        router.push(`/build/${saved.id}`);
      } else {
        await api.update(puzzleId, { title: puzzleTitle || "Untitled", data: { constraints } });
      }
    } catch {
      setError("Save failed");
    } finally {
      setBusy(false);
    }
  };

  const canPlay = puzzleId !== null && solveStatus.state === "unique";

  return (
    <div className="save-load-bar">
      <input
        value={puzzleTitle}
        onChange={(e) => setPuzzleTitle(e.target.value)}
        placeholder="Untitled"
        onKeyDown={(e) => { if (e.key === "Enter") save(); }}
      />
      <button onClick={save} disabled={busy} className="primary" title="Save puzzle">
        {busy ? "…" : puzzleId === null ? "💾 Save" : "💾 Update"}
      </button>
      {canPlay ? (
        <Link
          href={`/play/${puzzleId}`}
          style={{
            padding: "6px 12px",
            fontSize: 12,
            border: "1px solid var(--ok)",
            borderRadius: 2,
            color: "var(--ok)",
            textDecoration: "none",
            whiteSpace: "nowrap",
            transition: "background 0.08s, color 0.08s",
          }}
        >
          ▶ Play
        </Link>
      ) : (
        <button disabled title={!puzzleId ? "Save first to play" : "Needs a unique solution"}>
          ▶ Play
        </button>
      )}
      {error && <span style={{ fontSize: 11, color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}
