import { create } from "zustand";
import type { CellPos, Constraint } from "../types/constraints";
import type { Entry, SolveStatus } from "../types/puzzle";

export type Mode = "build" | "play";

export type Tool =
  | { kind: "select" }
  | { kind: "given" }
  | { kind: "cage" }
  | { kind: "thermometer" }
  | { kind: "arrow"; phase: "bulb" | "path" }
  | { kind: "kropki"; color: "white" | "black" }
  | { kind: "xv"; mark: "x" | "v" }
  | { kind: "parity"; parity: "even" | "odd" };

export type PencilMode = "digit" | "corner" | "center";

export type State = {
  mode: Mode;
  tool: Tool;
  constraints: Constraint[];
  selected: CellPos[];
  entries: Record<string, Entry>;
  solveStatus: SolveStatus;
  showSolution: boolean;
  showDiff: boolean;
  pencilMode: PencilMode;
  draft: {
    bulb?: CellPos[];
  };
};

export type Actions = {
  setMode: (mode: Mode) => void;
  setTool: (tool: Tool) => void;
  clearSelection: () => void;
  toggleCellSelection: (pos: CellPos, additive: boolean) => void;
  selectCell: (pos: CellPos) => void;
  addConstraint: (c: Constraint) => void;
  removeConstraint: (id: string) => void;
  updateConstraint: (id: string, patch: Partial<Constraint>) => void;
  toggleDiagonal: (which: "main" | "anti") => void;
  toggleAntiKnight: () => void;
  toggleAntiKing: () => void;
  commitDraftBulb: () => void;
  resetDraft: () => void;
  setEntry: (pos: CellPos, digit?: number) => void;
  toggleCornerMark: (pos: CellPos, digit: number) => void;
  toggleCenterMark: (pos: CellPos, digit: number) => void;
  clearAllEntries: () => void;
  setSolveStatus: (s: SolveStatus) => void;
  setShowSolution: (v: boolean) => void;
  setShowDiff: (v: boolean) => void;
  setPencilMode: (m: PencilMode) => void;
  loadPuzzle: (constraints: Constraint[]) => void;
  reset: () => void;
};

export const cellKey = (r: number, c: number) => `${r},${c}`;
export const posKey = (p: CellPos) => cellKey(p.r, p.c);
export const eqPos = (a: CellPos, b: CellPos) => a.r === b.r && a.c === b.c;

const newId = () => Math.random().toString(36).slice(2, 10);
export { newId };

export const useStore = create<State & Actions>((set, get) => ({
  mode: "build",
  tool: { kind: "select" },
  constraints: [],
  selected: [],
  entries: {},
  solveStatus: { state: "idle" },
  showSolution: false,
  showDiff: false,
  pencilMode: "digit",
  draft: {},

  setMode: (mode) => set({ mode, selected: [], tool: { kind: "select" }, draft: {} }),
  setTool: (tool) => set({ tool, selected: [], draft: {} }),
  clearSelection: () => set({ selected: [] }),

  toggleCellSelection: (pos, additive) => {
    const cur = get().selected;
    if (additive) {
      const has = cur.some((p) => eqPos(p, pos));
      set({ selected: has ? cur.filter((p) => !eqPos(p, pos)) : [...cur, pos] });
    } else {
      const onlyMe = cur.length === 1 && eqPos(cur[0], pos);
      set({ selected: onlyMe ? [] : [pos] });
    }
  },

  selectCell: (pos) => {
    const cur = get().selected;
    if (cur.some((p) => eqPos(p, pos))) return;
    set({ selected: [...cur, pos] });
  },

  addConstraint: (c) => set({ constraints: [...get().constraints, c] }),
  removeConstraint: (id) =>
    set({ constraints: get().constraints.filter((c) => c.id !== id) }),
  updateConstraint: (id, patch) =>
    set({
      constraints: get().constraints.map((c) =>
        c.id === id ? ({ ...c, ...patch } as Constraint) : c,
      ),
    }),

  toggleDiagonal: (which) => {
    const cs = get().constraints;
    const existing = cs.find((c) => c.kind === "diagonal" && c.which === which);
    if (existing) {
      set({ constraints: cs.filter((c) => c.id !== existing.id) });
    } else {
      set({ constraints: [...cs, { id: newId(), kind: "diagonal", which }] });
    }
  },

  toggleAntiKnight: () => {
    const cs = get().constraints;
    const existing = cs.find((c) => c.kind === "antiKnight");
    if (existing) set({ constraints: cs.filter((c) => c.id !== existing.id) });
    else set({ constraints: [...cs, { id: newId(), kind: "antiKnight" }] });
  },

  toggleAntiKing: () => {
    const cs = get().constraints;
    const existing = cs.find((c) => c.kind === "antiKing");
    if (existing) set({ constraints: cs.filter((c) => c.id !== existing.id) });
    else set({ constraints: [...cs, { id: newId(), kind: "antiKing" }] });
  },

  commitDraftBulb: () => set({ draft: { bulb: get().selected }, selected: [] }),
  resetDraft: () => set({ draft: {} }),

  setEntry: (pos, digit) => {
    const k = posKey(pos);
    const entries = { ...get().entries };
    const cur = entries[k] ?? { corner: [], center: [] };
    if (digit === undefined) entries[k] = { ...cur, digit: undefined };
    else entries[k] = { ...cur, digit, corner: [], center: [] };
    set({ entries });
  },

  toggleCornerMark: (pos, digit) => {
    const k = posKey(pos);
    const entries = { ...get().entries };
    const cur = entries[k] ?? { corner: [], center: [] };
    if (cur.digit !== undefined) return;
    const has = cur.corner.includes(digit);
    entries[k] = {
      ...cur,
      corner: has ? cur.corner.filter((d) => d !== digit) : [...cur.corner, digit].sort(),
    };
    set({ entries });
  },

  toggleCenterMark: (pos, digit) => {
    const k = posKey(pos);
    const entries = { ...get().entries };
    const cur = entries[k] ?? { corner: [], center: [] };
    if (cur.digit !== undefined) return;
    const has = cur.center.includes(digit);
    entries[k] = {
      ...cur,
      center: has ? cur.center.filter((d) => d !== digit) : [...cur.center, digit].sort(),
    };
    set({ entries });
  },

  clearAllEntries: () => set({ entries: {} }),

  setSolveStatus: (s) => set({ solveStatus: s }),
  setShowSolution: (v) => set({ showSolution: v }),
  setShowDiff: (v) => set({ showDiff: v }),
  setPencilMode: (m) => set({ pencilMode: m }),

  loadPuzzle: (constraints) =>
    set({
      constraints,
      entries: {},
      selected: [],
      tool: { kind: "select" },
      solveStatus: { state: "idle" },
      showSolution: false,
      showDiff: false,
      draft: {},
    }),

  reset: () =>
    set({
      mode: "build",
      tool: { kind: "select" },
      constraints: [],
      selected: [],
      entries: {},
      solveStatus: { state: "idle" },
      showSolution: false,
      showDiff: false,
      draft: {},
    }),
}));

