from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime, date
from .utils import (
    model_config,
    generate_asset_id,
    generate_uuid,
    get_current_datetime
)

# Enum for Asset Status - lowercase to match frontend
class AssetStatus(str, Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    UNDER_MAINTENANCE = "under_maintenance"
    DAMAGED = "damaged"
    NON_SERVICEABLE = "non_serviceable"
    MAINTENANCE_REQUESTED = "maintenance_requested"
    MAINTENANCE_COMPLETED = "maintenance_completed"
    RETIRED = "retired"
    PENDING = "pending"
    LOST = "lost"

# Enum for Asset Condition - lowercase to match frontend
class AssetCondition(str, Enum):
    NEW = "new"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    EXCELLENT = "excellent"
    DAMAGED = "damaged"

# Asset History Entry Schema
class AssetHistoryEntry(BaseModel):
    id: str = Field(default_factory=generate_uuid, description="Unique identifier for the history record")
    type: str = Field(..., description="Type of history entry, e.g., 'assignment', 'maintenance'")
    date: str = Field(..., description="Date of the event in YYYY-MM-DD format")
    user_id: Optional[str] = Field(None, description="ID of the user who performed the action")
    user_name: Optional[str] = Field(None, description="Name of the user who performed the action")
    details: str = Field(..., description="Details of the history entry")
    notes: Optional[str] = Field(None, description="Additional notes")

    model_config = model_config

# Specifications Schema
class Specification(BaseModel):
    key: str = Field(..., description="Specification name, e.g., 'RAM'")
    value: str = Field(..., description="Specification value, e.g., '16GB'")

    model_config = model_config

# Maintenance Record Schema
class MaintenanceRecord(BaseModel):
    maintenance_id: str = Field(..., description="Unique maintenance record ID")
    request_date: str = Field(..., description="Date of the maintenance request")
    maintenance_type: str = Field(..., description="Type of maintenance")
    status: str = Field(..., description="Maintenance status")
    assignee: Optional[str] = Field(None, description="Person assigned for maintenance")
    description: str = Field(..., description="Description of the maintenance")
    completed_date: Optional[str] = Field(None, description="Date when maintenance was completed")
    cost: Optional[float] = Field(None, description="Cost of the maintenance")
    notes: Optional[str] = Field(None, description="Additional notes")

    model_config = model_config

# Document Schema
class Document(BaseModel):
    doc_id: str = Field(..., description="Unique document ID")
    name: str = Field(..., description="Document name")
    type: str = Field(..., description="Document type, e.g., 'warranty', 'invoice'")
    url: str = Field(..., description="URL to the document")
    upload_date: str = Field(..., description="Date when document was uploaded")
    expiry_date: Optional[str] = Field(None, description="Document expiry date if applicable")
    notes: Optional[str] = Field(None, description="Additional notes")

    model_config = model_config

# Tag Schema
class Tag(BaseModel):
    id: str = Field(default_factory=generate_uuid, description="Unique tag ID")
    name: str = Field(..., description="Tag name")
    color: Optional[str] = Field(None, description="Tag color")

    model_config = model_config

# Maintenance Schedule Schema
class MaintenanceSchedule(BaseModel):
    frequency: int = Field(..., description="Frequency of maintenance")
    frequency_unit: str = Field(..., description="Unit for frequency (days, weeks, months, years)")
    maintenance_type: Optional[str] = Field(None, description="Type of maintenance")
    description: Optional[str] = Field(None, description="Description of the maintenance schedule")
    is_active: bool = Field(default=True, description="Whether the maintenance schedule is active")
    last_maintenance_date: Optional[str] = Field(None, description="Date of the last maintenance")
    next_maintenance_date: Optional[str] = Field(None, description="Date of the next maintenance")
    
    model_config = model_config

# AssetItem Schema with all required frontend fields
class AssetItem(BaseModel):
    id: str = Field(default_factory=generate_asset_id, description="Unique asset ID")
    
    # Basic Information
    category_id: str = Field(..., description="Asset category ID")
    category_name: Optional[str] = Field(None, description="Asset category name for reference")
    name: str = Field(..., description="Asset name")
    asset_tag: str = Field(..., description="Asset tag or identifier")
    
    # Fields from index.jsx
    asset_id: Optional[str] = Field(None, description="Asset ID used in frontend")
    assetId: Optional[str] = Field(None, description="Asset ID (camelCase alias)")
    assetName: Optional[str] = Field(None, description="Asset name (camelCase alias)")
    categoryId: Optional[str] = Field(None, description="Category ID (camelCase alias)")
    categoryName: Optional[str] = Field(None, description="Category name (camelCase alias)")
    
    # Status Information
    status: AssetStatus = Field(default=AssetStatus.AVAILABLE, description="Current status of the asset")
    condition: AssetCondition = Field(default=AssetCondition.NEW, description="Current condition of the asset")
    is_operational: Optional[bool] = Field(True, description="Whether the asset is operational (from EditAssetForm)")
    isOperational: Optional[bool] = Field(True, description="Whether the asset is operational (camelCase alias)")
    
    # Acquisition Details
    purchase_date: Optional[str] = Field(None, description="Date of purchase in YYYY-MM-DD format")
    purchase_cost: Optional[float] = Field(None, description="Cost of the asset at purchase")
    expected_useful_life: Optional[int] = Field(None, description="Expected useful life in months")
    warranty_end_date: Optional[str] = Field(None, description="Warranty expiration date in YYYY-MM-DD format")
    warranty_info: Optional[str] = Field(None, description="Additional warranty information")
    warranty_until: Optional[str] = Field(None, description="Warranty expiration date (from EditAssetSpecsAndFinanceForm)")
    warrantyUntil: Optional[str] = Field(None, description="Warranty until date (camelCase alias)")
    
    # Vendor Information
    vendor: Optional[str] = Field(None, description="Vendor name (from EditAssetSpecsAndFinanceForm)")
    vendor_name: Optional[str] = Field(None, description="Name of the vendor")
    vendor_contact: Optional[str] = Field(None, description="Contact information for the vendor")
    vendor_email: Optional[str] = Field(None, description="Email of the vendor")
    vendor_phone: Optional[str] = Field(None, description="Phone number of the vendor")
    invoice_number: Optional[str] = Field(None, description="Invoice number for the purchase")
    
    # Financial Information
    depreciation_method: Optional[str] = Field(None, description="Method used for calculating depreciation")
    current_value: Optional[float] = Field(None, description="Current value after depreciation (from EditAssetSpecsAndFinanceForm)")
    currentValue: Optional[float] = Field(None, description="Current value (camelCase alias)")
    salvage_value: Optional[float] = Field(None, description="Expected salvage value")
    total_cost: Optional[float] = Field(None, description="Total cost including additional costs")
    insurance_policy: Optional[str] = Field(None, description="Insurance policy (from EditAssetSpecsAndFinanceForm)")
    insurancePolicy: Optional[str] = Field(None, description="Insurance policy (camelCase alias)")
    
    # Location Information
    location: Optional[str] = Field(None, description="Current location of the asset (from EditAssetForm)")
    building: Optional[str] = Field(None, description="Building where the asset is located")
    floor: Optional[str] = Field(None, description="Floor where the asset is located")
    room: Optional[str] = Field(None, description="Room where the asset is located")
    
    # Assignment Information
    assigned_to: Optional[str] = Field(None, description="ID of the employee the asset is assigned to")
    assigned_to_name: Optional[str] = Field(None, description="Name of the employee the asset is assigned to")
    assignedTo: Optional[str] = Field(None, description="Employee ID asset is assigned to (camelCase alias)")
    assigned_at: Optional[str] = Field(None, description="Date when the asset was assigned")
    current_assignment_date: Optional[str] = Field(None, description="Date of current assignment (from index.jsx)")
    currentAssignmentDate: Optional[str] = Field(None, description="Current assignment date (camelCase alias)")
    assignment_due_date: Optional[str] = Field(None, description="Date when the assignment is due for return")
    assignment_notes: Optional[str] = Field(None, description="Notes about the assignment")
    current_assignee_id: Optional[str] = Field(None, description="ID of current assignee (from EmployeeAssignment)")
    current_assignee_name: Optional[str] = Field(None, description="Name of current assignee")
    
    # Department Information (from EditAssetForm)
    department: Optional[str] = Field(None, description="Department the asset is assigned to")
    
    # Specifications
    specifications: List[Specification] = Field(default_factory=list, description="Technical specifications")
    
    # Warranty and Documents
    warranty_details: Optional[Dict[str, Any]] = Field(None, description="Detailed warranty information")
    documents: List[Document] = Field(default_factory=list, description="Associated documents")
    
    # History records
    maintenance_history: List[MaintenanceRecord] = Field(default_factory=list, description="Maintenance history")
    maintenance_schedule: Optional[MaintenanceSchedule] = Field(None, description="Maintenance schedule for the asset")
    assignment_history: List[Dict[str, Any]] = Field(default_factory=list, description="Assignment history")
    audit_history: List[Dict[str, Any]] = Field(default_factory=list, description="Audit history")
    history: Optional[List[AssetHistoryEntry]] = Field(default_factory=list, description="General history of the asset")
    
    # Additional Information
    notes: Optional[str] = Field(None, description="General notes about the asset (from EditAssetSpecsAndFinanceForm)")
    serial_number: Optional[str] = Field(None, description="Serial number of the asset")
    serialNumber: Optional[str] = Field(None, description="Serial number (camelCase alias)")
    model: Optional[str] = Field(None, description="Model of the asset (from EditAssetSpecsAndFinanceForm)")
    manufacturer: Optional[str] = Field(None, description="Manufacturer of the asset")
    description: Optional[str] = Field(None, description="Detailed description of the asset")
    
    # Maintenance Information (from index.jsx)
    maintenance_due_date: Optional[str] = Field(None, description="Maintenance due date (from EditAssetSpecsAndFinanceForm)")
    maintenanceDueDate: Optional[str] = Field(None, description="Maintenance due date (camelCase alias)")
    last_maintenance_date: Optional[str] = Field(None, description="Date of last maintenance")
    
    # Disposal Information (from EditAssetSpecsAndFinanceForm)
    disposal_date: Optional[str] = Field(None, description="Disposal date")
    disposalDate: Optional[str] = Field(None, description="Disposal date (camelCase alias)")
    
    # Tags for categorization
    tags: List[Tag] = Field(default_factory=list, description="Tags associated with the asset")
    
    # Custom fields
    custom_fields: Dict[str, Any] = Field(default_factory=dict, description="Custom fields defined by the organization")
    
    # Fields from AssetTable.jsx
    due_for_maintenance: Optional[bool] = Field(False, description="Flag indicating if maintenance is due")
    next_maintenance_date: Optional[str] = Field(None, description="Date of next scheduled maintenance")
    depreciated_value: Optional[float] = Field(None, description="Current depreciated value")
    utilization_rate: Optional[float] = Field(None, description="Utilization rate of the asset")
    check_in_out_status: Optional[str] = Field("checked-in", description="Check-in/out status")
    
    # Additional fields from BulkUploadPage.jsx
    vendorName: Optional[str] = Field(None, description="Name of the vendor (camelCase alias)")
    invoiceBillNumber: Optional[str] = Field(None, description="Invoice or bill number")
    totalPurchaseValue: Optional[float] = Field(None, description="Total purchase value")
    
    # Timestamps
    created_at: datetime = Field(default_factory=get_current_datetime, description="Creation timestamp")
    createdAt: Optional[str] = Field(None, description="Creation timestamp (camelCase alias)")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    lastUpdated: Optional[str] = Field(None, description="Last update timestamp (camelCase alias)")
    purchased_at: Optional[str] = Field(None, description="Date of purchase string format")
    purchaseDate: Optional[str] = Field(None, description="Purchase date (camelCase alias)")
    last_audit_date: Optional[str] = Field(None, description="Date of the last audit")
    
    # Fields from AddItemPage.jsx
    departmentId: Optional[str] = Field(None, description="Department ID")
    departmentName: Optional[str] = Field(None, description="Department name")
    employee_id: Optional[str] = Field(None, description="Employee ID if assigned to an employee")
    employee_name: Optional[str] = Field(None, description="Employee name if assigned to an employee")
    quantity: Optional[int] = Field(1, description="Quantity of the asset")
    assetItemId: Optional[str] = Field(None, description="Asset item ID")
    
    # Additional frontend fields
    is_active: Optional[bool] = Field(True, description="Indicates if the asset is active")
    has_active_assignment: Optional[bool] = Field(False, description="Whether the asset is currently assigned")
    assigned_department: Optional[str] = Field(None, description="Department the asset is assigned to")
    expected_life_months: Optional[int] = Field(None, description="Expected life in months")
    procurement_method: Optional[str] = Field(None, description="Method of procurement")
    purchase_order_number: Optional[str] = Field(None, description="Purchase order number")

    model_config = model_config

# For assets creation
class AssetItemCreate(BaseModel):
    category_id: str
    name: str
    asset_tag: str
    status: AssetStatus = AssetStatus.AVAILABLE
    condition: AssetCondition = AssetCondition.NEW
    purchase_date: Optional[str] = None
    purchase_cost: Optional[float] = None
    expected_useful_life: Optional[int] = None
    warranty_end_date: Optional[str] = None
    warranty_info: Optional[str] = None
    vendor: Optional[str] = None
    vendor_name: Optional[str] = None
    vendor_contact: Optional[str] = None
    vendor_email: Optional[str] = None
    vendor_phone: Optional[str] = None
    invoice_number: Optional[str] = None
    depreciation_method: Optional[str] = None
    current_value: Optional[float] = None
    salvage_value: Optional[float] = None
    location: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_at: Optional[str] = None
    assignment_due_date: Optional[str] = None
    assignment_notes: Optional[str] = None
    specifications: List[Specification] = Field(default_factory=list)
    warranty_details: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    serial_number: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    description: Optional[str] = None
    tags: List[Tag] = Field(default_factory=list)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    due_for_maintenance: Optional[bool] = False
    next_maintenance_date: Optional[str] = None
    last_maintenance_date: Optional[str] = None
    maintenance_schedule: Optional[MaintenanceSchedule] = None
    departmentId: Optional[str] = None
    departmentName: Optional[str] = None
    quantity: Optional[int] = 1
    purchase_order_number: Optional[str] = None
    warranty_until: Optional[str] = None
    insurance_policy: Optional[str] = None
    is_operational: Optional[bool] = True
    maintenance_due_date: Optional[str] = None
    disposal_date: Optional[str] = None
    department: Optional[str] = None

    model_config = model_config

# For updating assets
class AssetItemUpdate(BaseModel):
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    name: Optional[str] = None
    asset_tag: Optional[str] = None
    asset_id: Optional[str] = None
    status: Optional[AssetStatus] = None
    condition: Optional[AssetCondition] = None
    purchase_date: Optional[str] = None
    purchase_cost: Optional[float] = None
    expected_useful_life: Optional[int] = None
    warranty_end_date: Optional[str] = None
    warranty_info: Optional[str] = None
    warranty_until: Optional[str] = None
    vendor: Optional[str] = None
    vendor_name: Optional[str] = None
    vendor_contact: Optional[str] = None
    vendor_email: Optional[str] = None
    vendor_phone: Optional[str] = None
    invoice_number: Optional[str] = None
    depreciation_method: Optional[str] = None
    current_value: Optional[float] = None
    salvage_value: Optional[float] = None
    total_cost: Optional[float] = None
    location: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_at: Optional[str] = None
    assignment_due_date: Optional[str] = None
    assignment_notes: Optional[str] = None
    specifications: Optional[List[Specification]] = None
    warranty_details: Optional[Dict[str, Any]] = None
    documents: Optional[List[Document]] = None
    maintenance_history: Optional[List[MaintenanceRecord]] = None
    assignment_history: Optional[List[Dict[str, Any]]] = None
    audit_history: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None
    serial_number: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[Tag]] = None
    custom_fields: Optional[Dict[str, Any]] = None
    due_for_maintenance: Optional[bool] = None
    next_maintenance_date: Optional[str] = None
    last_maintenance_date: Optional[str] = None
    maintenance_schedule: Optional[MaintenanceSchedule] = None
    depreciated_value: Optional[float] = None
    utilization_rate: Optional[float] = None
    check_in_out_status: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    purchased_at: Optional[str] = None
    last_audit_date: Optional[str] = None
    departmentId: Optional[str] = None
    departmentName: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    quantity: Optional[int] = None
    is_active: Optional[bool] = None
    has_active_assignment: Optional[bool] = None
    assigned_department: Optional[str] = None
    expected_life_months: Optional[int] = None
    procurement_method: Optional[str] = None
    purchase_order_number: Optional[str] = None
    is_operational: Optional[bool] = None
    maintenance_due_date: Optional[str] = None
    disposal_date: Optional[str] = None
    department: Optional[str] = None
    insurance_policy: Optional[str] = None
    current_assignee_id: Optional[str] = None
    current_assignee_name: Optional[str] = None
    current_assignment_date: Optional[str] = None
    
    # CamelCase aliases 
    assetId: Optional[str] = None
    assetName: Optional[str] = None
    categoryId: Optional[str] = None
    categoryName: Optional[str] = None
    isOperational: Optional[bool] = None
    warrantyUntil: Optional[str] = None
    currentValue: Optional[float] = None
    insurancePolicy: Optional[str] = None
    assignedTo: Optional[str] = None
    currentAssignmentDate: Optional[str] = None
    serialNumber: Optional[str] = None
    maintenanceDueDate: Optional[str] = None
    disposalDate: Optional[str] = None
    createdAt: Optional[str] = None
    lastUpdated: Optional[str] = None
    purchaseDate: Optional[str] = None
    
    model_config = model_config

# For asset item response
class AssetItemResponse(BaseModel):
    id: str
    category_id: str
    category_name: Optional[str] = None
    name: str
    asset_tag: str
    asset_id: Optional[str] = None
    status: str
    condition: str
    purchase_date: Optional[str] = None
    purchase_cost: Optional[float] = None
    location: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_at: Optional[str] = None
    due_for_maintenance: Optional[bool] = None
    next_maintenance_date: Optional[str] = None
    warranty_until: Optional[str] = None
    vendor: Optional[str] = None
    vendor_name: Optional[str] = None
    serial_number: Optional[str] = None
    model: Optional[str] = None
    departmentId: Optional[str] = None
    departmentName: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    department: Optional[str] = None
    current_value: Optional[float] = None
    is_operational: Optional[bool] = None
    maintenance_due_date: Optional[str] = None
    disposal_date: Optional[str] = None
    insurance_policy: Optional[str] = None
    current_assignee_id: Optional[str] = None
    current_assignee_name: Optional[str] = None
    current_assignment_date: Optional[str] = None
    maintenance_schedule: Optional[MaintenanceSchedule] = None
    
    model_config = model_config

# For bulk asset creation
class BulkAssetCreate(BaseModel):
    category_id: str = Field(..., description="Category ID for the assets")
    count: int = Field(..., description="Number of assets to create")
    prefix: str = Field(..., description="Prefix for asset tags")
    start_number: int = Field(..., description="Starting number for asset tags")
    name_template: str = Field(..., description="Template for asset names")
    status: AssetStatus = Field(default=AssetStatus.AVAILABLE, description="Status for all assets")
    condition: AssetCondition = Field(default=AssetCondition.NEW, description="Condition for all assets")
    purchase_date: Optional[str] = Field(None, description="Purchase date for all assets")
    purchase_cost: Optional[float] = Field(None, description="Purchase cost per unit")
    vendor_name: Optional[str] = Field(None, description="Vendor name")
    vendor: Optional[str] = Field(None, description="Vendor alternate field")
    invoice_number: Optional[str] = Field(None, description="Invoice number")
    location: Optional[str] = Field(None, description="Location for all assets")
    notes: Optional[str] = Field(None, description="Notes for all assets")
    warranty_until: Optional[str] = Field(None, description="Warranty end date")
    specifications: List[Specification] = Field(default_factory=list, description="Common specifications")
    
    # Additional fields from BulkUploadPage.jsx
    vendorName: Optional[str] = Field(None, description="Name of the vendor")
    invoiceBillNumber: Optional[str] = Field(None, description="Invoice or bill number")
    totalPurchaseValue: Optional[float] = Field(None, description="Total purchase value")
    building: Optional[str] = Field(None, description="Building location")
    floor: Optional[str] = Field(None, description="Floor location")
    room: Optional[str] = Field(None, description="Room location")
    department: Optional[str] = Field(None, description="Department")
    is_operational: Optional[bool] = Field(True, description="Whether the asset is operational")
    model: Optional[str] = Field(None, description="Model of the asset")
    serial_number: Optional[str] = Field(None, description="Serial number of the asset")

    model_config = model_config