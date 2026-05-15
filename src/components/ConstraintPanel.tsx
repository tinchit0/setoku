"use client";

import { useMemo } from "react";
import { useStore } from "../state/store";
import type { Constraint } from "../types/constraints";

export function ConstraintPanel() {
  const constraints = useStore((s) => s.constraints);
  const selected = useStore((s) => s.selected);
  const draft = useStore((s) => s.draft);
  const removeConstraint = useStore((s) => s.removeConstraint);
  const updateConstraint = useStore((s) => s.updateConstraint);
  const toggleDiagonal = useStore((s) => s.toggleDiagonal);
  const toggleAntiKnight = useStore((s) => s.toggleAntiKnight);
  const toggleAntiKing = useStore((s) => s.toggleAntiKing);

  const has = useMemo(
    () => ({
      diagMain: constraints.some((c) => c.kind === "diagonal" && c.which === "main"),
      diagAnti: constraints.some((c) => c.kind === "diagonal" && c.which === "anti"),
      antiKnight: constraints.some((c) => c.kind === "antiKnight"),
      antiKing: constraints.some((c) => c.kind === "antiKing"),
    }),
    [constraints],
  );

  const statusLabel = draft.bulb
    ? "● FLECHA · FASE 2"
    : selected.length === 0
    ? "sin selección"
    : `${selected.length} celda${selected.length !== 1 ? "s" : ""} seleccionada${selected.length !== 1 ? "s" : ""}`;

  const statusMsg = draft.bulb
    ? `bulbo: ${draft.bulb.length} celda${draft.bulb.length !== 1 ? "s" : ""}. Selecciona trayecto y pulsa A`
    : "selecciona celdas y usa los atajos";

  return (
    <>
      {/* Status */}
      <div className="kb-status">
        <span className="kb-status-label">{statusLabel}</span>
        <span className="kb-status-msg">{statusMsg}</span>
      </div>

      {/* Keyboard shortcut reference */}
      <div>
        <h2>Atajos de teclado</h2>
        <div className="shortcut-table">
          <div className="shortcut-section">
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>↑↓←→</kbd></span>
              <span className="shortcut-desc">mover cursor</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>⇧</kbd>+<kbd>↑↓←→</kbd></span>
              <span className="shortcut-desc">extender selección</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>Esc</kbd></span>
              <span className="shortcut-desc">cancelar / deseleccionar</span>
            </div>
          </div>
          <div className="shortcut-sep" />
          <div className="shortcut-section">
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>1</kbd>–<kbd>9</kbd></span>
              <span className="shortcut-desc">fijar given</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>Del</kbd></span>
              <span className="shortcut-desc">borrar given</span>
            </div>
          </div>
          <div className="shortcut-sep" />
          <div className="shortcut-section">
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>T</kbd></span>
              <span className="shortcut-desc">termómetro</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>K</kbd></span>
              <span className="shortcut-desc">killer cage</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>A</kbd></span>
              <span className="shortcut-desc">flecha (2 fases)</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>W</kbd> / <kbd>B</kbd></span>
              <span className="shortcut-desc">Kropki ○ / ●</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>V</kbd> / <kbd>X</kbd></span>
              <span className="shortcut-desc">XV</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>E</kbd> / <kbd>I</kbd></span>
              <span className="shortcut-desc">par / impar</span>
            </div>
          </div>
          <div className="shortcut-sep" />
          <div className="shortcut-section">
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>D</kbd> / <kbd>⇧D</kbd></span>
              <span className="shortcut-desc">diagonal ↘ / ↙</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>N</kbd> / <kbd>⇧N</kbd></span>
              <span className="shortcut-desc">anti-caballo / rey</span>
            </div>
          </div>
          <div className="shortcut-sep" />
          <div className="shortcut-section">
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>?</kbd></span>
              <span className="shortcut-desc">ayuda de restricciones</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global constraints toggles */}
      <div>
        <h2>Globales</h2>
        <div className="toolbar-row" style={{ marginTop: 8 }}>
          <button
            className={has.diagMain ? "active" : ""}
            onClick={() => toggleDiagonal("main")}
            title="D — diagonal principal"
          >
            D · ↘
          </button>
          <button
            className={has.diagAnti ? "active" : ""}
            onClick={() => toggleDiagonal("anti")}
            title="⇧D — diagonal anti"
          >
            ⇧D · ↙
          </button>
          <button
            className={has.antiKnight ? "active" : ""}
            onClick={toggleAntiKnight}
            title="N — anti-caballo"
          >
            N · ♞
          </button>
          <button
            className={has.antiKing ? "active" : ""}
            onClick={toggleAntiKing}
            title="⇧N — anti-rey"
          >
            ⇧N · ♚
          </button>
        </div>
      </div>

      <ConstraintList constraints={constraints} onRemove={removeConstraint} onUpdate={updateConstraint} />
    </>
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
    case "given": return "Given";
    case "diagonal": return "Diagonal";
    case "cage": return "Killer cage";
    case "thermometer": return "Termómetro";
    case "arrow": return "Flecha";
    case "kropki": return "Kropki";
    case "xv": return "XV";
    case "parity": return "Paridad";
    case "antiKnight": return "Anti-caballo";
    case "antiKing": return "Anti-rey";
  }
}
