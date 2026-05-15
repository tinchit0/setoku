"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore, posKey, eqPos } from "../state/store";
import type { CellPos, Constraint } from "../types/constraints";

const N = 9;
const CELL = 56;
const PAD = 24;
const BOARD = N * CELL;
const SIZE = BOARD + PAD * 2;

const cellTopLeft = (r: number, c: number) => ({ x: PAD + c * CELL, y: PAD + r * CELL });
const cellCenter = (r: number, c: number) => ({
  x: PAD + c * CELL + CELL / 2,
  y: PAD + r * CELL + CELL / 2,
});

type DiffCell = { r: number; c: number; val1: number; val2: number };

type Props = {
  solutionGrid?: number[][];
  diffCells?: DiffCell[];
};

export function SudokuGrid({ solutionGrid, diffCells }: Props) {
  const constraints = useStore((s) => s.constraints);
  const selected = useStore((s) => s.selected);
  const cursor = useStore((s) => s.cursor);
  const entries = useStore((s) => s.entries);
  const mode = useStore((s) => s.mode);
  const draft = useStore((s) => s.draft);
  const showSolution = useStore((s) => s.showSolution);

  const toggleCellSelection = useStore((s) => s.toggleCellSelection);
  const selectCell = useStore((s) => s.selectCell);

  const [dragging, setDragging] = useState(false);
  const dragAdditive = useRef(false);
  const dragStarted = useRef<CellPos | null>(null);
  const dragModified = useRef(false);

  const givens = useMemo(
    () => constraints.filter((c): c is Constraint & { kind: "given" } => c.kind === "given"),
    [constraints],
  );
  const givenAt = useCallback(
    (r: number, c: number) => givens.find((g) => g.pos.r === r && g.pos.c === c)?.digit,
    [givens],
  );

  const diffMap = useMemo(() => {
    if (!diffCells) return null;
    const m = new Map<string, DiffCell>();
    for (const d of diffCells) m.set(`${d.r},${d.c}`, d);
    return m;
  }, [diffCells]);
  const isDraftBulb = useCallback(
    (r: number, c: number) => !!draft.bulb && draft.bulb.some((p) => p.r === r && p.c === c),
    [draft.bulb],
  );

  const multiCellTool = mode === "build";

  const onCellPointerDown = (e: React.PointerEvent, r: number, c: number) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging(true);
    dragAdditive.current = e.shiftKey || e.ctrlKey || e.metaKey || multiCellTool;
    dragStarted.current = { r, c };
    dragModified.current = false;
    toggleCellSelection({ r, c }, dragAdditive.current);
  };

  const onCellPointerEnter = (e: React.PointerEvent, r: number, c: number) => {
    if (!dragging) return;
    if (dragStarted.current && eqPos(dragStarted.current, { r, c })) return;
    dragModified.current = true;
    selectCell({ r, c });
    void e;
  };

  const onPointerUp = () => {
    setDragging(false);
    dragStarted.current = null;
    dragModified.current = false;
  };

  useEffect(() => {
    window.addEventListener("pointerup", onPointerUp);
    return () => window.removeEventListener("pointerup", onPointerUp);
  }, []);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ userSelect: "none" }}>
      {/* Background */}
      <rect x={0} y={0} width={SIZE} height={SIZE} fill="#0f1115" />

      {/* Cells */}
      {Array.from({ length: N }).map((_, r) =>
        Array.from({ length: N }).map((_, c) => {
          const { x, y } = cellTopLeft(r, c);
          const draftBulb = isDraftBulb(r, c);
          return (
            <rect
              key={`cell-${r}-${c}`}
              x={x}
              y={y}
              width={CELL}
              height={CELL}
              fill={draftBulb ? "#ffd87a" : "#f5f5f5"}
              stroke="#0f1115"
              strokeWidth={1}
              onPointerDown={(e) => onCellPointerDown(e, r, c)}
              onPointerEnter={(e) => onCellPointerEnter(e, r, c)}
              style={{ cursor: "pointer" }}
            />
          );
        }),
      )}

      {/* Diff cells highlight */}
      {diffMap && Array.from(diffMap.values()).map(({ r, c }) => {
        const { x, y } = cellTopLeft(r, c);
        return (
          <rect
            key={`diff-bg-${r}-${c}`}
            x={x}
            y={y}
            width={CELL}
            height={CELL}
            fill="rgba(255,180,40,0.22)"
            pointerEvents="none"
          />
        );
      })}

      {/* Selection highlight */}
      {selected.map(({ r, c }) => {
        const { x, y } = cellTopLeft(r, c);
        return (
          <rect
            key={`sel-${r}-${c}`}
            x={x}
            y={y}
            width={CELL}
            height={CELL}
            fill="rgba(230,219,116,0.13)"
            pointerEvents="none"
          />
        );
      })}

      {/* Cursor (always visible) */}
      {(() => {
        const { x, y } = cellTopLeft(cursor.r, cursor.c);
        return (
          <rect
            x={x + 1.5}
            y={y + 1.5}
            width={CELL - 3}
            height={CELL - 3}
            fill="none"
            stroke="#e6db74"
            strokeWidth={2}
            rx={1}
            pointerEvents="none"
          />
        );
      })()}

      <CageOverlay constraints={constraints} />
      <ParityOverlay constraints={constraints} />
      <ThermometerOverlay constraints={constraints} />
      <ArrowOverlay constraints={constraints} />
      <DiagonalOverlay constraints={constraints} />
      <KropkiOverlay constraints={constraints} />
      <XVOverlay constraints={constraints} />

      {/* Digits/entries */}
      {Array.from({ length: N }).map((_, r) =>
        Array.from({ length: N }).map((_, c) => {
          const { x, y } = cellCenter(r, c);
          const given = givenAt(r, c);
          const entry = entries[posKey({ r, c })];
          const solutionDigit = showSolution && solutionGrid ? solutionGrid[r][c] : undefined;
          if (given !== undefined) {
            return (
              <text
                key={`g-${r}-${c}`}
                x={x}
                y={y + 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={30}
                fontWeight={700}
                fill="#1a1d24"
                pointerEvents="none"
              >
                {given}
              </text>
            );
          }
          if (entry?.digit !== undefined) {
            return (
              <text
                key={`d-${r}-${c}`}
                x={x}
                y={y + 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={30}
                fontWeight={500}
                fill="#2a4ad0"
                pointerEvents="none"
              >
                {entry.digit}
              </text>
            );
          }
          if (solutionDigit !== undefined && solutionDigit !== 0) {
            return (
              <text
                key={`s-${r}-${c}`}
                x={x}
                y={y + 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={30}
                fontWeight={400}
                fill="#6bd9a8"
                opacity={0.7}
                pointerEvents="none"
              >
                {solutionDigit}
              </text>
            );
          }
          const diff = diffMap?.get(`${r},${c}`);
          if (diff) {
            const bx = PAD + c * CELL;
            const by = PAD + r * CELL;
            return (
              <g key={`diff-${r}-${c}`} pointerEvents="none">
                <text
                  x={bx + CELL * 0.27}
                  y={by + CELL * 0.28}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={16}
                  fontWeight={700}
                  fill="#d97706"
                  opacity={0.9}
                >
                  {diff.val1}
                </text>
                <text
                  x={bx + CELL * 0.73}
                  y={by + CELL * 0.28}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={16}
                  fontWeight={700}
                  fill="#b45309"
                  opacity={0.9}
                >
                  {diff.val2}
                </text>
              </g>
            );
          }
          const corner = entry?.corner ?? [];
          const center = entry?.center ?? [];
          if (corner.length === 0 && center.length === 0) return null;
          const THIRD = CELL / 3;
          return (
            <g key={`p-${r}-${c}`} pointerEvents="none">
              {corner.map((d) => {
                const slot = d - 1;
                const px = PAD + c * CELL + (slot % 3) * THIRD + THIRD / 2;
                const py = PAD + r * CELL + Math.floor(slot / 3) * THIRD + THIRD / 2;
                return (
                  <text
                    key={`co-${d}`}
                    x={px}
                    y={py}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11}
                    fontWeight={500}
                    fill="#4a5580"
                  >
                    {d}
                  </text>
                );
              })}
              {center.length > 0 && (
                <text
                  x={PAD + c * CELL + CELL / 2}
                  y={PAD + r * CELL + CELL / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={center.length > 5 ? 10 : 13}
                  fontWeight={600}
                  fill="#7aa2ff"
                >
                  {center.join("")}
                </text>
              )}
            </g>
          );
        }),
      )}

      {/* Box borders (thicker) */}
      <g pointerEvents="none">
        {[0, 1, 2, 3].map((i) => (
          <line
            key={`v-${i}`}
            x1={PAD + i * 3 * CELL}
            y1={PAD}
            x2={PAD + i * 3 * CELL}
            y2={PAD + BOARD}
            stroke="#0f1115"
            strokeWidth={3}
          />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={`h-${i}`}
            x1={PAD}
            y1={PAD + i * 3 * CELL}
            x2={PAD + BOARD}
            y2={PAD + i * 3 * CELL}
            stroke="#0f1115"
            strokeWidth={3}
          />
        ))}
      </g>
    </svg>
  );
}

function CageOverlay({ constraints }: { constraints: Constraint[] }) {
  const cages = constraints.filter((c): c is Extract<Constraint, { kind: "cage" }> => c.kind === "cage");
  return (
    <g pointerEvents="none">
      {cages.map((cage) => {
        const cellSet = new Set(cage.cells.map((p) => `${p.r},${p.c}`));
        const inset = 3;
        const segs: { x1: number; y1: number; x2: number; y2: number }[] = [];
        for (const { r, c } of cage.cells) {
          const { x, y } = cellTopLeft(r, c);
          if (!cellSet.has(`${r - 1},${c}`))
            segs.push({ x1: x + inset, y1: y + inset, x2: x + CELL - inset, y2: y + inset });
          if (!cellSet.has(`${r + 1},${c}`))
            segs.push({ x1: x + inset, y1: y + CELL - inset, x2: x + CELL - inset, y2: y + CELL - inset });
          if (!cellSet.has(`${r},${c - 1}`))
            segs.push({ x1: x + inset, y1: y + inset, x2: x + inset, y2: y + CELL - inset });
          if (!cellSet.has(`${r},${c + 1}`))
            segs.push({ x1: x + CELL - inset, y1: y + inset, x2: x + CELL - inset, y2: y + CELL - inset });
        }
        const sortedCells = [...cage.cells].sort((a, b) => a.r - b.r || a.c - b.c);
        const head = sortedCells[0];
        const headTL = cellTopLeft(head.r, head.c);
        return (
          <g key={`cage-${cage.id}`}>
            {segs.map((s, i) => (
              <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#1a1d24" strokeWidth={1.5} strokeDasharray="3 2" />
            ))}
            {cage.sum !== undefined && (
              <g>
                <rect x={headTL.x + inset + 1} y={headTL.y + inset + 1} width={String(cage.sum).length * 7 + 4} height={12} fill="#f5f5f5" />
                <text x={headTL.x + inset + 3} y={headTL.y + inset + 8} fontSize={11} fontWeight={700} fill="#1a1d24" dominantBaseline="central">{cage.sum}</text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

function ParityOverlay({ constraints }: { constraints: Constraint[] }) {
  const items = constraints.filter((c): c is Extract<Constraint, { kind: "parity" }> => c.kind === "parity");
  return (
    <g pointerEvents="none">
      {items.map((p) => {
        const { x, y } = cellCenter(p.pos.r, p.pos.c);
        if (p.parity === "even") {
          return <rect key={p.id} x={x - CELL * 0.38} y={y - CELL * 0.38} width={CELL * 0.76} height={CELL * 0.76} fill="#cfd5e3" opacity={0.55} />;
        }
        return <circle key={p.id} cx={x} cy={y} r={CELL * 0.4} fill="#cfd5e3" opacity={0.55} />;
      })}
    </g>
  );
}

function ThermometerOverlay({ constraints }: { constraints: Constraint[] }) {
  const items = constraints.filter((c): c is Extract<Constraint, { kind: "thermometer" }> => c.kind === "thermometer");
  return (
    <g pointerEvents="none">
      {items.map((t) => {
        if (t.cells.length === 0) return null;
        const bulb = cellCenter(t.cells[0].r, t.cells[0].c);
        const points = t.cells.map((p) => cellCenter(p.r, p.c));
        return (
          <g key={t.id} opacity={0.55}>
            <circle cx={bulb.x} cy={bulb.y} r={CELL * 0.32} fill="#9aa1b0" />
            <polyline points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#9aa1b0" strokeWidth={CELL * 0.22} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
}

function ArrowOverlay({ constraints }: { constraints: Constraint[] }) {
  const items = constraints.filter((c): c is Extract<Constraint, { kind: "arrow" }> => c.kind === "arrow");
  return (
    <g pointerEvents="none">
      {items.map((a) => {
        if (a.bulb.length === 0 || a.path.length === 0) return null;
        const points = [a.bulb[a.bulb.length - 1], ...a.path].map((p) => cellCenter(p.r, p.c));
        const bulbCells = a.bulb;
        const minR = Math.min(...bulbCells.map((p) => p.r));
        const maxR = Math.max(...bulbCells.map((p) => p.r));
        const minC = Math.min(...bulbCells.map((p) => p.c));
        const maxC = Math.max(...bulbCells.map((p) => p.c));
        const tl = cellTopLeft(minR, minC);
        const br = cellTopLeft(maxR, maxC);
        const last = points[points.length - 1];
        const prev = points[points.length - 2];
        const dx = last.x - prev.x;
        const dy = last.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = dx / len;
        const ny = dy / len;
        const tipX = last.x - nx * (CELL * 0.05);
        const tipY = last.y - ny * (CELL * 0.05);
        const headLen = CELL * 0.22;
        const headAng = Math.PI / 6;
        const angle = Math.atan2(ny, nx);
        const ax1 = tipX - headLen * Math.cos(angle - headAng);
        const ay1 = tipY - headLen * Math.sin(angle - headAng);
        const ax2 = tipX - headLen * Math.cos(angle + headAng);
        const ay2 = tipY - headLen * Math.sin(angle + headAng);
        return (
          <g key={a.id}>
            <rect x={tl.x + 4} y={tl.y + 4} width={br.x - tl.x + CELL - 8} height={br.y - tl.y + CELL - 8} rx={CELL * 0.4} ry={CELL * 0.4} fill="none" stroke="#4a5060" strokeWidth={2.5} />
            <polyline points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#4a5060" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            <line x1={tipX} y1={tipY} x2={ax1} y2={ay1} stroke="#4a5060" strokeWidth={2.5} />
            <line x1={tipX} y1={tipY} x2={ax2} y2={ay2} stroke="#4a5060" strokeWidth={2.5} />
          </g>
        );
      })}
    </g>
  );
}

function DiagonalOverlay({ constraints }: { constraints: Constraint[] }) {
  const diags = constraints.filter((c): c is Extract<Constraint, { kind: "diagonal" }> => c.kind === "diagonal");
  return (
    <g pointerEvents="none">
      {diags.map((d) => (
        <line
          key={d.id}
          x1={d.which === "main" ? PAD : PAD + BOARD}
          y1={PAD}
          x2={d.which === "main" ? PAD + BOARD : PAD}
          y2={PAD + BOARD}
          stroke="#7aa2ff"
          strokeWidth={2}
          opacity={0.5}
        />
      ))}
    </g>
  );
}

function KropkiOverlay({ constraints }: { constraints: Constraint[] }) {
  const items = constraints.filter((c): c is Extract<Constraint, { kind: "kropki" }> => c.kind === "kropki");
  return (
    <g pointerEvents="none">
      {items.map((k) => {
        const a = cellCenter(k.a.r, k.a.c);
        const b = cellCenter(k.b.r, k.b.c);
        const cx = (a.x + b.x) / 2;
        const cy = (a.y + b.y) / 2;
        return <circle key={k.id} cx={cx} cy={cy} r={6} fill={k.color === "black" ? "#1a1d24" : "#ffffff"} stroke="#1a1d24" strokeWidth={1.5} />;
      })}
    </g>
  );
}

function XVOverlay({ constraints }: { constraints: Constraint[] }) {
  const items = constraints.filter((c): c is Extract<Constraint, { kind: "xv" }> => c.kind === "xv");
  return (
    <g pointerEvents="none">
      {items.map((xv) => {
        const a = cellCenter(xv.a.r, xv.a.c);
        const b = cellCenter(xv.b.r, xv.b.c);
        const cx = (a.x + b.x) / 2;
        const cy = (a.y + b.y) / 2;
        return (
          <g key={xv.id}>
            <circle cx={cx} cy={cy} r={9} fill="#f5f5f5" stroke="#1a1d24" strokeWidth={1} />
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fill="#1a1d24">{xv.mark.toUpperCase()}</text>
          </g>
        );
      })}
    </g>
  );
}
