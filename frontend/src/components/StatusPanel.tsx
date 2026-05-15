import { useMemo } from "react";
import { useStore } from "../state/store";

export function StatusPanel() {
  const status = useStore((s) => s.solveStatus);
  const showSolution = useStore((s) => s.showSolution);
  const setShowSolution = useStore((s) => s.setShowSolution);
  const showDiff = useStore((s) => s.showDiff);
  const setShowDiff = useStore((s) => s.setShowDiff);

  const diffCount = useMemo(() => {
    if (status.state !== "multiple") return 0;
    const [s1, s2] = status.solutions;
    let count = 0;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (s1[r][c] !== s2[r][c]) count++;
    return count;
  }, [status]);

  let tag: { text: string; cls: string };
  let detail = "";
  switch (status.state) {
    case "idle":
      tag = { text: "—", cls: "dim" };
      detail = "Añade restricciones para evaluar.";
      break;
    case "solving":
      tag = { text: "Calculando…", cls: "warn" };
      break;
    case "none":
      tag = { text: "Sin solución", cls: "err" };
      detail = "Las restricciones se contradicen.";
      break;
    case "unique":
      tag = { text: "Única ✓", cls: "ok" };
      detail = "El puzzle es jugable.";
      break;
    case "multiple":
      tag = { text: "Múltiples", cls: "warn" };
      detail = `${diffCount} celda${diffCount !== 1 ? "s" : ""} difieren entre las dos soluciones encontradas.`;
      break;
  }

  return (
    <div className="status-panel">
      <div className="status-line">
        <span style={{ color: "var(--text-dim)" }}>Solución</span>
        <span className={`status-tag ${tag.cls}`}>{tag.text}</span>
      </div>
      {detail && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{detail}</div>}
      {(status.state === "unique" || status.state === "multiple") && (
        <label style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={showSolution}
            onChange={(e) => setShowSolution(e.target.checked)}
          />
          Mostrar solución (fantasma)
          {status.state === "multiple" && (
            <span style={{ color: "var(--text-dim)" }}>· una de varias</span>
          )}
        </label>
      )}
      {status.state === "multiple" && (
        <label style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={showDiff}
            onChange={(e) => setShowDiff(e.target.checked)}
          />
          Mostrar celdas sin determinar
        </label>
      )}
    </div>
  );
}
