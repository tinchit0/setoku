import os
from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session

DB_PATH = Path(os.environ.get("SETOKU_DB_PATH", "setoku.db"))
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
engine = create_engine(
    f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False}
)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
