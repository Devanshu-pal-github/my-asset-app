from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import db
from app.models.maintenance_history import MaintenanceHistory, MaintenanceHistoryCreate
from app.services.maintenance_history_service import create_maintenance_history, get_maintenance_history
from typing import List

router = APIRouter(prefix="/maintenance-history", tags=["Maintenance History"])

@router.get("/", response_model=List[MaintenanceHistory])
def read_maintenance_history(asset_id: str):
    print(f"Fetching maintenance history for asset_id: {asset_id}")
    history = get_maintenance_history(db, asset_id)
    return history

@router.post("/", response_model=MaintenanceHistory)
def create_new_maintenance_history(history: MaintenanceHistoryCreate):
    print(f"Creating maintenance history for asset: {history.asset_id}")
    return create_maintenance_history(db, history)