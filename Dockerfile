# ── Stage 1: compilar frontend ────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --include=dev
COPY frontend/tsconfig.json frontend/vite.config.ts frontend/index.html ./
COPY frontend/src ./src
RUN npm run build

# ── Stage 2: backend + frontend compilado ─────────────────────────────────────
FROM python:3.12-slim
WORKDIR /app
COPY backend/pyproject.toml ./
COPY backend/app ./app
RUN pip install --no-cache-dir -e .

# main.py busca el dist en Path(__file__).parent.parent.parent / "frontend/dist"
# Con __file__ = /app/app/main.py, eso resuelve a /frontend/dist
COPY --from=frontend-build /frontend/dist /frontend/dist

ENV SUDOKU_DB_PATH=/data/sudoku.db
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
