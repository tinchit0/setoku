import { useEffect, useMemo, useRef } from "react";
import { useStore } from "./state/store";
import { SudokuGrid } from "./components/SudokuGrid";
import { ConstraintPanel } from "./components/ConstraintPanel";
import { PlayPanel } from "./components/PlayPanel";
import { StatusPanel } from "./components/StatusPanel";
import { SaveLoadBar } from "./components/SaveLoadBar";
import { solvePuzzle } from "./solver/solver";

export default function App() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const constraints = useStore((s) => s.constraints);
  const setSolveStatus = useStore((s) => s.setSolveStatus);
  const solveStatus = useStore((s) => s.solveStatus);

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

  const solutionGrid = useMemo(
    () => (solveStatus.state === "unique" ? solveStatus.solution : undefined),
    [solveStatus],
  );

  return (
    <div className="app">
      <div className="topbar">
        <h1>Variant Sudoku Builder</h1>
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
        <SaveLoadBar />
      </div>

      <div className="board-area">
        <SudokuGrid solutionGrid={solutionGrid} />
      </div>

      <div className="sidebar">
        <StatusPanel />
        {mode === "build" ? <ConstraintPanel /> : <PlayPanel />}
      </div>
    </div>
  );
}
