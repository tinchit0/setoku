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
    ? "● ARROW · PHASE 2"
    : selected.length === 0
    ? "no selection"
    : `${selected.length} cell${selected.length !== 1 ? "s" : ""} selected`;

  const statusMsg = draft.bulb
    ? `bulb: ${draft.bulb.length} cell${draft.bulb.length !== 1 ? "s" : ""}. Select path and press A`
    : "select cells and use shortcuts";

  return (
    <>
      {/* Status */}
      <div className="kb-status">
        <span className="kb-status-label">{statusLabel}</span>
        <span className="kb-status-msg">{statusMsg}</span>
      </div>

      {/* Keyboard shortcut reference */}
      <div>
        <h2>Keyboard shortcuts</h2>
        <div className="shortcut-table">
          <div className="shortcut-section">
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>↑↓←→</kbd></span>
              <span className="shortcut-desc">move cursor</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>⇧</kbd>+<kbd>↑↓←→</kbd></span>
              <span className="shortcut-desc">extend selection</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>Esc</kbd></span>
              <span className="shortcut-desc">cancel / deselect</span>
            </div>
          </div>
          <div className="shortcut-sep" />
          <div className="shortcut-section">
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>1</kbd>–<kbd>9</kbd></span>
              <span className="shortcut-desc">set given</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>Del</kbd></span>
              <span className="shortcut-desc">delete given</span>
            </div>
          </div>
          <div className="shortcut-sep" />
          <div className="shortcut-section">
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>T</kbd></span>
              <span className="shortcut-desc">thermometer</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>K</kbd></span>
              <span className="shortcut-desc">killer cage</span>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>A</kbd></span>
              <span className="shortcut-desc">arrow (2 phases)</span>
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
              <span className="shortcut-desc">even / odd</span>
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
              <span className="shortcut-desc">anti-knight / king</span>
            </div>
          </div>
          <div className="shortcut-sep" />
          <div className="shortcut-section">
            <div className="shortcut-row">
              <span className="shortcut-keys"><kbd>?</kbd></span>
              <span className="shortcut-desc">constraint help</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global constraints toggles */}
      <div>
        <h2>Global</h2>
        <div className="toolbar-row" style={{ marginTop: 8 }}>
          <button
            className={has.diagMain ? "active" : ""}
            onClick={() => toggleDiagonal("main")}
            title="D — main diagonal"
          >
            D · ↘
          </button>
          <button
            className={has.diagAnti ? "active" : ""}
            onClick={() => toggleDiagonal("anti")}
            title="⇧D — anti-diagonal"
          >
            ⇧D · ↙
          </button>
          <button
            className={has.antiKnight ? "active" : ""}
            onClick={toggleAntiKnight}
            title="N — anti-knight"
          >
            N · ♞
          </button>
          <button
            className={has.antiKing ? "active" : ""}
            onClick={toggleAntiKing}
            title="⇧N — anti-king"
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
        return c.which === "main" ? "Main diagonal" : "Anti-diagonal";
      case "cage":
        return `${c.cells.length} cells${c.sum !== undefined ? ` · sum ${c.sum}` : ""}`;
      case "thermometer":
        return `${c.cells.length} cells`;
      case "arrow":
        return `bulb ${c.bulb.length}, path ${c.path.length}`;
      case "kropki":
        return c.color === "white" ? "○ consecutive" : "● ×2";
      case "xv":
        return c.mark === "x" ? "X (sum 10)" : "V (sum 5)";
      case "parity":
        return `(${c.pos.r + 1},${c.pos.c + 1}) · ${c.parity === "even" ? "even" : "odd"}`;
      case "antiKnight":
        return "Anti-knight";
      case "antiKing":
        return "Anti-king";
    }
  };
  if (constraints.length === 0) {
    return (
      <div>
        <h2>Constraints</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No constraints yet.</p>
      </div>
    );
  }
  return (
    <div>
      <h2>Constraints ({constraints.length})</h2>
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
                  placeholder="sum"
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
    case "thermometer": return "Thermometer";
    case "arrow": return "Arrow";
    case "kropki": return "Kropki";
    case "xv": return "XV";
    case "parity": return "Parity";
    case "antiKnight": return "Anti-knight";
    case "antiKing": return "Anti-king";
  }
}
