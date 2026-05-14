import { useEffect, useState } from "react";
import { api, type PuzzleSummary } from "../api/client";
import { useStore } from "../state/store";

export function SaveLoadBar() {
  const constraints = useStore((s) => s.constraints);
  const loadPuzzle = useStore((s) => s.loadPuzzle);
  const [puzzles, setPuzzles] = useState<PuzzleSummary[]>([]);
  const [title, setTitle] = useState("");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setPuzzles(await api.list());
    } catch (e) {
      setError("No se pudo conectar con el backend");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onSave = async () => {
    setBusy(true);
    setError(null);
    try {
      if (currentId !== null) {
        const saved = await api.update(currentId, {
          title,
          data: { constraints },
        });
        setCurrentId(saved.id);
      } else {
        const saved = await api.create(title || "Sin título", "", constraints);
        setCurrentId(saved.id);
      }
      await refresh();
    } catch (e) {
      setError("Error al guardar");
    } finally {
      setBusy(false);
    }
  };

  const onLoad = async (id: number) => {
    setBusy(true);
    setError(null);
    try {
      const p = await api.get(id);
      loadPuzzle(p.data.constraints ?? []);
      setCurrentId(p.id);
      setTitle(p.title);
    } catch (e) {
      setError("Error al cargar");
    } finally {
      setBusy(false);
    }
  };

  const onNew = () => {
    loadPuzzle([]);
    setCurrentId(null);
    setTitle("");
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        placeholder="Título del puzzle"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: 180 }}
      />
      <button onClick={onSave} disabled={busy} className="primary">
        {currentId !== null ? "Guardar" : "Guardar nuevo"}
      </button>
      <button onClick={onNew}>Nuevo</button>
      <select
        value={currentId ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v) onLoad(Number(v));
        }}
      >
        <option value="">Cargar…</option>
        {puzzles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ color: "var(--danger)", fontSize: 12 }}>{error}</span>
      )}
    </div>
  );
}
