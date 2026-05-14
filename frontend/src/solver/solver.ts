import type { CellPos, Constraint } from "../types/constraints";

export type Grid = number[][];

const N = 9;
const FULL_MASK = 0b1111111110; // bits 1-9

const BIT = (d: number) => 1 << d;
const HAS = (mask: number, d: number) => (mask & BIT(d)) !== 0;

function bitCount(m: number): number {
  let c = 0;
  while (m) {
    m &= m - 1;
    c++;
  }
  return c;
}

function digitsFromMask(m: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (HAS(m, d)) out.push(d);
  return out;
}

const cellId = (r: number, c: number) => r * N + c;

type PairConstraint =
  | { kind: "kropki"; color: "white" | "black"; a: number; b: number }
  | { kind: "xv"; mark: "x" | "v"; a: number; b: number };

type ThermoEntry = {
  cells: number[]; // ordered cell ids from bulb up
};

type CageEntry = {
  id: string;
  cells: number[];
  sum?: number;
};

type ArrowEntry = {
  id: string;
  bulb: number[];
  path: number[];
};

type Prepared = {
  peers: Uint8Array[]; // peers[i] = 1 byte per cell (1 if peer)
  initialCandidates: number[];
  pairsByCell: Map<number, PairConstraint[]>;
  thermosByCell: Map<number, { thermoIdx: number; pos: number }[]>;
  thermos: ThermoEntry[];
  cagesByCell: Map<number, number[]>; // cage indices
  cages: CageEntry[];
  arrowsByCell: Map<number, number[]>; // arrow indices
  arrows: ArrowEntry[];
};

function addPeer(peers: Uint8Array[], a: number, b: number) {
  if (a === b) return;
  peers[a][b] = 1;
  peers[b][a] = 1;
}

function prepare(constraints: Constraint[]): Prepared | { error: string } {
  const peers: Uint8Array[] = Array.from({ length: N * N }, () => new Uint8Array(N * N));
  const initialCandidates = new Array(N * N).fill(FULL_MASK);

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const id = cellId(r, c);
      for (let k = 0; k < N; k++) {
        if (k !== c) addPeer(peers, id, cellId(r, k));
        if (k !== r) addPeer(peers, id, cellId(k, c));
      }
      const br = Math.floor(r / 3) * 3;
      const bc = Math.floor(c / 3) * 3;
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          const rr = br + dr;
          const cc = bc + dc;
          if (rr !== r || cc !== c) addPeer(peers, id, cellId(rr, cc));
        }
      }
    }
  }

  const pairsByCell = new Map<number, PairConstraint[]>();
  const addPair = (a: number, b: number, pc: PairConstraint) => {
    if (!pairsByCell.has(a)) pairsByCell.set(a, []);
    if (!pairsByCell.has(b)) pairsByCell.set(b, []);
    pairsByCell.get(a)!.push(pc);
    pairsByCell.get(b)!.push(pc);
  };

  const thermos: ThermoEntry[] = [];
  const thermosByCell = new Map<number, { thermoIdx: number; pos: number }[]>();
  const cages: CageEntry[] = [];
  const cagesByCell = new Map<number, number[]>();
  const arrows: ArrowEntry[] = [];
  const arrowsByCell = new Map<number, number[]>();

  for (const c of constraints) {
    switch (c.kind) {
      case "given": {
        const id = cellId(c.pos.r, c.pos.c);
        initialCandidates[id] = BIT(c.digit);
        break;
      }
      case "diagonal": {
        if (c.which === "main") {
          for (let i = 0; i < N; i++)
            for (let j = 0; j < N; j++) if (i !== j) addPeer(peers, cellId(i, i), cellId(j, j));
        } else {
          for (let i = 0; i < N; i++)
            for (let j = 0; j < N; j++)
              if (i !== j) addPeer(peers, cellId(i, N - 1 - i), cellId(j, N - 1 - j));
        }
        break;
      }
      case "antiKnight": {
        const moves = [
          [-2, -1],
          [-2, 1],
          [-1, -2],
          [-1, 2],
          [1, -2],
          [1, 2],
          [2, -1],
          [2, 1],
        ];
        for (let r = 0; r < N; r++) {
          for (let cc = 0; cc < N; cc++) {
            for (const [dr, dc] of moves) {
              const r2 = r + dr;
              const c2 = cc + dc;
              if (r2 >= 0 && r2 < N && c2 >= 0 && c2 < N)
                addPeer(peers, cellId(r, cc), cellId(r2, c2));
            }
          }
        }
        break;
      }
      case "antiKing": {
        for (let r = 0; r < N; r++) {
          for (let cc = 0; cc < N; cc++) {
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r2 = r + dr;
                const c2 = cc + dc;
                if (r2 >= 0 && r2 < N && c2 >= 0 && c2 < N)
                  addPeer(peers, cellId(r, cc), cellId(r2, c2));
              }
            }
          }
        }
        break;
      }
      case "parity": {
        const id = cellId(c.pos.r, c.pos.c);
        let mask = 0;
        if (c.parity === "even") mask = BIT(2) | BIT(4) | BIT(6) | BIT(8);
        else mask = BIT(1) | BIT(3) | BIT(5) | BIT(7) | BIT(9);
        initialCandidates[id] &= mask;
        break;
      }
      case "cage": {
        const cellsArr = c.cells.map((p) => cellId(p.r, p.c));
        for (let i = 0; i < cellsArr.length; i++)
          for (let j = i + 1; j < cellsArr.length; j++) addPeer(peers, cellsArr[i], cellsArr[j]);
        const idx = cages.length;
        cages.push({ id: c.id, cells: cellsArr, sum: c.sum });
        for (const cid of cellsArr) {
          if (!cagesByCell.has(cid)) cagesByCell.set(cid, []);
          cagesByCell.get(cid)!.push(idx);
        }
        break;
      }
      case "thermometer": {
        const cellsArr = c.cells.map((p) => cellId(p.r, p.c));
        const idx = thermos.length;
        thermos.push({ cells: cellsArr });
        for (let i = 0; i < cellsArr.length; i++) {
          const cid = cellsArr[i];
          if (!thermosByCell.has(cid)) thermosByCell.set(cid, []);
          thermosByCell.get(cid)!.push({ thermoIdx: idx, pos: i });
          // Minimum/maximum imposed by position
          // Cell at position i must be at least i+1 (smallest path = 1,2,...) and at most 9 - (len-1-i)
          let mask = 0;
          for (let d = i + 1; d <= 9 - (cellsArr.length - 1 - i); d++) mask |= BIT(d);
          initialCandidates[cid] &= mask;
        }
        break;
      }
      case "arrow": {
        const bulb = c.bulb.map((p) => cellId(p.r, p.c));
        const path = c.path.map((p) => cellId(p.r, p.c));
        const idx = arrows.length;
        arrows.push({ id: c.id, bulb, path });
        for (const cid of [...bulb, ...path]) {
          if (!arrowsByCell.has(cid)) arrowsByCell.set(cid, []);
          arrowsByCell.get(cid)!.push(idx);
        }
        break;
      }
      case "kropki":
      case "xv": {
        const a = cellId(c.a.r, c.a.c);
        const b = cellId(c.b.r, c.b.c);
        const pc: PairConstraint =
          c.kind === "kropki"
            ? { kind: "kropki", color: c.color, a, b }
            : { kind: "xv", mark: c.mark, a, b };
        addPair(a, b, pc);
        const allowed = allowedForPair(pc);
        initialCandidates[a] &= allowed.aMask;
        initialCandidates[b] &= allowed.bMask;
        break;
      }
    }
  }

  return {
    peers,
    initialCandidates,
    pairsByCell,
    thermos,
    thermosByCell,
    cages,
    cagesByCell,
    arrows,
    arrowsByCell,
  };
}

function allowedForPair(pc: PairConstraint): { aMask: number; bMask: number } {
  let aMask = 0;
  let bMask = 0;
  for (let da = 1; da <= 9; da++) {
    for (let db = 1; db <= 9; db++) {
      if (pairOk(pc, da, db)) {
        aMask |= BIT(da);
        bMask |= BIT(db);
      }
    }
  }
  return { aMask, bMask };
}

function pairOk(pc: PairConstraint, da: number, db: number): boolean {
  if (pc.kind === "kropki") {
    if (pc.color === "white") return Math.abs(da - db) === 1;
    return da === db * 2 || db === da * 2;
  }
  if (pc.mark === "x") return da + db === 10;
  return da + db === 5;
}

function pairMaskFor(pc: PairConstraint, other: number, isA: boolean): number {
  let mask = 0;
  for (let d = 1; d <= 9; d++) {
    const ok = isA ? pairOk(pc, d, other) : pairOk(pc, other, d);
    if (ok) mask |= BIT(d);
  }
  return mask;
}

export type SolveResult =
  | { state: "none" }
  | { state: "unique"; solution: Grid }
  | { state: "multiple"; solutions: [Grid, Grid] };

export function solvePuzzle(constraints: Constraint[]): SolveResult {
  const prepared = prepare(constraints);
  if ("error" in prepared) return { state: "none" };

  const candidates = prepared.initialCandidates.slice();
  const grid = new Array(N * N).fill(0);

  // Apply forced singletons from initial candidates
  const queue: number[] = [];
  for (let i = 0; i < N * N; i++) {
    if (candidates[i] === 0) return { state: "none" };
    if (bitCount(candidates[i]) === 1) queue.push(i);
  }
  if (!propagateQueue(queue, candidates, grid, prepared)) return { state: "none" };

  const solutions: number[][] = [];
  search(candidates, grid, prepared, solutions, 2);

  if (solutions.length === 0) return { state: "none" };
  if (solutions.length === 1) return { state: "unique", solution: toGrid(solutions[0]) };
  return {
    state: "multiple",
    solutions: [toGrid(solutions[0]), toGrid(solutions[1])],
  };
}

function toGrid(flat: number[]): Grid {
  const out: Grid = [];
  for (let r = 0; r < N; r++) out.push(flat.slice(r * N, (r + 1) * N));
  return out;
}

function search(
  candidates: number[],
  grid: number[],
  prepared: Prepared,
  solutions: number[][],
  maxSolutions: number,
): void {
  if (solutions.length >= maxSolutions) return;

  // Find MRV cell
  let bestCell = -1;
  let bestCount = 10;
  for (let i = 0; i < N * N; i++) {
    if (grid[i] !== 0) continue;
    const cnt = bitCount(candidates[i]);
    if (cnt < bestCount) {
      bestCount = cnt;
      bestCell = i;
      if (cnt === 1) break;
    }
  }

  if (bestCell === -1) {
    // All cells filled; verify cages with sums and arrows
    if (verifyComplete(grid, prepared)) {
      solutions.push(grid.slice());
    }
    return;
  }
  if (bestCount === 0) return;

  const choices = digitsFromMask(candidates[bestCell]);
  for (const d of choices) {
    const cSnap = candidates.slice();
    const gSnap = grid.slice();
    if (assign(bestCell, d, candidates, grid, prepared)) {
      search(candidates, grid, prepared, solutions, maxSolutions);
      if (solutions.length >= maxSolutions) return;
    }
    candidates.splice(0, candidates.length, ...cSnap);
    grid.splice(0, grid.length, ...gSnap);
  }
}

function assign(
  cell: number,
  d: number,
  candidates: number[],
  grid: number[],
  prepared: Prepared,
): boolean {
  candidates[cell] = BIT(d);
  return propagateQueue([cell], candidates, grid, prepared);
}

function propagateQueue(
  queue: number[],
  candidates: number[],
  grid: number[],
  prepared: Prepared,
): boolean {
  while (queue.length) {
    const cell = queue.shift()!;
    if (bitCount(candidates[cell]) !== 1) continue;
    if (grid[cell] !== 0) continue;
    const d = lowestDigit(candidates[cell]);
    grid[cell] = d;

    // Peer pruning: remove d from peers
    const peerRow = prepared.peers[cell];
    for (let i = 0; i < N * N; i++) {
      if (peerRow[i] === 0) continue;
      if (grid[i] !== 0) continue;
      if (HAS(candidates[i], d)) {
        candidates[i] &= ~BIT(d);
        if (candidates[i] === 0) return false;
        if (bitCount(candidates[i]) === 1) queue.push(i);
      }
    }

    // Pair constraints
    const pairs = prepared.pairsByCell.get(cell);
    if (pairs) {
      for (const pc of pairs) {
        const other = pc.a === cell ? pc.b : pc.a;
        const isOtherA = pc.a === other;
        const allowed = pairMaskFor(pc, d, isOtherA);
        if (grid[other] === 0) {
          const before = candidates[other];
          candidates[other] &= allowed;
          if (candidates[other] === 0) return false;
          if (before !== candidates[other] && bitCount(candidates[other]) === 1)
            queue.push(other);
        }
      }
    }

    // Thermometer propagation
    const thEntries = prepared.thermosByCell.get(cell);
    if (thEntries) {
      for (const { thermoIdx, pos } of thEntries) {
        const t = prepared.thermos[thermoIdx];
        // Each later cell must be > d
        for (let i = pos + 1; i < t.cells.length; i++) {
          const c2 = t.cells[i];
          if (grid[c2] !== 0) {
            if (grid[c2] <= d) return false;
            continue;
          }
          // Must be >= d + (i - pos)
          const minD = d + (i - pos);
          if (minD > 9) return false;
          let mask = 0;
          for (let v = minD; v <= 9; v++) mask |= BIT(v);
          const before = candidates[c2];
          candidates[c2] &= mask;
          if (candidates[c2] === 0) return false;
          if (before !== candidates[c2] && bitCount(candidates[c2]) === 1) queue.push(c2);
        }
        // Each earlier cell must be < d
        for (let i = 0; i < pos; i++) {
          const c2 = t.cells[i];
          if (grid[c2] !== 0) {
            if (grid[c2] >= d) return false;
            continue;
          }
          const maxD = d - (pos - i);
          if (maxD < 1) return false;
          let mask = 0;
          for (let v = 1; v <= maxD; v++) mask |= BIT(v);
          const before = candidates[c2];
          candidates[c2] &= mask;
          if (candidates[c2] === 0) return false;
          if (before !== candidates[c2] && bitCount(candidates[c2]) === 1) queue.push(c2);
        }
      }
    }

    // Cage partial sum check
    const cageIdxs = prepared.cagesByCell.get(cell);
    if (cageIdxs) {
      for (const idx of cageIdxs) {
        const cage = prepared.cages[idx];
        if (cage.sum === undefined) continue;
        let assigned = 0;
        let sumSoFar = 0;
        let minPossible = 0;
        let maxPossible = 0;
        for (const cid of cage.cells) {
          if (grid[cid] !== 0) {
            assigned++;
            sumSoFar += grid[cid];
          } else {
            const cands = candidates[cid];
            if (cands === 0) return false;
            let lo = 0;
            let hi = 0;
            for (let v = 1; v <= 9; v++) {
              if (HAS(cands, v)) {
                if (lo === 0) lo = v;
                hi = v;
              }
            }
            minPossible += lo;
            maxPossible += hi;
          }
        }
        if (assigned === cage.cells.length) {
          if (sumSoFar !== cage.sum) return false;
        } else {
          const target = cage.sum - sumSoFar;
          if (target < minPossible) return false;
          if (target > maxPossible) return false;
        }
      }
    }

    // Arrows: only check fully-assigned
    const arrIdxs = prepared.arrowsByCell.get(cell);
    if (arrIdxs) {
      for (const idx of arrIdxs) {
        const a = prepared.arrows[idx];
        const allCells = [...a.bulb, ...a.path];
        let allFilled = true;
        for (const cid of allCells) if (grid[cid] === 0) {
          allFilled = false;
          break;
        }
        if (allFilled) {
          let bulbVal = 0;
          for (const cid of a.bulb) bulbVal = bulbVal * 10 + grid[cid];
          let pathSum = 0;
          for (const cid of a.path) pathSum += grid[cid];
          if (bulbVal !== pathSum) return false;
        }
      }
    }
  }
  return true;
}

function lowestDigit(mask: number): number {
  for (let d = 1; d <= 9; d++) if (HAS(mask, d)) return d;
  return 0;
}

function verifyComplete(grid: number[], prepared: Prepared): boolean {
  for (const cage of prepared.cages) {
    if (cage.sum === undefined) continue;
    let s = 0;
    for (const cid of cage.cells) s += grid[cid];
    if (s !== cage.sum) return false;
  }
  for (const a of prepared.arrows) {
    let bulbVal = 0;
    for (const cid of a.bulb) bulbVal = bulbVal * 10 + grid[cid];
    let pathSum = 0;
    for (const cid of a.path) pathSum += grid[cid];
    if (bulbVal !== pathSum) return false;
  }
  for (const t of prepared.thermos) {
    for (let i = 1; i < t.cells.length; i++)
      if (grid[t.cells[i]] <= grid[t.cells[i - 1]]) return false;
  }
  return true;
}

export function isOrthAdjacent(a: CellPos, b: CellPos): boolean {
  return (Math.abs(a.r - b.r) === 1 && a.c === b.c) || (Math.abs(a.c - b.c) === 1 && a.r === b.r);
}
