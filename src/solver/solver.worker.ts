import { solvePuzzle } from "./solver";
import type { Constraint } from "../types/constraints";

self.onmessage = (e: MessageEvent<{ constraints: Constraint[]; seq: number }>) => {
  const { constraints, seq } = e.data;
  const result = solvePuzzle(constraints);
  self.postMessage({ result, seq });
};
