"use client";

import { useEffect, useRef } from "react";

type Props = { open: boolean; onClose: () => void };

export function HelpDialog({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = () => onClose();
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [onClose]);

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) onClose();
  };

  return (
    <dialog ref={ref} className="help-dialog" onClick={onBackdropClick}>
      <div className="help-dialog-inner">
        <div className="help-dialog-header">
          <h2>Constraints</h2>
          <button onClick={onClose} className="help-close" aria-label="Close">✕</button>
        </div>

        <div className="help-grid">
          <HelpCard icon="1–9" name="Given">
            Sets the value of a cell. The most direct constraint: the cell
            can only contain that digit.
          </HelpCard>

          <HelpCard icon="╲╱" name="Diagonal">
            Digits on the main diagonal (↘) or anti-diagonal (↙) are all
            different, just like a row or column.
          </HelpCard>

          <HelpCard icon="┌─┐" name="Killer cage">
            Cells in the cage don't repeat digits. If it has a sum,
            the digits must add up to exactly that value.
          </HelpCard>

          <HelpCard icon="●—" name="Thermometer">
            Digits increase strictly from the bulb (rounded end) to the tip.
            Each cell must have a value greater than the previous one.
          </HelpCard>

          <HelpCard icon="◯→" name="Arrow">
            The digit in the bulb equals the sum of all digits along
            the arrow's path.
          </HelpCard>

          <HelpCard icon="○" name="Kropki white">
            Two adjacent cells are consecutive: the difference between their
            digits is exactly 1 (e.g. 3 and 4, or 7 and 8).
          </HelpCard>

          <HelpCard icon="●" name="Kropki black">
            One of two adjacent cells contains double the value of the
            other (e.g. 2 and 4, or 3 and 6).
          </HelpCard>

          <HelpCard icon="V · X" name="XV">
            <strong>V</strong>: the two cells sum to exactly 5.{" "}
            <strong>X</strong>: the two cells sum to exactly 10. Cells
            must be orthogonally adjacent.
          </HelpCard>

          <HelpCard icon="▢ ○" name="Parity">
            Indicates if a cell must contain an even number (▢ gray square) or
            odd (○ gray circle). Doesn't set the exact digit, only its parity.
          </HelpCard>

          <HelpCard icon="♞" name="Anti-knight">
            Global constraint: two cells separated by a chess knight's move
            cannot contain the same digit.
          </HelpCard>

          <HelpCard icon="♔" name="Anti-king">
            Global constraint: two cells diagonally adjacent (at a chess king's distance)
            cannot contain the same digit.
          </HelpCard>
        </div>
      </div>
    </dialog>
  );
}

function HelpCard({
  icon,
  name,
  children,
}: {
  icon: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="help-card">
      <div className="help-card-icon">{icon}</div>
      <div>
        <div className="help-card-name">{name}</div>
        <div className="help-card-desc">{children}</div>
      </div>
    </div>
  );
}
