from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import db
from app.models.assignment_history import AssignmentHistory, AssignmentHistoryCreate
from app.services.assignment_history_service import create_assignment_history, get_assignment_history
from typing import List

router = APIRouter(prefix="/assignment-history", tags=["Assignment History"])

@router.get("/", response_model=List[AssignmentHistory])
def read_assignment_history(asset_id: str):
    print(f"Fetching assignment history for asset_id: {asset_id}")
    history = get_assignment_history(db, asset_id)
    return history

@router.post("/", response_model=AssignmentHistory)
def create_new_assignment_history(history: AssignmentHistoryCreate):
    print(f"Creating assignment history for asset: {history.asset_id}")
    return create_assignment_history(db, history)