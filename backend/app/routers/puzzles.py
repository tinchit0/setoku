from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models import Puzzle, PuzzleCreate, PuzzleRead, PuzzleUpdate

router = APIRouter(prefix="/puzzles", tags=["puzzles"])


@router.get("", response_model=List[PuzzleRead])
def list_puzzles(session: Session = Depends(get_session)):
    return session.exec(select(Puzzle).order_by(Puzzle.updated_at.desc())).all()


@router.post("", response_model=PuzzleRead, status_code=201)
def create_puzzle(payload: PuzzleCreate, session: Session = Depends(get_session)):
    puzzle = Puzzle.model_validate(payload)
    session.add(puzzle)
    session.commit()
    session.refresh(puzzle)
    return puzzle


@router.get("/{puzzle_id}", response_model=PuzzleRead)
def get_puzzle(puzzle_id: int, session: Session = Depends(get_session)):
    puzzle = session.get(Puzzle, puzzle_id)
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    return puzzle


@router.put("/{puzzle_id}", response_model=PuzzleRead)
def update_puzzle(puzzle_id: int, payload: PuzzleUpdate, session: Session = Depends(get_session)):
    puzzle = session.get(Puzzle, puzzle_id)
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(puzzle, key, value)
    puzzle.updated_at = datetime.utcnow()
    session.add(puzzle)
    session.commit()
    session.refresh(puzzle)
    return puzzle


@router.delete("/{puzzle_id}", status_code=204)
def delete_puzzle(puzzle_id: int, session: Session = Depends(get_session)):
    puzzle = session.get(Puzzle, puzzle_id)
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    session.delete(puzzle)
    session.commit()
