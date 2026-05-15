"use client";

import { useEffect, useRef, useState } from "react";
import type { CellPos } from "../types/constraints";

type Props = {
  cells: CellPos[] | null;
  onConfirm: (cells: CellPos[], sum?: number) => void;
  onCancel: () => void;
};

export function CageSumDialog({ cells, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sum, setSum] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (cells) {
      setSum("");
      dialog.showModal();
      setTimeout(() => inputRef.current?.focus(), 0);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [cells]);

  const confirm = () => {
    if (!cells) return;
    const s = sum.trim();
    const parsedSum = s === "" ? undefined : Number(s);
    if (parsedSum !== undefined && (!Number.isFinite(parsedSum) || parsedSum < 1 || parsedSum > 45)) return;
    onConfirm(cells, parsedSum);
    setSum("");
  };

  return (
    <dialog
      ref={dialogRef}
      className="cage-dialog"
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
    >
      <div className="cage-dialog-inner">
        <h3>Killer cage</h3>
        {cells && (
          <p className="cage-dialog-meta">
            {cells.length} cell{cells.length !== 1 ? "s" : ""} selected
          </p>
        )}
        <div className="field">
          <label>Sum (optional)</label>
          <input
            ref={inputRef}
            type="number"
            value={sum}
            onChange={(e) => setSum(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); confirm(); }
              if (e.key === "Escape") { e.preventDefault(); onCancel(); }
            }}
            placeholder="no sum"
            min={1}
            max={45}
          />
        </div>
        <div className="cage-dialog-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="primary" onClick={confirm}>Add cage</button>
        </div>
      </div>
    </dialog>
  );
}
