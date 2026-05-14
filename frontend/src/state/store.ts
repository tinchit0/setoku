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

export type State = {
  mode: Mode;
  tool: Tool;
  constraints: Constraint[];
  selected: CellPos[];
  entries: Record<string, Entry>;
  solveStatus: SolveStatus;
  showSolution: boolean;
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
  togglePencilMark: (pos: CellPos, digit: number) => void;
  clearAllEntries: () => void;
  setSolveStatus: (s: SolveStatus) => void;
  setShowSolution: (v: boolean) => void;
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
    const cur = entries[k] ?? { pencil: [] };
    if (digit === undefined) entries[k] = { ...cur, digit: undefined };
    else entries[k] = { ...cur, digit, pencil: [] };
    set({ entries });
  },

  togglePencilMark: (pos, digit) => {
    const k = posKey(pos);
    const entries = { ...get().entries };
    const cur = entries[k] ?? { pencil: [] };
    if (cur.digit !== undefined) return; // can't pencil over a digit
    const has = cur.pencil.includes(digit);
    entries[k] = {
      ...cur,
      pencil: has ? cur.pencil.filter((d) => d !== digit) : [...cur.pencil, digit].sort(),
    };
    set({ entries });
  },

  clearAllEntries: () => set({ entries: {} }),

  setSolveStatus: (s) => set({ solveStatus: s }),
  setShowSolution: (v) => set({ showSolution: v }),

  loadPuzzle: (constraints) =>
    set({
      constraints,
      entries: {},
      selected: [],
      tool: { kind: "select" },
      solveStatus: { state: "idle" },
      showSolution: false,
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
      draft: {},
    }),
}));

