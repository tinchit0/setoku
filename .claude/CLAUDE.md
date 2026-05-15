# Setoku

Constructor/jugador de sudokus con variantes (Killer, Termómetro, Kropki, etc.).
El usuario diseña puzzles añadiendo restricciones; el solver en el navegador
comprueba en tiempo real si hay solución única.

## Arquitectura

Monorepo con dos servicios independientes:

```
frontend/   React + TypeScript + Vite + Zustand
backend/    Python + FastAPI + SQLModel + SQLite
```

El **solver corre íntegramente en el frontend** (`src/solver/solver.ts`).
El backend solo persiste puzzles (CRUD sobre `sudoku.db`).

### Comunicación

- En desarrollo: Vite proxea `/api` → `localhost:8000` (ver `frontend/vite.config.ts`)
- En producción: uvicorn sirve el frontend compilado como ficheros estáticos y
  expone `/api` en el mismo origen. Un único contenedor Docker (Dockerfile en la raíz,
  multi-stage node→python).

## Comandos

```bash
scripts/dev    # hot reload: uvicorn --reload + vite dev server
scripts/test   # pytest (backend) + vitest (frontend)
scripts/lint   # ruff (backend) + tsc --noEmit (frontend)

docker compose up --build   # producción: imagen única, uvicorn sirve todo en :8000
```

`scripts/dev` levanta los dos procesos en paralelo con output prefixado por color
y los mata limpiamente con Ctrl-C (usa FIFOs para no perder los PIDs reales).

Las deps de dev del backend (pytest, httpx, ruff) están en `[project.optional-dependencies] dev`
en `backend/pyproject.toml`. `scripts/dev` las instala con `uv pip install -e ".[dev]"`.

## Frontend (`frontend/src/`)

| Fichero | Responsabilidad |
|---|---|
| `solver/solver.ts` | Solver completo: backtracking + propagación + verificación |
| `state/store.ts` | Estado global Zustand (constraints, entries, solveStatus, modos) |
| `types/constraints.ts` | Tipos TypeScript para todas las restricciones |
| `types/puzzle.ts` | `SolveStatus`, `Entry`, `PuzzleData` |
| `components/SudokuGrid.tsx` | SVG interactivo del tablero |
| `components/ConstraintPanel.tsx` | Panel constructor (modo build) |
| `components/StatusPanel.tsx` | Estado del solver + toggles de overlay |
| `components/PlayPanel.tsx` | Panel de juego (modo play) |
| `components/HelpDialog.tsx` | Modal `<dialog>` con descripción de cada restricción |
| `components/SaveLoadBar.tsx` | Guardar/cargar puzzles del backend |
| `App.tsx` | Raíz: orquesta solver reactivo, difCells, HelpDialog |

### Flujo del solver

1. `App.tsx` detecta cambios en `constraints` (debounce 200 ms)
2. Llama a `solvePuzzle(constraints)` → `SolveResult`
3. Guarda en store via `setSolveStatus`
4. Los componentes reaccionan al `solveStatus`

`SolveResult` tiene tres estados: `none` | `unique` | `multiple`.
Cuando es `multiple`, contiene exactamente dos soluciones (`solutions: [Grid, Grid]`).

### Solver internals (`solver.ts`)

- **`prepare()`**: construye la estructura `Prepared` (peers, candidatos iniciales,
  índices por celda para cada tipo de restricción)
- **`search()`**: backtracking con MRV (Minimum Remaining Values)
- **`propagateQueue()`**: propagación por constraint tras asignar un valor:
  peer pruning, pair constraints (Kropki/XV), termómetros, suma parcial de jaulas
- Para jaulas y flechas con suma, la verificación completa ocurre en `verifyComplete()`
- El solver se detiene en cuanto encuentra 2 soluciones (no enumera todas)

### Restricciones soportadas

| kind | Descripción |
|---|---|
| `given` | Valor fijo en una celda |
| `diagonal` | Diagonal principal o anti (todos distintos) |
| `cage` | Jaula killer: sin repetición, suma opcional |
| `thermometer` | Valores estrictamente crecientes del bulbo a la punta |
| `arrow` | Bulbo = suma de los dígitos del trayecto |
| `kropki` | Blanco: consecutivos; negro: uno es el doble del otro |
| `xv` | V: suma 5; X: suma 10 |
| `parity` | Celda par o impar |
| `antiKnight` | Sin repetición entre celdas a distancia de caballo |
| `antiKing` | Sin repetición entre celdas diagonalmente adyacentes |

### Modos y herramientas

- **Modo build**: selecciona herramienta → selecciona celdas → confirma restricción
- **Modo play**: solo disponible cuando `solveStatus.state === "unique"`
- Pencil marks: corner (Ctrl+dígito) y center (Shift+dígito)
- Multi-select: Shift/Ctrl+click o arrastrar

### Overlays del tablero

- **Fantasma** (`showSolution`): muestra la solución en verde tenue
- **Celdas sin determinar** (`showDiff`): resalta en ámbar las celdas que difieren
  entre las dos soluciones encontradas, con ambos valores posibles visibles

## Backend (`backend/app/`)

REST API mínima, sin lógica de negocio:

- `GET /api/puzzles` — lista ordenada por `updated_at desc`
- `POST /api/puzzles` — crea puzzle (`title`, `description`, `data: {constraints}`)
- `GET /api/puzzles/{id}`
- `PUT /api/puzzles/{id}` — actualización parcial
- `DELETE /api/puzzles/{id}`
- `GET /api/health`

Los puzzles se serializan enteros como JSON en la columna `data` (SQLite).
La base de datos se crea automáticamente en `backend/sudoku.db` al arrancar.

## Variables de entorno / puertos

| Puerto | Servicio |
|---|---|
| 5173 | Vite dev server |
| 8000 | uvicorn (dev y prod) |

No hay fichero `.env`; la configuración está hardcodeada para entorno local.
