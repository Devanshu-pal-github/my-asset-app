from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import os
import io
import csv
import tempfile
import time
from enum import Enum
import random  # For mock data only

from app.services.analytics_service import (
    get_asset_analytics,
    get_department_analytics,
    get_maintenance_analytics,
    get_employee_asset_analytics
)
from app.db.session import get_db

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
    responses={404: {"description": "Not found"}},
)

# Define models for response schemas
class TimeFrame(str, Enum):
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    ALL = "all"

class PaginatedResponse(BaseModel):
    page: int
    total_pages: int
    total_count: int
    limit: int

class CategoryStatData(BaseModel):
    category_id: str
    name: str
    count: int
    value: float
    
class StatusStatData(BaseModel):
    status: str
    count: int
    value: float

class AcquisitionData(BaseModel):
    month: str  # Format: YYYY-MM
    count: int
    value: float

class DepartmentAssetData(BaseModel):
    department: str
    count: int
    value: float

class AssetAgeData(BaseModel):
    age_range: str
    count: int
    percentage: float

class MaintenanceData(BaseModel):
    month: str  # Format: YYYY-MM
    count: int
    cost: float

class EmployeeAssetData(BaseModel):
    id: str
    name: str
    department: str
    assets: int
    value: float

class AssetStatsResponse(PaginatedResponse):
    data: Dict[str, Any]

class DepartmentStatsResponse(PaginatedResponse):
    departments: List[DepartmentAssetData]

class EmployeeStatsResponse(PaginatedResponse):
    employees: List[EmployeeAssetData]


def _get_date_range_from_timeframe(time_frame: TimeFrame):
    """Helper function to get date range based on time frame"""
    now = datetime.now()
    if time_frame == TimeFrame.MONTH:
        start_date = now - timedelta(days=30)
    elif time_frame == TimeFrame.QUARTER:
        start_date = now - timedelta(days=90)
    elif time_frame == TimeFrame.YEAR:
        start_date = now - timedelta(days=365)
    else:  # ALL
        start_date = now - timedelta(days=3650)  # ~10 years
    
    return start_date, now


@router.get("/assets", response_model=AssetStatsResponse)
async def get_asset_analytics_api(
    time_frame: TimeFrame = TimeFrame.YEAR,
    page: int = Query(1, gt=0),
    limit: int = Query(1000, gt=0, le=100000),
    db = Depends(get_db)
):
    """
    Retrieve asset statistics for visualization
    - Handles large datasets with pagination
    - Returns aggregated data by category, status, and acquisition time
    - Optimized for performance with data sampling for large datasets
    """
    try:
        # Use the analytics service to get the data
        result = get_asset_analytics(
            db=db,
            time_frame=time_frame.value,
            page=page,
            limit=limit
        )
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve asset statistics: {str(e)}")


@router.get("/departments", response_model=DepartmentStatsResponse)
async def get_department_analytics_api(
    time_frame: TimeFrame = TimeFrame.YEAR,
    page: int = Query(1, gt=0),
    limit: int = Query(1000, gt=0, le=100000),
    db = Depends(get_db)
):
    """
    Retrieve department asset statistics
    - Returns aggregated data by department
    - Supports pagination for large organizations with many departments
    """
    try:
        # Use the analytics service to get the data
        result = get_department_analytics(
            db=db,
            time_frame=time_frame.value,
            page=page,
            limit=limit
        )
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve department statistics: {str(e)}")


@router.get("/maintenance", response_model=Dict[str, Any])
async def get_maintenance_analytics_api(
    time_frame: TimeFrame = TimeFrame.YEAR,
    page: int = Query(1, gt=0),
    limit: int = Query(1000, gt=0, le=100000),
    db = Depends(get_db)
):
    """
    Retrieve maintenance cost and frequency analytics
    - Returns maintenance data over time
    - Supports pagination for organizations with extensive maintenance records
    """
    try:
        # Use the analytics service to get the data
        result = get_maintenance_analytics(
            db=db,
            time_frame=time_frame.value,
            page=page,
            limit=limit
        )
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve maintenance statistics: {str(e)}")


@router.get("/employees", response_model=EmployeeStatsResponse)
async def get_employee_asset_analytics_api(
    page: int = Query(1, gt=0),
    limit: int = Query(20, gt=0, le=1000),
    sort_by: str = Query("value", regex="^(value|assets|name|department)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db = Depends(get_db)
):
    """
    Retrieve employee asset allocation statistics
    - Returns data about assets assigned to employees
    - Supports pagination and sorting for organizations with many employees
    """
    try:
        # Use the analytics service to get the data
        result = get_employee_asset_analytics(
            db=db,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order
        )
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve employee asset statistics: {str(e)}")


@router.get("/reports/{report_type}")
async def generate_report(
    report_type: str,
    background_tasks: BackgroundTasks,
    time_frame: TimeFrame = TimeFrame.YEAR,
    format: str = Query("pdf", regex="^(pdf|csv|excel)$"),
    db = Depends(get_db)
):
    """
    Generate and download asset management reports
    - Supports different report types
    - Handles large datasets by running generation in the background
    - Returns file for download
    """
    valid_report_types = ["summary", "departments", "maintenance", "depreciation"]
    
    if report_type not in valid_report_types:
        raise HTTPException(status_code=400, detail=f"Invalid report type. Must be one of: {', '.join(valid_report_types)}")
    
    try:
        # For demo purposes, just create a simple CSV file
        # In a real app, this would generate proper reports with charts, tables, etc.
        
        if format == "csv":
            # Create a temporary file
            fd, path = tempfile.mkstemp(suffix='.csv')
            
            with os.fdopen(fd, 'w', newline='') as tmp:
                # Create CSV writer
                writer = csv.writer(tmp)
                
                # Get data based on report type
                if report_type == "summary":
                    # Get asset stats
                    asset_stats = get_asset_analytics(
                        db=db,
                        time_frame=time_frame.value,
                        page=1,
                        limit=10000  # Get more data for the report
                    )
                    
                    writer.writerow(['Category', 'Count', 'Value'])
                    for category in asset_stats["data"]["categories"]:
                        writer.writerow([
                            category["name"],
                            str(category["count"]),
                            f'${category["value"]:,.2f}'
                        ])
                
                elif report_type == "departments":
                    # Get department stats
                    dept_stats = get_department_analytics(
                        db=db,
                        time_frame=time_frame.value,
                        page=1,
                        limit=10000  # Get more data for the report
                    )
                    
                    writer.writerow(['Department', 'Asset Count', 'Asset Value'])
                    for dept in dept_stats["departments"]:
                        writer.writerow([
                            dept["department"],
                            str(dept["count"]),
                            f'${dept["value"]:,.2f}'
                        ])
                
                elif report_type == "maintenance":
                    # Get maintenance stats
                    maint_stats = get_maintenance_analytics(
                        db=db,
                        time_frame=time_frame.value,
                        page=1,
                        limit=10000  # Get more data for the report
                    )
                    
                    writer.writerow(['Month', 'Maintenance Count', 'Cost'])
                    for item in maint_stats["maintenance_data"]:
                        writer.writerow([
                            item["month"],
                            str(item["count"]),
                            f'${item["cost"]:,.2f}'
                        ])
                
                elif report_type == "depreciation":
                    # For depreciation, we would need a special service function
                    # Just mock some data for now
                    asset_stats = get_asset_analytics(
                        db=db,
                        time_frame=time_frame.value,
                        page=1,
                        limit=10000
                    )
                    
                    writer.writerow(['Asset Category', 'Initial Value', 'Current Value', 'Depreciation'])
                    for category in asset_stats["data"]["categories"]:
                        # Mock depreciation calculation at 20% per year
                        initial_value = category["value"]
                        current_value = initial_value * 0.8  # 20% depreciation
                        depreciation = initial_value - current_value
                        
                        writer.writerow([
                            category["name"],
                            f'${initial_value:,.2f}',
                            f'${current_value:,.2f}',
                            f'${depreciation:,.2f}'
                        ])
            
            # Return the CSV file for download
            background_tasks.add_task(lambda: os.unlink(path))  # Delete file after download
            return FileResponse(
                path, 
                filename=f"{report_type}_report_{time_frame}_{datetime.now().strftime('%Y%m%d')}.csv", 
                media_type="text/csv"
            )
        
        else:
            # In a real app, generate PDF/Excel files
            # For demo, just return a success message
            return {"message": f"{report_type.capitalize()} report for {time_frame} would be generated as {format.upper()} in a real application"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}") 