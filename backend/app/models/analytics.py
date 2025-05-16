from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime
import uuid
from .utils import (
    model_config, 
    generate_uuid, 
    get_current_datetime
)

# Base schemas for common analytics data structures

class PaginationData(BaseModel):
    """Pagination information for data responses"""
    page: int = Field(..., description="Current page number")
    total_pages: int = Field(..., description="Total number of pages")
    total_count: int = Field(..., description="Total count of records")
    limit: int = Field(..., description="Number of records per page")
    
    model_config = model_config

# ---- Asset Category Analytics ----

class AssetCategoryStats(BaseModel):
    """Asset data by category - for AssetCategoryChart"""
    category: str = Field(..., description="Category name")
    count: int = Field(..., description="Number of assets in this category")
    value: float = Field(..., description="Total value of assets in this category")
    
    model_config = model_config

# ---- Asset Status Analytics ----

class AssetStatusStats(BaseModel):
    """Asset data by status - for AssetStatusChart"""
    status: str = Field(..., description="Asset status (In Use, Available, In Maintenance, etc.)")
    count: int = Field(..., description="Number of assets with this status")
    
    model_config = model_config

# ---- Asset Acquisition Analytics ----

class AssetAcquisitionStats(BaseModel):
    """Asset acquisition data over time - for AssetAcquisitionChart"""
    month: str = Field(..., description="Month in YYYY-MM format")
    count: int = Field(..., description="Number of assets acquired in this month")
    value: float = Field(..., description="Total value of assets acquired in this month")
    
    model_config = model_config

# ---- Department Asset Analytics ----

class DepartmentAssetStats(BaseModel):
    """Asset data by department - for DepartmentAssetChart"""
    department: str = Field(..., description="Department name")
    count: int = Field(..., description="Number of assets assigned to this department")
    value: float = Field(..., description="Total value of assets assigned to this department")
    
    model_config = model_config

# ---- Maintenance Cost Analytics ----

class MaintenanceCostStats(BaseModel):
    """Maintenance cost data over time - for MaintenanceCostChart"""
    month: str = Field(..., description="Month in format MMM YYYY (e.g., 'Jan 2023')")
    cost: float = Field(..., description="Total maintenance cost for this month")
    count: int = Field(..., description="Number of maintenance activities in this month")
    
    model_config = model_config

# ---- Asset Age Analytics ----

class AssetAgeStats(BaseModel):
    """Asset age distribution - for AssetAgeChart"""
    range: str = Field(..., description="Age range (e.g., '< 1 year', '1-2 years')")
    count: int = Field(..., description="Number of assets in this age range")
    percentage: Optional[float] = Field(None, description="Percentage of total assets (calculated field)")
    
    model_config = model_config

# ---- Employee Asset Analytics ----

class EmployeeAssetStats(BaseModel):
    """Employee asset stats for TopEmployeesTable"""
    id: str = Field(default_factory=generate_uuid, description="Employee ID")
    name: str = Field(..., description="Employee name")
    department: str = Field(..., description="Department name")
    assets: int = Field(..., description="Number of assets assigned")
    value: float = Field(..., description="Total value of assigned assets")
    
    model_config = model_config

# ---- Overall Asset Statistics ----

class AssetStatistics(BaseModel):
    """Overall asset statistics for StatisticsCards"""
    total_asset_count: int = Field(..., description="Total number of assets")
    total_asset_value: float = Field(..., description="Total value of all assets")
    total_departments: int = Field(..., description="Total number of departments with assets")
    average_asset_age: float = Field(..., description="Average age of all assets in years")
    
    model_config = model_config

# ---- Analytics Data Response Models ----

class AssetAnalyticsData(BaseModel):
    """Complete asset analytics data"""
    statistics: AssetStatistics = Field(..., description="Overall asset statistics")
    categories: List[AssetCategoryStats] = Field(default_factory=list, description="Asset data by category")
    statuses: List[AssetStatusStats] = Field(default_factory=list, description="Asset data by status")
    acquisitions: List[AssetAcquisitionStats] = Field(default_factory=list, description="Asset acquisition data")
    asset_age: List[AssetAgeStats] = Field(default_factory=list, description="Asset age distribution")
    
    model_config = model_config

class DepartmentAnalyticsData(BaseModel):
    """Department analytics data"""
    departments: List[DepartmentAssetStats] = Field(default_factory=list, description="Asset data by department")
    
    model_config = model_config

class MaintenanceAnalyticsData(BaseModel):
    """Maintenance analytics data"""
    maintenance_data: List[MaintenanceCostStats] = Field(default_factory=list, description="Maintenance cost data")
    
    model_config = model_config

class EmployeeAssetAnalyticsData(BaseModel):
    """Employee asset analytics data"""
    employees: List[EmployeeAssetStats] = Field(default_factory=list, description="Employee asset data")
    pagination: PaginationData = Field(..., description="Pagination information")
    
    model_config = model_config

# ---- Analytics Response Models ----

class AnalyticsResponse(BaseModel):
    """Base analytics response"""
    success: bool = Field(True, description="Operation success status")
    message: Optional[str] = Field(None, description="Operation message")
    data: Optional[Dict[str, Any]] = Field(None, description="Analytics data")
    
    model_config = model_config

class AssetAnalyticsResponse(AnalyticsResponse):
    """Asset analytics response"""
    data: AssetAnalyticsData = Field(..., description="Asset analytics data")
    
    model_config = model_config

class DepartmentAnalyticsResponse(AnalyticsResponse):
    """Department analytics response"""
    data: DepartmentAnalyticsData = Field(..., description="Department analytics data")
    
    model_config = model_config

class MaintenanceAnalyticsResponse(AnalyticsResponse):
    """Maintenance analytics response"""
    data: MaintenanceAnalyticsData = Field(..., description="Maintenance analytics data")
    
    model_config = model_config

class EmployeeAssetAnalyticsResponse(AnalyticsResponse):
    """Employee asset analytics response"""
    data: EmployeeAssetAnalyticsData = Field(..., description="Employee asset analytics data")
    
    model_config = model_config

# ---- Report Generation Models ----

class TimeFrame(str, Enum):
    """Time frame options for analytics"""
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"

class ReportType(str, Enum):
    """Report types for report generation"""
    ASSET_SUMMARY = "asset_summary"
    DEPARTMENT_ASSETS = "department_assets"
    MAINTENANCE_COSTS = "maintenance_costs"
    EMPLOYEE_ASSETS = "employee_assets"

class ReportGenerationRequest(BaseModel):
    """Request model for report generation"""
    reportType: ReportType = Field(..., description="Type of report to generate")
    timeFrame: TimeFrame = Field(..., description="Time frame for the report data")
    dataLimit: Optional[int] = Field(1000, description="Maximum number of data points to include")
    fileFormat: Optional[str] = Field("pdf", description="Output format (pdf, excel, csv)")
    
    model_config = model_config

class ReportGenerationResponse(BaseModel):
    """Response model for report generation"""
    success: bool = Field(True, description="Operation success status")
    message: str = Field(..., description="Operation message")
    reportUrl: Optional[str] = Field(None, description="URL to download the generated report")
    
    model_config = model_config 