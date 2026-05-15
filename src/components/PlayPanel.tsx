"use client";

import { useMemo } from "react";
import { useStore, posKey } from "../state/store";

export function PlayPanel() {
  const selected = useStore((s) => s.selected);
  const entries = useStore((s) => s.entries);
  const constraints = useStore((s) => s.constraints);
  const solveStatus = useStore((s) => s.solveStatus);
  const setEntry = useStore((s) => s.setEntry);
  const toggleCornerMark = useStore((s) => s.toggleCornerMark);
  const toggleCenterMark = useStore((s) => s.toggleCenterMark);
  const clearAllEntries = useStore((s) => s.clearAllEntries);
  const pencilMode = useStore((s) => s.pencilMode);
  const setPencilMode = useStore((s) => s.setPencilMode);

  const givens = useMemo(
    () => new Set(constraints.filter((c) => c.kind === "given").map((c) => posKey(c.pos))),
    [constraints],
  );

  const onDigit = (d: number) => {
    for (const pos of selected) {
      if (givens.has(posKey(pos))) continue;
      if (pencilMode === "corner") toggleCornerMark(pos, d);
      else if (pencilMode === "center") toggleCenterMark(pos, d);
      else setEntry(pos, d);
    }
  };

  const onClear = () => {
    for (const pos of selected) {
      if (givens.has(posKey(pos))) continue;
      setEntry(pos, undefined);
    }
  };

  const { complete, correct } = useMemo(() => {
    if (solveStatus.state !== "unique") return { complete: false, correct: false };
    const sol = solveStatus.solution;
    let filled = 0;
    let wrong = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const k = posKey({ r, c });
        if (givens.has(k)) {
          filled++;
          continue;
        }
        const e = entries[k];
        if (e?.digit !== undefined) {
          filled++;
          if (e.digit !== sol[r][c]) wrong++;
        }
      }
    }
    return { complete: filled === 81, correct: wrong === 0 };
  }, [entries, givens, solveStatus]);

  return (
    <>
      <div>
        <h2>Play mode</h2>
        <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "8px 0" }}>
          Select cells (click/arrows) and enter digits. Shortcuts:
          <br />· digit = value
          <br />· <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + digit = corner mark
          <br />· <kbd>Shift</kbd> + digit = center mark
        </p>
      </div>

      <div>
        <div className="toolbar-row" style={{ marginBottom: 8 }}>
          <button
            className={pencilMode === "digit" ? "active" : ""}
            onClick={() => setPencilMode("digit")}
          >
            Digit
          </button>
          <button
            className={pencilMode === "corner" ? "active" : ""}
            onClick={() => setPencilMode("corner")}
          >
            Corner
          </button>
          <button
            className={pencilMode === "center" ? "active" : ""}
            onClick={() => setPencilMode("center")}
          >
            Center
          </button>
        </div>
        <div className="digit-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button key={d} onClick={() => onDigit(d)} disabled={selected.length === 0}>
              {d}
            </button>
          ))}
          <button onClick={onClear} disabled={selected.length === 0} className="danger">
            ⌫
          </button>
        </div>
      </div>

      <div className="status-panel">
        <div className="status-line">
          <span style={{ color: "var(--text-dim)" }}>Progress</span>
          {solveStatus.state === "unique" ? (
            complete && correct ? (
              <span className="status-tag ok">Solved!</span>
            ) : complete && !correct ? (
              <span className="status-tag err">Has errors</span>
            ) : !correct ? (
              <span className="status-tag warn">Errors in cells</span>
            ) : (
              <span className="status-tag dim">In progress</span>
            )
          ) : (
            <span className="status-tag dim">—</span>
          )}
        </div>
        <button onClick={clearAllEntries}>Clear all</button>
      </div>
    </>
  );
}
