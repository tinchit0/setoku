"use client";

import { useMemo } from "react";
import { useStore } from "../state/store";

export function StatusPanel() {
  const status = useStore((s) => s.solveStatus);
  const showSolution = useStore((s) => s.showSolution);
  const setShowSolution = useStore((s) => s.setShowSolution);
  const showDiff = useStore((s) => s.showDiff);
  const setShowDiff = useStore((s) => s.setShowDiff);

  const diffCount = useMemo(() => {
    if (status.state !== "multiple") return 0;
    const [s1, s2] = status.solutions;
    let count = 0;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (s1[r][c] !== s2[r][c]) count++;
    return count;
  }, [status]);

  let tag: { text: string; cls: string };
  let detail = "";
  switch (status.state) {
    case "idle":
      tag = { text: "—", cls: "dim" };
      detail = "Add constraints to evaluate.";
      break;
    case "solving":
      tag = { text: "Solving...", cls: "warn" };
      break;
    case "none":
      tag = { text: "No solution", cls: "err" };
      detail = "Constraints contradict.";
      break;
    case "unique":
      tag = { text: "Unique ✓", cls: "ok" };
      detail = "Puzzle is playable.";
      break;
    case "multiple":
      tag = { text: "Multiple", cls: "warn" };
      detail = `${diffCount} cell${diffCount !== 1 ? "s" : ""} differ between the two solutions found.`;
      break;
  }

  return (
    <div className="status-panel">
      <div className="status-line">
        <span style={{ color: "var(--text-dim)" }}>Solution</span>
        <span className={`status-tag ${tag.cls}`}>{tag.text}</span>
      </div>
      {detail && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{detail}</div>}
      {(status.state === "unique" || status.state === "multiple") && (
        <label style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={showSolution}
            onChange={(e) => setShowSolution(e.target.checked)}
          />
          Show solution (ghost)
          {status.state === "multiple" && (
            <span style={{ color: "var(--text-dim)" }}>· one of several</span>
          )}
        </label>
      )}
      {status.state === "multiple" && (
        <label style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={showDiff}
            onChange={(e) => setShowDiff(e.target.checked)}
          />
          Show undetermined cells
        </label>
      )}
    </div>
  );
}
