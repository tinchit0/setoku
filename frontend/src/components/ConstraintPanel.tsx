import { useMemo, useState } from "react";
import { useStore, newId, eqPos } from "../state/store";
import type { Constraint } from "../types/constraints";
import { isOrthAdjacent } from "../solver/solver";

export function ConstraintPanel() {
  const tool = useStore((s) => s.tool);
  const setTool = useStore((s) => s.setTool);
  const constraints = useStore((s) => s.constraints);
  const selected = useStore((s) => s.selected);
  const draft = useStore((s) => s.draft);
  const addConstraint = useStore((s) => s.addConstraint);
  const removeConstraint = useStore((s) => s.removeConstraint);
  const updateConstraint = useStore((s) => s.updateConstraint);
  const toggleDiagonal = useStore((s) => s.toggleDiagonal);
  const toggleAntiKnight = useStore((s) => s.toggleAntiKnight);
  const toggleAntiKing = useStore((s) => s.toggleAntiKing);
  const commitDraftBulb = useStore((s) => s.commitDraftBulb);
  const resetDraft = useStore((s) => s.resetDraft);
  const clearSelection = useStore((s) => s.clearSelection);

  const [cageSum, setCageSum] = useState<string>("");

  const has = useMemo(
    () => ({
      diagMain: constraints.some((c) => c.kind === "diagonal" && c.which === "main"),
      diagAnti: constraints.some((c) => c.kind === "diagonal" && c.which === "anti"),
      antiKnight: constraints.some((c) => c.kind === "antiKnight"),
      antiKing: constraints.some((c) => c.kind === "antiKing"),
    }),
    [constraints],
  );

  const addCage = () => {
    if (selected.length === 0) return;
    const sum = cageSum.trim() === "" ? undefined : Number(cageSum);
    if (sum !== undefined && (!Number.isFinite(sum) || sum < 1)) return;
    addConstraint({
      id: newId(),
      kind: "cage",
      cells: selected.slice(),
      sum,
    });
    setCageSum("");
    clearSelection();
  };

  const addThermo = () => {
    if (selected.length < 2) return;
    if (selected.length > 9) return;
    addConstraint({
      id: newId(),
      kind: "thermometer",
      cells: selected.slice(),
    });
    clearSelection();
  };

  const addArrowBulb = () => {
    if (selected.length === 0) return;
    commitDraftBulb();
  };

  const addArrowFinish = () => {
    if (!draft.bulb || draft.bulb.length === 0) return;
    if (selected.length === 0) return;
    addConstraint({
      id: newId(),
      kind: "arrow",
      bulb: draft.bulb,
      path: selected.slice(),
    });
    resetDraft();
    clearSelection();
  };

  const addKropki = (color: "white" | "black") => {
    if (selected.length !== 2) return;
    const [a, b] = selected;
    if (!isOrthAdjacent(a, b)) return;
    addConstraint({ id: newId(), kind: "kropki", a, b, color });
    clearSelection();
  };

  const addXV = (mark: "x" | "v") => {
    if (selected.length !== 2) return;
    const [a, b] = selected;
    if (!isOrthAdjacent(a, b)) return;
    addConstraint({ id: newId(), kind: "xv", a, b, mark });
    clearSelection();
  };

  const addParity = (parity: "even" | "odd") => {
    if (selected.length === 0) return;
    for (const pos of selected) {
      const existing = constraints.find(
        (c) => c.kind === "parity" && eqPos(c.pos, pos),
      );
      if (existing) removeConstraint(existing.id);
      addConstraint({ id: newId(), kind: "parity", pos, parity });
    }
    clearSelection();
  };

  return (
    <>
      <div>
        <h2>Herramienta</h2>
        <div className="tool-grid" style={{ marginTop: 8 }}>
          <button
            className={tool.kind === "select" ? "active" : ""}
            onClick={() => setTool({ kind: "select" })}
          >
            Seleccionar
          </button>
          <button
            className={tool.kind === "given" ? "active" : ""}
            onClick={() => setTool({ kind: "given" })}
          >
            Given (1–9)
          </button>
          <button
            className={tool.kind === "cage" ? "active" : ""}
            onClick={() => setTool({ kind: "cage" })}
          >
            Killer cage
          </button>
          <button
            className={tool.kind === "thermometer" ? "active" : ""}
            onClick={() => setTool({ kind: "thermometer" })}
          >
            Termómetro
          </button>
          <button
            className={tool.kind === "arrow" ? "active" : ""}
            onClick={() => setTool({ kind: "arrow", phase: "bulb" })}
          >
            Flecha
          </button>
          <button
            className={tool.kind === "kropki" ? "active" : ""}
            onClick={() => setTool({ kind: "kropki", color: "white" })}
          >
            Kropki
          </button>
          <button
            className={tool.kind === "xv" ? "active" : ""}
            onClick={() => setTool({ kind: "xv", mark: "v" })}
          >
            XV
          </button>
          <button
            className={tool.kind === "parity" ? "active" : ""}
            onClick={() => setTool({ kind: "parity", parity: "even" })}
          >
            Par / Impar
          </button>
        </div>
      </div>

      <ToolActions
        tool={tool.kind}
        selected={selected}
        draft={draft}
        cageSum={cageSum}
        setCageSum={setCageSum}
        addCage={addCage}
        addThermo={addThermo}
        addArrowBulb={addArrowBulb}
        addArrowFinish={addArrowFinish}
        addKropki={addKropki}
        addXV={addXV}
        addParity={addParity}
        resetDraft={resetDraft}
      />

      <div>
        <h2>Globales</h2>
        <div className="toolbar-row" style={{ marginTop: 8 }}>
          <button
            className={has.diagMain ? "active" : ""}
            onClick={() => toggleDiagonal("main")}
          >
            Diagonal ↘
          </button>
          <button
            className={has.diagAnti ? "active" : ""}
            onClick={() => toggleDiagonal("anti")}
          >
            Diagonal ↙
          </button>
          <button className={has.antiKnight ? "active" : ""} onClick={toggleAntiKnight}>
            Anti-caballo
          </button>
          <button className={has.antiKing ? "active" : ""} onClick={toggleAntiKing}>
            Anti-rey
          </button>
        </div>
      </div>

      <ConstraintList constraints={constraints} onRemove={removeConstraint} onUpdate={updateConstraint} />
    </>
  );
}

type ToolActionsProps = {
  tool: string;
  selected: ReturnType<typeof useStore.getState>["selected"];
  draft: ReturnType<typeof useStore.getState>["draft"];
  cageSum: string;
  setCageSum: (v: string) => void;
  addCage: () => void;
  addThermo: () => void;
  addArrowBulb: () => void;
  addArrowFinish: () => void;
  addKropki: (color: "white" | "black") => void;
  addXV: (mark: "x" | "v") => void;
  addParity: (parity: "even" | "odd") => void;
  resetDraft: () => void;
};

function ToolActions(p: ToolActionsProps) {
  const adjacentOk =
    p.selected.length === 2 && isOrthAdjacent(p.selected[0], p.selected[1]);
  return (
    <div>
      <h2>Acción</h2>
      <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-dim)" }}>
        {p.tool === "select" && (
          <p style={{ margin: 0 }}>Selecciona celdas para inspeccionar.</p>
        )}
        {p.tool === "given" && (
          <p style={{ margin: 0 }}>
            Selecciona una o varias celdas y pulsa 1-9 para fijar un valor. Borra con Supr.
          </p>
        )}
        {p.tool === "cage" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ margin: 0 }}>
              Pinta las celdas de una jaula (clic + arrastrar). Suma opcional.
            </p>
            <div className="field">
              <label>Suma</label>
              <input
                type="number"
                className="cage-sum-input"
                value={p.cageSum}
                onChange={(e) => p.setCageSum(e.target.value)}
                placeholder="opcional"
                min={1}
                max={45}
              />
            </div>
            <button className="primary" disabled={p.selected.length === 0} onClick={p.addCage}>
              Añadir jaula ({p.selected.length})
            </button>
          </div>
        )}
        {p.tool === "thermometer" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ margin: 0 }}>
              Selecciona desde el bulbo hacia la punta (en orden, clic celda por celda).
            </p>
            <button
              className="primary"
              disabled={p.selected.length < 2}
              onClick={p.addThermo}
            >
              Añadir termómetro ({p.selected.length})
            </button>
          </div>
        )}
        {p.tool === "arrow" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {!p.draft.bulb ? (
              <>
                <p style={{ margin: 0 }}>1) Selecciona la(s) celda(s) del bulbo.</p>
                <button
                  className="primary"
                  disabled={p.selected.length === 0}
                  onClick={p.addArrowBulb}
                >
                  Fijar bulbo ({p.selected.length})
                </button>
              </>
            ) : (
              <>
                <p style={{ margin: 0 }}>
                  2) Selecciona la trayectoria de la flecha en orden.
                </p>
                <div className="toolbar-row">
                  <button
                    className="primary"
                    disabled={p.selected.length === 0}
                    onClick={p.addArrowFinish}
                  >
                    Crear flecha ({p.selected.length})
                  </button>
                  <button onClick={p.resetDraft}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        )}
        {p.tool === "kropki" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ margin: 0 }}>Selecciona 2 celdas ortogonalmente adyacentes.</p>
            <div className="toolbar-row">
              <button disabled={!adjacentOk} onClick={() => p.addKropki("white")}>
                ○ Blanco (consecutivos)
              </button>
              <button disabled={!adjacentOk} onClick={() => p.addKropki("black")}>
                ● Negro (×2)
              </button>
            </div>
          </div>
        )}
        {p.tool === "xv" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ margin: 0 }}>Selecciona 2 celdas ortogonalmente adyacentes.</p>
            <div className="toolbar-row">
              <button disabled={!adjacentOk} onClick={() => p.addXV("v")}>
                V (suma 5)
              </button>
              <button disabled={!adjacentOk} onClick={() => p.addXV("x")}>
                X (suma 10)
              </button>
            </div>
          </div>
        )}
        {p.tool === "parity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ margin: 0 }}>Selecciona celdas para marcar.</p>
            <div className="toolbar-row">
              <button disabled={p.selected.length === 0} onClick={() => p.addParity("even")}>
                ▢ Par
              </button>
              <button disabled={p.selected.length === 0} onClick={() => p.addParity("odd")}>
                ○ Impar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConstraintList({
  constraints,
  onRemove,
  onUpdate,
}: {
  constraints: Constraint[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Constraint>) => void;
}) {
  const summarize = (c: Constraint): string => {
    switch (c.kind) {
      case "given":
        return `(${c.pos.r + 1},${c.pos.c + 1}) = ${c.digit}`;
      case "diagonal":
        return c.which === "main" ? "Diagonal principal" : "Diagonal anti";
      case "cage":
        return `${c.cells.length} celdas${c.sum !== undefined ? ` · suma ${c.sum}` : ""}`;
      case "thermometer":
        return `${c.cells.length} celdas`;
      case "arrow":
        return `bulbo ${c.bulb.length}, ruta ${c.path.length}`;
      case "kropki":
        return c.color === "white" ? "○ consecutivos" : "● ×2";
      case "xv":
        return c.mark === "x" ? "X (suma 10)" : "V (suma 5)";
      case "parity":
        return `(${c.pos.r + 1},${c.pos.c + 1}) · ${c.parity === "even" ? "par" : "impar"}`;
      case "antiKnight":
        return "Anti-caballo";
      case "antiKing":
        return "Anti-rey";
    }
  };
  if (constraints.length === 0) {
    return (
      <div>
        <h2>Restricciones</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Aún no hay restricciones.</p>
      </div>
    );
  }
  return (
    <div>
      <h2>Restricciones ({constraints.length})</h2>
      <div className="constraint-list" style={{ marginTop: 8 }}>
        {constraints.map((c) => (
          <div key={c.id} className="constraint-row">
            <div>
              <div style={{ fontWeight: 600 }}>{labelFor(c)}</div>
              <div className="meta">{summarize(c)}</div>
            </div>
            <div className="toolbar-row">
              {c.kind === "cage" && (
                <input
                  type="number"
                  style={{ width: 60 }}
                  value={c.sum ?? ""}
                  onChange={(e) =>
                    onUpdate(c.id, {
                      sum: e.target.value === "" ? undefined : Number(e.target.value),
                    } as Partial<Constraint>)
                  }
                  placeholder="suma"
                />
              )}
              <button className="danger" onClick={() => onRemove(c.id)}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function labelFor(c: Constraint): string {
  switch (c.kind) {
    case "given":
      return "Given";
    case "diagonal":
      return "Diagonal";
    case "cage":
      return "Killer cage";
    case "thermometer":
      return "Termómetro";
    case "arrow":
      return "Flecha";
    case "kropki":
      return "Kropki";
    case "xv":
      return "XV";
    case "parity":
      return "Paridad";
    case "antiKnight":
      return "Anti-caballo";
    case "antiKing":
      return "Anti-rey";
  }
}
