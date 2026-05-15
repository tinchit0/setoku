import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "./state/store";
import { SudokuGrid } from "./components/SudokuGrid";
import { ConstraintPanel } from "./components/ConstraintPanel";
import { PlayPanel } from "./components/PlayPanel";
import { StatusPanel } from "./components/StatusPanel";
import { SaveLoadBar } from "./components/SaveLoadBar";
import { HelpDialog } from "./components/HelpDialog";
import { solvePuzzle } from "./solver/solver";

export default function App() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const constraints = useStore((s) => s.constraints);
  const setSolveStatus = useStore((s) => s.setSolveStatus);
  const solveStatus = useStore((s) => s.solveStatus);
  const showDiff = useStore((s) => s.showDiff);
  const [helpOpen, setHelpOpen] = useState(false);

  const solveTimer = useRef<number | null>(null);
  const solveSeq = useRef(0);

  useEffect(() => {
    if (constraints.length === 0) {
      setSolveStatus({ state: "idle" });
      return;
    }
    if (solveTimer.current !== null) window.clearTimeout(solveTimer.current);
    const mySeq = ++solveSeq.current;
    setSolveStatus({ state: "solving" });
    solveTimer.current = window.setTimeout(() => {
      const result = solvePuzzle(constraints);
      if (mySeq !== solveSeq.current) return;
      if (result.state === "none") setSolveStatus({ state: "none" });
      else if (result.state === "unique")
        setSolveStatus({ state: "unique", solution: result.solution });
      else setSolveStatus({ state: "multiple", solutions: result.solutions });
    }, 200) as unknown as number;
    return () => {
      if (solveTimer.current !== null) window.clearTimeout(solveTimer.current);
    };
  }, [constraints, setSolveStatus]);

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

  return (
    <div className="app">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <h1>Setoku</h1>
          <div className="mode-switch">
            <button
              className={mode === "build" ? "active" : ""}
              onClick={() => setMode("build")}
            >
              Constructor
            </button>
            <button
              className={mode === "play" ? "active" : ""}
              onClick={() => setMode("play")}
              disabled={solveStatus.state !== "unique"}
              title={
                solveStatus.state !== "unique"
                  ? "Necesita una solución única para jugar"
                  : "Jugar el puzzle"
              }
            >
              Jugar
            </button>
          </div>
        </div>
        <SaveLoadBar />
        <button
          onClick={() => setHelpOpen(true)}
          title="Ayuda sobre las restricciones"
          style={{ flexShrink: 0, fontWeight: 700, padding: "6px 11px" }}
        >
          ?
        </button>
      </div>
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

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
