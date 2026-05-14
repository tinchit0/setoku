import type { Constraint } from "./constraints";

export type Entry = {
  digit?: number;
  corner: number[];
  center: number[];
};

export type PuzzleData = {
  constraints: Constraint[];
};

export type SolveStatus =
  | { state: "idle" }
  | { state: "solving" }
  | { state: "none" }
  | { state: "unique"; solution: number[][] }
  | { state: "multiple"; solutions: [number[][], number[][]] };
