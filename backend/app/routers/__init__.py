from .asset_categories import router as asset_categories_router
from .asset_items import router as asset_items_router
from .assignment_history import router as assignment_history_router
from .documents import router as documents_router
from .employees import router as employees_router
from .maintenance_history import router as maintenance_history_router
from .request_approval import router as request_approval_router

__all__ = [
    "asset_categories_router",
    "asset_items_router",
    "assignment_history_router",
    "documents_router",
    "employees_router",
    "maintenance_history_router",
    "request_approval_router"
]