from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime
from bson import ObjectId

# Enum for Asset Status
class AssetStatus(str, Enum):
    AVAILABLE = "Available"
    ASSIGNED = "Assigned"
    UNDER_MAINTENANCE = "Under Maintenance"
    MAINTENANCE_REQUESTED = "Maintenance Requested"
    MAINTENANCE_COMPLETED = "Maintenance Completed"
    RETIRED = "Retired"
    PENDING = "Pending"
    LOST = "Lost"
    DAMAGED = "Damaged"

# Enum for Asset Condition
class AssetCondition(str, Enum):
    NEW = "New"
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"
    EXCELLENT = "Excellent"
    DAMAGED = "Damaged"
    NONFUNCTIONAL = "Non-functional"

# Asset History Entry for tracking changes
class AssetHistoryEntry(BaseModel):
    id: str = Field(..., description="Unique identifier for the history record")
    type: str = Field(..., description="Type of action, e.g., 'assignment', 'maintenance'")
    date: datetime = Field(..., description="Date of the action")
    user_id: Optional[str] = Field(None, description="ID of the user who performed the action")
    user_name: Optional[str] = Field(None, description="Name of the user who performed the action")
    details: Dict[str, Any] = Field(..., description="Details of the action")
    notes: Optional[str] = Field(None, description="Notes about the action")

    class Config:
        arbitrary_types_allowed = True

class AssetItem(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique asset ID")
    category_id: str = Field(..., description="Reference to AssetCategory ID")
    category_name: Optional[str] = Field(None, description="Category name for display purposes")
    name: str = Field(..., description="Asset name, e.g., 'MacBook Pro'")
    asset_tag: str = Field(..., description="Unique identifier, e.g., 'LP001'")
    asset_id: Optional[str] = Field(None, description="Alternative asset identifier")
    status: AssetStatus = Field(..., description="Current status of the asset")
    condition: AssetCondition = Field(..., description="Physical condition of the asset")
    serial_number: Optional[str] = Field(None, description="Serial number of the asset")
    model: Optional[str] = Field(None, description="Model of the asset, e.g., 'XPS 13'")
    manufacturer: Optional[str] = Field(None, description="Manufacturer of the asset")
    purchase_date: datetime = Field(..., description="Date of purchase")
    purchase_cost: float = Field(..., description="Initial purchase cost")
    current_value: float = Field(..., description="Current depreciated value")
    warranty_expiry: Optional[datetime] = Field(None, description="Warranty expiration date")
    invoice_bill_number: Optional[str] = Field(None, description="Invoice or bill number for the purchase")
    total_purchase_value: Optional[float] = Field(None, description="Total purchase value of the batch")
    payment_method: Optional[str] = Field(None, description="Payment method, e.g., 'Cash', 'Card'")
    purchase_order_number: Optional[str] = Field(None, description="Purchase order number")
    purchased_by: Optional[str] = Field(None, description="Person who made the purchase")
    purchased_by_name: Optional[str] = Field(None, description="Name of person who made the purchase")
    supplier_contact: Optional[str] = Field(None, description="Supplier contact details")
    supplier_name: Optional[str] = Field(None, description="Name of the supplier")
    gst_tax_id: Optional[str] = Field(None, description="GST or tax ID")
    currency: Optional[str] = Field(None, description="Currency of purchase, e.g., 'USD'")
    vendor: Optional[str] = Field(None, description="Vendor or supplier name")
    insurance_policy: Optional[str] = Field(None, description="Insurance policy details")
    insurance_expiry: Optional[datetime] = Field(None, description="Insurance policy expiry date")
    disposal_date: Optional[datetime] = Field(None, description="Date of disposal or retirement")
    disposal_reason: Optional[str] = Field(None, description="Reason for disposal")
    department: Optional[str] = Field(None, description="Assigned department")
    location: Optional[str] = Field(None, description="Physical location, e.g., 'Office A'")
    sub_location: Optional[str] = Field(None, description="Specific sub-location within the main location")
    maintenance_due_date: Optional[datetime] = Field(None, description="Next maintenance due date")
    last_maintenance_date: Optional[datetime] = Field(None, description="Date of last maintenance")
    specifications: Optional[Dict[str, str]] = Field(None, description="Technical specs, e.g., {'RAM': '16GB'}")
    custom_fields: Optional[Dict[str, Any]] = Field(None, description="Custom fields for the asset")
    current_assignee_id: Optional[str] = Field(None, description="ID of current assignee")
    current_assignee_name: Optional[str] = Field(None, description="Name of current assignee")
    current_assignment_date: Optional[datetime] = Field(None, description="Date of current assignment")
    expected_return_date: Optional[datetime] = Field(None, description="Expected date of return if temporarily assigned")
    notes: Optional[str] = Field(None, description="Additional notes")
    tags: List[str] = Field(default_factory=list, description="Tags associated with the asset")
    image_url: Optional[str] = Field(None, description="URL to asset image")
    qr_code: Optional[str] = Field(None, description="QR code for the asset")
    barcode: Optional[str] = Field(None, description="Barcode for the asset")
    assignment_history: List[Dict[str, Any]] = Field(default_factory=list, description="Assignment records")
    maintenance_history: List[Dict[str, Any]] = Field(default_factory=list, description="Maintenance records")
    history: List[AssetHistoryEntry] = Field(default_factory=list, description="General history of the asset")
    documents: List[Dict[str, Any]] = Field(default_factory=list, description="Document references")
    has_active_assignment: bool = Field(False, description="Whether the asset is currently assigned")
    is_operational: bool = Field(True, description="Whether the asset is operational")
    is_active: bool = Field(True, description="Whether the asset is active in the system")
    requires_maintenance: bool = Field(False, description="Whether the asset requires maintenance")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        populate_by_name = True

class AssetItemCreate(BaseModel):
    category_id: str
    name: str
    asset_tag: str
    asset_id: Optional[str] = None
    status: AssetStatus
    condition: AssetCondition
    serial_number: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    purchase_date: datetime
    purchase_cost: float
    warranty_expiry: Optional[datetime] = None
    invoice_bill_number: Optional[str] = None
    total_purchase_value: Optional[float] = None
    payment_method: Optional[str] = None
    purchase_order_number: Optional[str] = None
    purchased_by: Optional[str] = None
    supplier_contact: Optional[str] = None
    supplier_name: Optional[str] = None
    gst_tax_id: Optional[str] = None
    currency: Optional[str] = None
    vendor: Optional[str] = None
    insurance_policy: Optional[str] = None
    insurance_expiry: Optional[datetime] = None
    department: Optional[str] = None
    location: Optional[str] = None
    sub_location: Optional[str] = None
    maintenance_due_date: Optional[datetime] = None
    specifications: Optional[Dict[str, str]] = None
    custom_fields: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    image_url: Optional[str] = None
    is_operational: bool = True
    is_active: bool = True
    requires_maintenance: bool = False

    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True

class AssetItemUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = None
    asset_tag: Optional[str] = None
    asset_id: Optional[str] = None
    status: Optional[AssetStatus] = None
    condition: Optional[AssetCondition] = None
    serial_number: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_cost: Optional[float] = None
    warranty_expiry: Optional[datetime] = None
    invoice_bill_number: Optional[str] = None
    total_purchase_value: Optional[float] = None
    payment_method: Optional[str] = None
    purchase_order_number: Optional[str] = None
    purchased_by: Optional[str] = None
    supplier_contact: Optional[str] = None
    supplier_name: Optional[str] = None
    gst_tax_id: Optional[str] = None
    currency: Optional[str] = None
    vendor: Optional[str] = None
    insurance_policy: Optional[str] = None
    insurance_expiry: Optional[datetime] = None
    disposal_date: Optional[datetime] = None
    disposal_reason: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    sub_location: Optional[str] = None
    maintenance_due_date: Optional[datetime] = None
    specifications: Optional[Dict[str, str]] = None
    custom_fields: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    image_url: Optional[str] = None
    is_operational: Optional[bool] = None
    is_active: Optional[bool] = None
    requires_maintenance: Optional[bool] = None

    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True