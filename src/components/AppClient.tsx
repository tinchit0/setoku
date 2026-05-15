"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore, newId } from "../state/store";
import { SudokuGrid } from "./SudokuGrid";
import { ConstraintPanel } from "./ConstraintPanel";
import { PlayPanel } from "./PlayPanel";
import { StatusPanel } from "./StatusPanel";
import { SaveLoadBar } from "./SaveLoadBar";
import { HelpDialog } from "./HelpDialog";
import { CageSumDialog } from "./CageSumDialog";
import { isOrthAdjacent } from "../solver/solver";
import type { SolveResult } from "../solver/solver";
import type { CellPos } from "../types/constraints";

export default function AppClient() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const constraints = useStore((s) => s.constraints);
  const setSolveStatus = useStore((s) => s.setSolveStatus);
  const solveStatus = useStore((s) => s.solveStatus);
  const showDiff = useStore((s) => s.showDiff);
  const addConstraint = useStore((s) => s.addConstraint);
  const clearSelection = useStore((s) => s.clearSelection);
  const [helpOpen, setHelpOpen] = useState(false);
  const [cageDialogCells, setCageDialogCells] = useState<CellPos[] | null>(null);

  const solveTimer = useRef<number | null>(null);
  const solveSeq = useRef(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../solver/solver.worker.ts", import.meta.url), {
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
    if (constraints.length === 0) {
      setSolveStatus({ state: "idle" });
      return;
    }
    if (solveTimer.current !== null) window.clearTimeout(solveTimer.current);
    const mySeq = ++solveSeq.current;
    setSolveStatus({ state: "solving" });
    solveTimer.current = window.setTimeout(() => {
      workerRef.current?.postMessage({ constraints, seq: mySeq });
    }, 200) as unknown as number;
    return () => {
      if (solveTimer.current !== null) window.clearTimeout(solveTimer.current);
    };
  }, [constraints, setSolveStatus]);

  // Centralised keyboard handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (document.querySelector("dialog[open]")) return;

      const store = useStore.getState();
      const { selected, constraints: cs, draft, mode: currentMode } = store;

      // Arrow navigation — always active
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
        if (draft.bulb) store.resetDraft();
        else store.clearSelection();
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      // Skip Ctrl/Meta/Alt combos to avoid conflicting with browser shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (currentMode === "build") {
        const digit = /^[1-9]$/.test(e.key) ? parseInt(e.key, 10) : null;
        if (digit !== null && selected.length > 0) {
          e.preventDefault();
          for (const pos of selected) {
            const existing = cs.find((c) => c.kind === "given" && c.pos.r === pos.r && c.pos.c === pos.c);
            if (existing) store.removeConstraint(existing.id);
            store.addConstraint({ id: newId(), kind: "given", pos, digit });
          }
          return;
        }

        if ((e.key === "Delete" || e.key === "Backspace" || e.key === "0") && selected.length > 0) {
          e.preventDefault();
          for (const pos of selected) {
            const existing = cs.find((c) => c.kind === "given" && c.pos.r === pos.r && c.pos.c === pos.c);
            if (existing) store.removeConstraint(existing.id);
          }
          return;
        }

        const k = e.key.toLowerCase();

        if (k === "t") {
          e.preventDefault();
          if (selected.length >= 2) {
            store.addConstraint({ id: newId(), kind: "thermometer", cells: selected.slice() });
            store.clearSelection();
          }
          return;
        }

        if (k === "k") {
          e.preventDefault();
          if (selected.length > 0) setCageDialogCells(selected.slice());
          return;
        }

        if (k === "a") {
          e.preventDefault();
          if (!draft.bulb) {
            if (selected.length > 0) store.commitDraftBulb();
          } else {
            if (selected.length > 0) {
              store.addConstraint({ id: newId(), kind: "arrow", bulb: draft.bulb, path: selected.slice() });
              store.resetDraft();
              store.clearSelection();
            }
          }
          return;
        }

        if (e.key === "Enter" && draft.bulb && selected.length > 0) {
          e.preventDefault();
          store.addConstraint({ id: newId(), kind: "arrow", bulb: draft.bulb, path: selected.slice() });
          store.resetDraft();
          store.clearSelection();
          return;
        }

        if (k === "w" || k === "b") {
          e.preventDefault();
          if (selected.length === 2 && isOrthAdjacent(selected[0], selected[1])) {
            store.addConstraint({ id: newId(), kind: "kropki", a: selected[0], b: selected[1], color: k === "w" ? "white" : "black" });
            store.clearSelection();
          }
          return;
        }

        if (k === "v" || k === "x") {
          e.preventDefault();
          if (selected.length === 2 && isOrthAdjacent(selected[0], selected[1])) {
            store.addConstraint({ id: newId(), kind: "xv", a: selected[0], b: selected[1], mark: k as "v" | "x" });
            store.clearSelection();
          }
          return;
        }

        if (k === "e" || k === "i") {
          e.preventDefault();
          const parity = k === "e" ? "even" : "odd";
          for (const pos of selected) {
            const existing = cs.find((c) => c.kind === "parity" && c.pos.r === pos.r && c.pos.c === pos.c);
            if (existing) store.removeConstraint(existing.id);
            store.addConstraint({ id: newId(), kind: "parity", pos, parity });
          }
          if (selected.length > 0) store.clearSelection();
          return;
        }

        if (k === "d") {
          e.preventDefault();
          store.toggleDiagonal(e.shiftKey ? "anti" : "main");
          return;
        }

        if (k === "n") {
          e.preventDefault();
          if (e.shiftKey) store.toggleAntiKing();
          else store.toggleAntiKnight();
          return;
        }
      }

      // Play mode
      if (currentMode === "play" && selected.length > 0) {
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
  }, [setCageDialogCells, setHelpOpen]); // state setters are stable

  const solutionGrid = useMemo(() => {
    if (solveStatus.state === "unique") return solveStatus.solution;
    if (solveStatus.state === "multiple") return solveStatus.solutions[0];
    return undefined;
  }, [solveStatus]);

  const diffCells = useMemo(() => {
    if (solveStatus.state !== "multiple") return undefined;
    const [s1, s2] = solveStatus.solutions;
    const cells: { r: number; c: number; val1: number; val2: number }[] = [];
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (s1[r][c] !== s2[r][c]) cells.push({ r, c, val1: s1[r][c], val2: s2[r][c] });
    return cells;
  }, [solveStatus]);

  const handleCageConfirm = (cells: CellPos[], sum?: number) => {
    addConstraint({ id: newId(), kind: "cage", cells, sum });
    setCageDialogCells(null);
    clearSelection();
  };

  return (
    <div className="app">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <h1>SETOKU</h1>
          <div className="mode-switch">
            <button
              className={mode === "build" ? "active" : ""}
              onClick={() => setMode("build")}
            >
              Builder
            </button>
            <button
              className={mode === "play" ? "active" : ""}
              onClick={() => setMode("play")}
              disabled={solveStatus.state !== "unique"}
              title={
                solveStatus.state !== "unique"
                  ? "Needs a unique solution to play"
                  : "Play the puzzle"
              }
            >
              Play
            </button>
          </div>
        </div>
        <SaveLoadBar />
        <button
          onClick={() => setHelpOpen(true)}
          title="Constraint help (also: ?)"
          style={{ flexShrink: 0, fontWeight: 700, padding: "6px 11px" }}
        >
          ?
        </button>
      </div>
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <CageSumDialog
        cells={cageDialogCells}
        onConfirm={handleCageConfirm}
        onCancel={() => setCageDialogCells(null)}
      />

      <div className="board-area">
        <SudokuGrid solutionGrid={solutionGrid} diffCells={showDiff ? diffCells : undefined} />
      </div>

      <div className="sidebar">
        <StatusPanel />
        {mode === "build" ? <ConstraintPanel /> : <PlayPanel />}
      </div>
    </div>
  );
}
