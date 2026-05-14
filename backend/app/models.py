from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column, JSON


class PuzzleBase(SQLModel):
    title: str = Field(default="Untitled", max_length=200)
    description: str = Field(default="", max_length=2000)
    data: dict = Field(default_factory=dict, sa_column=Column(JSON))


class Puzzle(PuzzleBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PuzzleCreate(PuzzleBase):
    pass


class PuzzleUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    data: Optional[dict] = None


class PuzzleRead(PuzzleBase):
    id: int
    created_at: datetime
    updated_at: datetime
