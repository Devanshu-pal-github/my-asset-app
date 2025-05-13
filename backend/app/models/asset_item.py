from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum
from datetime import datetime
from bson import ObjectId

# Enum for Asset Status
class AssetStatus(str, Enum):
    AVAILABLE = "available"
    ASSIGNED = "Assigned"
    UNDER_MAINTENANCE = "under_maintenance"
    MAINTENANCE_REQUESTED = "maintenance_requested"
    MAINTENANCE_COMPLETED = "maintenance_completed"
    RETIRED = "retired"
    PENDING = "Pending"
    LOST = "lost"

# Enum for Asset Condition
class AssetCondition(str, Enum):
    NEW = "new"
    GOOD = "Good"
    FAIR = "fair"
    POOR = "poor"
    EXCELLENT = "Excellent"

class AssetItem(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique asset ID")
    category_id: str = Field(..., description="Reference to AssetCategory ID")
    name: str = Field(..., description="Asset name, e.g., 'MacBook Pro'")
    asset_id: str = Field(..., description="Unique identifier, e.g., 'LP001'")
    status: AssetStatus = Field(..., description="Current status of the asset")
    condition: AssetCondition = Field(..., description="Physical condition, e.g., 'good'")
    serial_number: Optional[str] = Field(None, description="Serial number of the asset")
    model: Optional[str] = Field(None, description="Model of the asset, e.g., 'XPS 13'")
    purchase_date: datetime = Field(..., description="Date of purchase")
    purchase_cost: float = Field(..., description="Initial purchase cost")
    current_value: float = Field(..., description="Current depreciated value")
    invoice_bill_number: Optional[str] = Field(None, description="Invoice or bill number for the purchase")
    total_purchase_value: Optional[float] = Field(None, description="Total purchase value of the batch")
    payment_method: Optional[str] = Field(None, description="Payment method, e.g., 'Cash', 'Card'")
    purchase_order_number: Optional[str] = Field(None, description="Purchase order number")
    purchased_by: Optional[str] = Field(None, description="Person who made the purchase")
    supplier_contact: Optional[str] = Field(None, description="Supplier contact details")
    gst_tax_id: Optional[str] = Field(None, description="GST or tax ID")
    currency: Optional[str] = Field(None, description="Currency of purchase, e.g., 'USD'")
    warranty_expiry: Optional[datetime] = Field(None, description="Warranty expiration date")
    vendor: Optional[str] = Field(None, description="Vendor or supplier name")
    insurance_policy: Optional[str] = Field(None, description="Insurance policy details")
    disposal_date: Optional[datetime] = Field(None, description="Date of disposal or retirement")
    department: Optional[str] = Field(None, description="Assigned department")
    location: Optional[str] = Field(None, description="Physical location, e.g., 'Office A'")
    maintenance_due_date: Optional[datetime] = Field(None, description="Next maintenance due date")
    specifications: Optional[Dict[str, str]] = Field(None, description="Technical specs, e.g., {'RAM': '16GB'}")
    current_assignee_id: Optional[str] = Field(None, description="ID of current assignee")
    current_assignment_date: Optional[datetime] = Field(None, description="Date of current assignment")
    notes: Optional[str] = Field(None, description="Additional notes")
    assignment_history: List['AssignmentHistoryEntry'] = Field(default_factory=list, description="Assignment records")
    maintenance_history: List['MaintenanceHistoryEntry'] = Field(default_factory=list, description="Maintenance records")
    documents: List['DocumentEntry'] = Field(default_factory=list, description="Document references")
    has_active_assignment: bool = Field(False, description="Whether the asset is currently assigned")
    is_operational: bool = Field(True, description="Whether the asset is operational")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AssetItemCreate(BaseModel):
    category_id: str
    name: str
    asset_id: str
    status: AssetStatus
    condition: AssetCondition
    serial_number: Optional[str] = None
    model: Optional[str] = None
    purchase_date: datetime
    purchase_cost: float
    invoice_bill_number: Optional[str] = None
    total_purchase_value: Optional[float] = None
    payment_method: Optional[str] = None
    purchase_order_number: Optional[str] = None
    purchased_by: Optional[str] = None
    supplier_contact: Optional[str] = None
    gst_tax_id: Optional[str] = None
    currency: Optional[str] = None
    warranty_expiry: Optional[datetime] = None
    vendor: Optional[str] = None
    insurance_policy: Optional[str] = None
    disposal_date: Optional[datetime] = None
    department: Optional[str] = None
    location: Optional[str] = None
    maintenance_due_date: Optional[datetime] = None
    specifications: Optional[Dict[str, str]] = None
    notes: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True