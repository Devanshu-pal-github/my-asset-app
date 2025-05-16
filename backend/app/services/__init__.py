import logging
from app.logging_config import get_logger

# Set up loggers for services
service_modules = [
    "asset_category_service",
    "asset_item_service",
    "assignment_history_service",
    "document_service",
    "employee_service",
    "maintenance_history_service",
    "analytics_service",
    "request_service"
]

# Get logger instances from our centralized configuration
for module in service_modules:
    # The module name format is important for the hierarchical logger structure
    full_module_name = f"app.services.{module}"
    logger = get_logger(full_module_name)

from .asset_category_service import (
    get_asset_categories,
    create_asset_category,
    update_asset_category,
    delete_asset_category
)
from .asset_item_service import (
    get_asset_items,
    get_asset_item_by_id,
    create_asset_item,
    update_asset_item,
    delete_asset_item,
    get_asset_statistics
)
from .assignment_history_service import (
    assign_asset_to_employee,
    unassign_employee_from_asset
)
from .document_service import (
    get_documents,
    create_document
)
from .employee_service import (
    get_employees,
    get_employee_by_id,
    get_employee_details,
    create_employee,
    update_employee,
    delete_employee,
    get_employee_statistics
)
from .maintenance_history_service import (
    request_maintenance,
    update_maintenance_status
)
from .analytics_service import (
    get_asset_analytics,
    get_department_analytics,
    get_maintenance_analytics,
    get_employee_asset_analytics
)