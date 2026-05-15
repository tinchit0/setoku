# SETOKU

Constructor/jugador de sudokus con variantes (Killer, Termómetro, Kropki, etc.).
El usuario diseña puzzles añadiendo restricciones; el solver en el navegador
comprueba en tiempo real si hay solución única.

## Arquitectura

Aplicación Next.js única (App Router):

```
src/
  app/             Next.js pages + API routes
  components/      React components (todos "use client")
  solver/          Solver TS + Web Worker
  state/           Zustand store
  types/           Tipos TypeScript
  api/             Cliente fetch para la API
  lib/             db.ts — singleton LibSQL (SQLite local)
```

El **solver corre en un Web Worker** (`src/solver/solver.worker.ts`).
Los **puzzles se persisten** en SQLite vía API Routes de Next.js + `@libsql/client`.

### Comunicación

- En desarrollo y producción: Next.js sirve tanto la UI como `/api/*` en el mismo origen (puerto 3000).
- La BD SQLite se abre desde `SETOKU_DB_PATH` (por defecto `./setoku.db`).

## Comandos

```bash
npm run dev    # Next.js dev server con HMR en localhost:3000
npm test       # vitest (solver tests)
npm run lint   # tsc --noEmit

docker compose up --build   # producción: imagen Node 22, standalone build, puerto 3000
```

## Código relevante (`src/`)

| Fichero | Responsabilidad |
|---|---|
| `solver/solver.ts` | Solver completo: backtracking + propagación + verificación. Usa `Int32Array` para candidatos/grid. |
| `solver/solver.worker.ts` | Web Worker que envuelve `solvePuzzle`. Recibe `{constraints, seq}`, devuelve `{result, seq}`. |
| `state/store.ts` | Estado global Zustand (constraints, entries, solveStatus, modos) |
| `types/constraints.ts` | Tipos TypeScript para todas las restricciones |
| `types/puzzle.ts` | `SolveStatus`, `Entry`, `PuzzleData` |
| `components/AppClient.tsx` | Raíz de la UI: orquesta Web Worker, debounce 200ms, difCells, HelpDialog |
| `components/SudokuGrid.tsx` | SVG interactivo del tablero |
| `components/ConstraintPanel.tsx` | Panel constructor (modo build) |
| `components/StatusPanel.tsx` | Estado del solver + toggles de overlay |
| `components/PlayPanel.tsx` | Panel de juego (modo play) |
| `components/HelpDialog.tsx` | Modal `<dialog>` con descripción de cada restricción |
| `components/SaveLoadBar.tsx` | Guardar/cargar puzzles del backend |
| `lib/db.ts` | Singleton `@libsql/client` en modo local, init de tabla |
| `app/api/puzzles/route.ts` | GET list + POST create |
| `app/api/puzzles/[id]/route.ts` | GET + PUT + DELETE |

### Flujo del solver

1. `AppClient.tsx` detecta cambios en `constraints` (debounce 200 ms)
2. Envía mensaje al Web Worker `{ constraints, seq }`
3. El worker llama a `solvePuzzle(constraints)` en background
4. Devuelve `{ result, seq }` al hilo principal
5. `AppClient` actualiza el store via `setSolveStatus` (descarta resultados obsoletos por `seq`)
6. Los componentes reaccionan al `solveStatus`

`SolveResult` tiene tres estados: `none` | `unique` | `multiple`.
Cuando es `multiple`, contiene exactamente dos soluciones (`solutions: [Grid, Grid]`).

### Solver internals (`solver.ts`)

- **`prepare()`**: construye la estructura `Prepared` (peers como `Uint8Array[]`, candidatos iniciales como `Int32Array`, índices por celda para cada tipo de restricción). Para jaulas con suma, precalcula `combMask` con todas las combinaciones de dígitos válidas.
- **`search()`**: backtracking con MRV. Snapshots con `new Int32Array(candidates)` y restore con `.set(snap)`.
- **`propagateQueue()`**: propagación por constraint tras asignar un valor. Usa índice `head` en lugar de `shift()`. Peer pruning, pair constraints (Kropki/XV), termómetros, suma parcial de jaulas.
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

## API REST

Endpoints implementados como Route Handlers de Next.js (`src/app/api/`):

- `GET /api/puzzles` — lista ordenada por `updated_at desc`
- `POST /api/puzzles` — crea puzzle (`title`, `description`, `data: {constraints}`)
- `GET /api/puzzles/{id}`
- `PUT /api/puzzles/{id}` — actualización parcial
- `DELETE /api/puzzles/{id}`
- `GET /api/health`

Los puzzles se serializan como `JSON.stringify(data)` en SQLite y se deserializan al leer.

## Variables de entorno / puertos

| Variable | Descripción | Default |
|---|---|---|
| `SETOKU_DB_PATH` | Ruta al archivo SQLite | `./setoku.db` |
| `SETOKU_PORT` | Puerto en Docker | `3000` |
| `PORT` | Puerto de Next.js | `3000` |
