# SETOKU

Constructor y jugador de sudokus con variantes: killer cages, termómetros, flechas, Kropki, XV, par/impar, anti-caballo, anti-rey, diagonales… El solver corre en el navegador y comprueba en tiempo real si el puzzle tiene solución única.

## Estructura

```
src/
  app/          Next.js pages + API routes (puzzles, health)
  components/   Componentes React
  solver/       Solver TS + Web Worker
  state/        Zustand store
  types/        Tipos TypeScript
  lib/          db.ts — SQLite vía @libsql/client
Dockerfile      imagen Node para producción
```

## Cómo correrlo

### Desarrollo

```bash
npm install
npm run dev
```

App en `http://localhost:3000` con HMR. La API y el frontend corren en el mismo proceso.

### Producción

```bash
docker compose up --build
```

Construye una imagen Node (multi-stage, standalone), sirve todo en `http://localhost:3000`.

## Scripts

```bash
npm run dev    # entorno de desarrollo
npm test       # vitest (solver)
npm run lint   # tsc --noEmit
```

## Cómo se usa

### Modo Constructor

- **Seleccionar**: clic y arrastra. Shift/Ctrl+clic añade. Esc deselecciona.
- **Given**: selecciona celdas y pulsa 1–9. Supr para borrar.
- **Killer cage**: marca celdas, escribe suma opcional, "Añadir jaula".
- **Termómetro**: clic en cada celda en orden desde el bulbo, "Añadir termómetro".
- **Flecha**: 1) marca el bulbo, "Fijar bulbo". 2) marca la trayectoria, "Crear flecha".
- **Kropki**: 2 celdas adyacentes → blanco (consecutivos) o negro (×2).
- **XV**: 2 celdas adyacentes → V (suma 5) o X (suma 10).
- **Par/Impar**: marca celdas y elige paridad.
- **Globales**: diagonal principal/anti, anti-caballo, anti-rey.

El panel de estado re-evalúa la unicidad en tiempo real. Cuando hay múltiples soluciones, "Mostrar celdas sin determinar" resalta en ámbar las celdas que difieren entre las dos soluciones encontradas. Cuando la solución es **única**, se habilita el botón **Jugar**.

### Modo Juego

- Pulsa 1–9 para introducir dígitos.
- Ctrl/⌘+dígito → marca de esquina. Shift+dígito → marca de centro.
- El panel de progreso indica errores en tiempo real.

### Guardar / Cargar

La barra superior permite guardar puzzles con título y cargarlos desde el desplegable. Se persisten en SQLite (`setoku.db` local, o `SETOKU_DB_PATH` en producción).

## Restricciones soportadas

| Tipo | Regla |
|---|---|
| Given | Valor fijo en una celda |
| Diagonal | Todos distintos en la diagonal ↘ o ↙ |
| Killer cage | Sin repetición; suma opcional |
| Termómetro | Valores estrictamente crecientes del bulbo a la punta |
| Flecha | Bulbo = suma de la trayectoria |
| Kropki blanco | Las dos celdas son consecutivas |
| Kropki negro | Una celda es el doble de la otra |
| XV | V: suman 5 · X: suman 10 |
| Par/Impar | La celda contiene un dígito par o impar |
| Anti-caballo | Sin repetición entre celdas a distancia de caballo |
| Anti-rey | Sin repetición entre celdas diagonalmente adyacentes |
