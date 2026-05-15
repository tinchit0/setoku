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
          <h2>Restricciones</h2>
          <button onClick={onClose} className="help-close" aria-label="Cerrar">✕</button>
        </div>

        <div className="help-grid">
          <HelpCard icon="1–9" name="Dado">
            Fija el valor de una celda. Es la restricción más directa: la celda
            solo puede contener ese dígito.
          </HelpCard>

          <HelpCard icon="╲╱" name="Diagonal">
            Los dígitos de la diagonal principal (↘) o anti-diagonal (↙) son
            todos distintos, igual que en una fila o columna normal.
          </HelpCard>

          <HelpCard icon="┌─┐" name="Killer cage">
            Las celdas de la jaula no repiten dígito entre sí. Si tiene suma,
            los dígitos deben sumar exactamente ese valor.
          </HelpCard>

          <HelpCard icon="●—" name="Termómetro">
            Los dígitos aumentan estrictamente desde el bulbo (extremo gordo)
            hasta la punta. Cada celda debe tener un valor mayor que la anterior.
          </HelpCard>

          <HelpCard icon="◯→" name="Flecha">
            El dígito en el bulbo es igual a la suma de todos los dígitos a lo
            largo de la trayectoria de la flecha.
          </HelpCard>

          <HelpCard icon="○" name="Kropki blanco">
            Las dos celdas adyacentes son consecutivas: la diferencia entre sus
            dígitos es exactamente 1 (ej. 3 y 4, o 7 y 8).
          </HelpCard>

          <HelpCard icon="●" name="Kropki negro">
            Una de las dos celdas adyacentes contiene el doble del valor de la
            otra (ej. 2 y 4, o 3 y 6).
          </HelpCard>

          <HelpCard icon="V · X" name="XV">
            <strong>V</strong>: las dos celdas suman exactamente 5.{" "}
            <strong>X</strong>: las dos celdas suman exactamente 10. Las celdas
            deben ser ortogonalmente adyacentes.
          </HelpCard>

          <HelpCard icon="▢ ○" name="Paridad">
            Indica si una celda debe contener un número par (▢ cuadrado gris) o
            impar (○ círculo gris). No fija el dígito exacto, solo su paridad.
          </HelpCard>

          <HelpCard icon="♞" name="Anti-caballo">
            Restricción global: dos celdas separadas por un movimiento de
            caballo de ajedrez no pueden contener el mismo dígito.
          </HelpCard>

          <HelpCard icon="♔" name="Anti-rey">
            Restricción global: dos celdas diagonalmente adyacentes (a distancia
            de rey de ajedrez) no pueden contener el mismo dígito.
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
