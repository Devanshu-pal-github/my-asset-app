from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import db
from app.models.assignment_history import AssignmentHistory, AssignmentHistoryCreate
from app.services.assignment_history_service import (
    create_assignment_history,
    get_assignment_history,
    delete_assignment_history_record,
    unassign_employee_from_asset  # New import
)
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

@router.post("/unassign", response_model=AssignmentHistory)
def unassign_employee(asset_id: str, employee_id: str):
    """
    Unassign a specific employee from an asset.
    """
    print(f"Unassigning employee {employee_id} from asset {asset_id}")
    return unassign_employee_from_asset(db, asset_id, employee_id)

@router.delete("/{id}", response_model=dict)
def delete_assignment_history(id: str):
    deleted = delete_assignment_history_record(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Assignment history record not found")
    return {"message": "Assignment history record deleted successfully"}