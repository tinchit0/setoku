import { useStore } from "../state/store";

export function StatusPanel() {
  const status = useStore((s) => s.solveStatus);
  const showSolution = useStore((s) => s.showSolution);
  const setShowSolution = useStore((s) => s.setShowSolution);

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
      detail = "Añade más restricciones para forzar una única solución.";
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
    </div>
  );
}
