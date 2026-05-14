# Variant Sudoku Builder

Aplicación para construir sudokus con restricciones poco habituales (killer cages, termómetros, flechas, kropki, XV, par/impar, anti-caballo, anti-rey, diagonales…) y jugarlos una vez la solución es única.

## Estructura

- `backend/` — API FastAPI (Python) con SQLite para guardar y cargar puzzles.
- `frontend/` — SPA React + Vite + TypeScript con el constructor, el solver y el modo juego.

## Cómo correrlo

### Publicar en internet (un solo puerto)

```bash
# 1. Build + arrancar (todo en uno)
./serve.sh          # queda en http://localhost:8000

# 2. En otra terminal, túnel con localtunnel:
npx localtunnel --port 8000
```

localtunnel te da una URL pública (p.ej. `https://xxxx.loca.lt`). La primera vez que alguien la abra verá una página de aviso de localtunnel — basta con hacer clic en "Click to Continue".

---

### Docker Compose (todo en uno)

```bash
docker compose up --build
```

Abre `http://localhost:8080`. Nginx sirve el frontend y hace proxy de `/api/*` al backend. La DB se guarda en el volumen `sudoku-data`.

### Backend

Recomendado: `uv` (más rápido). Alternativa: `python -m venv` + pip.

```bash
cd backend
uv venv
uv pip install -e .
.venv/bin/uvicorn app.main:app --reload --port 8000
```

API disponible en `http://localhost:8000/api`. Endpoints: `GET/POST/PUT/DELETE /puzzles`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. El proxy de Vite redirige `/api/*` al backend.

## Cómo se usa

### Modo Constructor

- **Seleccionar**: clic y arrastra para marcar celdas. Shift/Ctrl+clic añade. Esc deselecciona.
- **Given**: selecciona celdas y pulsa 1-9 para fijarlas. Supr para borrar.
- **Killer cage**: marca celdas, opcionalmente escribe la suma, "Añadir jaula".
- **Termómetro**: clic en cada celda en orden desde el bulbo hacia la punta, "Añadir termómetro".
- **Flecha**: 1) marca el bulbo (1+ celdas), "Fijar bulbo". 2) marca la trayectoria en orden, "Crear flecha". Para multidígito el bulbo se lee en orden de fila/columna.
- **Kropki**: marca 2 celdas adyacentes y elige blanco (consecutivos) o negro (×2).
- **XV**: marca 2 celdas adyacentes y elige V (suma 5) o X (suma 10).
- **Par/Impar**: marca celdas y elige la paridad.
- **Globales**: diagonal principal/anti, anti-caballo, anti-rey son interruptores.

El panel de estado re-evalúa la unicidad cada vez que cambias algo. Estados posibles: sin solución / única / múltiples soluciones. Cuando es **única**, el botón **Jugar** se habilita.

Puedes activar "Mostrar solución (fantasma)" para ver la solución en gris detrás de los dígitos del jugador.

### Modo Juego

- **Dígito**: introduce el número en la celda seleccionada.
- **Marcas (lápiz)**: dos estilos.
  - **Esquina** — `Ctrl`/`⌘` + 1-9 o elige "Esquina" en el panel.
  - **Centro** — `Shift` + 1-9 o elige "Centro" en el panel.
- Las celdas de **givens** no se pueden modificar.
- El panel de progreso indica errores en cuanto te desvías de la solución única.

### Guardar / Cargar

La barra superior tiene caja de título y desplegable de puzzles guardados. Los puzzles se persisten en `backend/sudoku.db`.

## Restricciones soportadas

| Tipo | Notas |
|---|---|
| Given | dígito fijo en una celda |
| Diagonal | principal `↘` / anti `↙` |
| Killer cage | celdas distintas, suma opcional |
| Termómetro | cells[0] < cells[1] < … |
| Flecha | suma de trayectoria = número formado por bulbo |
| Kropki | blanco = consecutivos, negro = ratio 1:2 |
| XV | V = suma 5, X = suma 10 |
| Par/Impar | dígito par o impar en una celda |
| Anti-caballo | no se repite a salto de caballo |
| Anti-rey | no se repite a salto de rey |

## Limitaciones conocidas

- El solver corre en el hilo principal del navegador. Puzzles muy poco restringidos pueden tardar; en ese caso añade más restricciones o `givens`. Mover a Web Worker es la próxima mejora natural.
- No hay restricción negativa para Kropki/XV (la falta de marca no implica nada).
- No hay deshacer global (sí puedes borrar restricciones individuales).
- Para el modo flecha con bulbo multi-celda, el orden del número compuesto sigue lectura natural (fila, luego columna). Selecciónalas en ese orden.
