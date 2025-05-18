import logging
from app.logging_config import get_logger

# Set up loggers for router modules
router_modules = [
    "asset_categories",
    "asset_items",
    "assignment_history",
    "documents",
    "employees",
    "maintenance_history",
    "request"
]

# Get logger instances from our centralized configuration
for module in router_modules:
    # The module name format is important for the hierarchical logger structure
    full_module_name = f"app.routers.{module}"
    logger = get_logger(full_module_name)

# Import all routers to make them available
from .asset_categories import router as asset_categories
from .asset_items import router as asset_items
from .employees import router as employees
from .documents import router as documents
from .assignment_history import router as assignment_history
from .maintenance_history import router as maintenance_history
from .request import router as request

__all__ = [
    "asset_categories",
    "asset_items",
    "assignment_history",
    "documents",
    "employees",
    "maintenance_history",
    "request"
]