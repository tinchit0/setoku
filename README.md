# Setoku

Constructor y jugador de sudokus con variantes: killer cages, termómetros, flechas, Kropki, XV, par/impar, anti-caballo, anti-rey, diagonales… El solver corre en el navegador y comprueba en tiempo real si el puzzle tiene solución única.

## Estructura

```
frontend/   React + TypeScript + Vite  (solver, constructor, modo juego)
backend/    FastAPI + SQLite            (guardar y cargar puzzles)
scripts/    dev, test, lint
Dockerfile  imagen única para producción
```

## Cómo correrlo

### Desarrollo

```bash
scripts/dev
```

Levanta el backend en `http://localhost:8000` (con `--reload`) y el frontend en `http://localhost:5173` (con HMR). Ctrl-C para detener ambos.

### Producción

```bash
docker compose up --build
```

Construye una imagen única (node → python, multi-stage), uvicorn sirve la API y el frontend compilado en `http://localhost:8000`.

## Scripts

```bash
scripts/dev    # entorno de desarrollo
scripts/test   # pytest (backend) + vitest (frontend)
scripts/lint   # ruff (backend) + tsc --noEmit (frontend)
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

La barra superior permite guardar puzzles con título y cargarlos desde el desplegable. Se persisten en `backend/sudoku.db`.

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
