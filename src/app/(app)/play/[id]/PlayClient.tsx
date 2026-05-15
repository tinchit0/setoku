"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../../../../state/store";
import { SudokuGrid } from "../../../../components/SudokuGrid";
import { PlayPanel } from "../../../../components/PlayPanel";
import { StatusPanel } from "../../../../components/StatusPanel";
import { HelpDialog } from "../../../../components/HelpDialog";
import type { SolveResult } from "../../../../solver/solver";
import type { Constraint } from "../../../../types/constraints";

type Props = {
  puzzleId: number;
  puzzleTitle: string;
  constraints: Constraint[];
};

export default function PlayClient({ puzzleId, puzzleTitle, constraints }: Props) {
  const setMode = useStore((s) => s.setMode);
  const loadPuzzle = useStore((s) => s.loadPuzzle);
  const setSolveStatus = useStore((s) => s.setSolveStatus);
  const solveStatus = useStore((s) => s.solveStatus);
  const storeConstraints = useStore((s) => s.constraints);
  const [helpOpen, setHelpOpen] = useState(false);

  const solveTimer = useRef<number | null>(null);
  const solveSeq = useRef(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    setMode("play");
    loadPuzzle(constraints, puzzleId, puzzleTitle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const worker = new Worker(new URL("../../../../solver/solver.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (e: MessageEvent<{ result: SolveResult; seq: number }>) => {
      const { result, seq } = e.data;
      if (seq !== solveSeq.current) return;
      if (result.state === "none") setSolveStatus({ state: "none" });
      else if (result.state === "unique")
        setSolveStatus({ state: "unique", solution: result.solution });
      else setSolveStatus({ state: "multiple", solutions: result.solutions });
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, [setSolveStatus]);

  useEffect(() => {
    if (storeConstraints.length === 0) {
      setSolveStatus({ state: "idle" });
      return;
    }
    if (solveTimer.current !== null) window.clearTimeout(solveTimer.current);
    const mySeq = ++solveSeq.current;
    setSolveStatus({ state: "solving" });
    solveTimer.current = window.setTimeout(() => {
      workerRef.current?.postMessage({ constraints: storeConstraints, seq: mySeq });
    }, 200) as unknown as number;
    return () => {
      if (solveTimer.current !== null) window.clearTimeout(solveTimer.current);
    };
  }, [storeConstraints, setSolveStatus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (document.querySelector("dialog[open]")) return;

      const store = useStore.getState();
      const { selected } = store;

      const arrowDelta: Record<string, [number, number]> = {
        ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
      };
      if (e.key in arrowDelta) {
        e.preventDefault();
        const [dr, dc] = arrowDelta[e.key];
        store.moveCursor(dr, dc, e.shiftKey);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        store.clearSelection();
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (selected.length > 0) {
        const digit = /^[1-9]$/.test(e.key) ? parseInt(e.key, 10) : null;
        if (digit !== null) {
          e.preventDefault();
          const { pencilMode } = store;
          if (pencilMode === "corner") {
            for (const pos of selected) store.toggleCornerMark(pos, digit);
          } else if (pencilMode === "center") {
            for (const pos of selected) store.toggleCenterMark(pos, digit);
          } else {
            for (const pos of selected) store.setEntry(pos, digit);
          }
          return;
        }
        if (e.key === "Delete" || e.key === "Backspace" || e.key === "0") {
          e.preventDefault();
          for (const pos of selected) store.setEntry(pos, undefined);
          return;
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setHelpOpen]);

  const solutionGrid = useMemo(() => {
    if (solveStatus.state === "unique") return solveStatus.solution;
    return undefined;
  }, [solveStatus]);

  return (
    <div className="app">
      <div className="topbar">
        <h2 className="puzzle-title">{puzzleTitle || "Untitled"}</h2>
        <button
          onClick={() => setHelpOpen(true)}
          title="Constraint help (also: ?)"
          style={{ flexShrink: 0, fontWeight: 700, padding: "6px 11px", marginLeft: "auto" }}
        >
          ?
        </button>
      </div>
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <div className="board-area">
        <SudokuGrid solutionGrid={solutionGrid} />
      </div>
      <div className="sidebar">
        <StatusPanel />
        <PlayPanel />
      </div>
    </div>
  );
}
