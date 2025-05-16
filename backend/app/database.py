"""
Database module re-exporting the database access functionality from dependencies.py
"""

from app.dependencies import (
    get_db as get_database,
    get_asset_categories_collection,
    get_asset_items_collection,
    get_employees_collection,
    get_documents_collection,
    get_assignment_history_collection,
    get_maintenance_history_collection,
    get_requests_collection
)

# Re-export all functions
__all__ = [
    "get_database",
    "get_asset_categories_collection",
    "get_asset_items_collection",
    "get_employees_collection",
    "get_documents_collection",
    "get_assignment_history_collection",
    "get_maintenance_history_collection",
    "get_requests_collection"
] 