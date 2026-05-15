from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.db import init_db
from app.routers import puzzles

DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Setoku API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(puzzles.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Serve the built frontend — mounted last so /api routes take priority.
if DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str):
        # Serve an actual file if it exists (favicon.ico, etc.),
        # otherwise fall back to index.html for client-side routing.
        candidate = DIST / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST / "index.html")
