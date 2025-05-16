from .asset_category import AssetCategory, AssetCategoryCreate, AssetCategoryUpdate, AssetCategoryResponse
from .asset_item import AssetItem, AssetItemCreate, AssetItemUpdate, AssetItemResponse, AssetStatus, AssetCondition
from .assignment_history import AssignmentHistoryEntry, AssignmentCreate, AssignmentReturn, AssignmentUpdate, AssignmentResponse, AssignmentStatus, AssignmentType
from .document import Document, DocumentCreate, DocumentUpdate, DocumentResponse, DocumentType, DocumentStatus, ApprovalStatus
from .employee import Employee, EmployeeCreate, EmployeeUpdate, EmployeeResponse, AssignedAsset, EmployeeStatus
from .maintenance_history import MaintenanceHistoryEntry, MaintenanceHistory, MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse, MaintenanceStatus, MaintenanceType
from .request_approval import Request, RequestCreate, RequestUpdate, RequestResponse, RequestType, RequestStatus, RequestPriority
from .analytics import (
    AssetCategoryStats, AssetStatusStats, AssetAcquisitionStats, 
    DepartmentAssetStats, MaintenanceCostStats, AssetAgeStats,
    EmployeeAssetStats, AssetStatistics, PaginationData,
    AssetAnalyticsData, DepartmentAnalyticsData, MaintenanceAnalyticsData,
    EmployeeAssetAnalyticsData, AnalyticsResponse, AssetAnalyticsResponse,
    DepartmentAnalyticsResponse, MaintenanceAnalyticsResponse,
    EmployeeAssetAnalyticsResponse, TimeFrame, ReportType,
    ReportGenerationRequest, ReportGenerationResponse
)
from .utils import (
    model_config, generate_uuid, generate_asset_id, 
    generate_employee_id, generate_category_id, 
    generate_document_id, generate_maintenance_id, 
    generate_assignment_id, generate_request_id,
    get_current_datetime, serialize_model
)