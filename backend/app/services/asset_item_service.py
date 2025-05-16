from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError, OperationFailure
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import logging
from app.models.asset_item import (
    AssetItem, 
    AssetItemCreate, 
    AssetItemUpdate,
    AssetItemResponse,
    AssetStatus,
    MaintenanceSchedule
)
from app.models.utils import generate_uuid, get_current_datetime, serialize_model
import uuid

logger = logging.getLogger(__name__)

def get_asset_items(
    db: Collection, 
    filters: Dict[str, Any] = None
) -> List[AssetItemResponse]:
    """
    Retrieve asset items with optional filtering.
    
    Args:
        db (Collection): MongoDB collection
        filters (Dict[str, Any], optional): Filtering criteria
        
    Returns:
        List[AssetItemResponse]: List of asset items
    """
    logger.info("Fetching asset items with filters")
    try:
        query = {}
        
        # Apply filters if provided
        if filters:
            if "category_id" in filters and filters["category_id"]:
                query["category_id"] = filters["category_id"]
                
            if "status" in filters and filters["status"]:
                query["status"] = filters["status"]
                
            if "has_active_assignment" in filters:
                query["has_active_assignment"] = filters["has_active_assignment"]
                
            if "serial_number" in filters and filters["serial_number"]:
                query["serial_number"] = {"$regex": filters["serial_number"], "$options": "i"}
                
            if "asset_tag" in filters and filters["asset_tag"]:
                query["asset_tag"] = {"$regex": filters["asset_tag"], "$options": "i"}
                
            if "department" in filters and filters["department"]:
                query["department"] = filters["department"]
                
            if "location" in filters and filters["location"]:
                query["location"] = filters["location"]
                
            if "maintenance_due_before" in filters and filters["maintenance_due_before"]:
                query["next_maintenance_date"] = {"$lte": filters["maintenance_due_before"]}
                
            if "requires_maintenance" in filters:
                query["requires_maintenance"] = filters["requires_maintenance"]
                
            if "is_active" in filters:
                query["is_active"] = filters["is_active"]
                
            if "tags" in filters and filters["tags"]:
                query["tags"] = {"$in": filters["tags"]}
        
        assets = list(db.find(query))
        result = []
        
        for asset in assets:
            # Convert _id to id if needed
            if "_id" in asset and "id" not in asset:
                asset["id"] = str(asset["_id"])
                
            # Remove _id field as we have id
            if "_id" in asset:
                del asset["_id"]
                
            # Convert to AssetItemResponse
            asset_response = AssetItemResponse(**asset)
            result.append(asset_response)
            
        logger.debug(f"Fetched {len(result)} asset items")
        return result
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error fetching asset items: {str(e)}", exc_info=True)
        raise

def get_asset_item_by_id(db: Collection, asset_id: str) -> Optional[AssetItemResponse]:
    """
    Retrieve a specific asset item by ID.
    
    Args:
        db (Collection): MongoDB collection
        asset_id (str): Asset ID to retrieve
        
    Returns:
        Optional[AssetItemResponse]: The asset if found, None otherwise
    """
    logger.info(f"Fetching asset item ID: {asset_id}")
    try:
        asset = db.find_one({"id": asset_id})
        if not asset:
            logger.warning(f"Asset not found: {asset_id}")
            return None
        
        # Remove _id field as we have id
        if "_id" in asset:
            del asset["_id"]
            
        # Convert to AssetItemResponse
        asset_response = AssetItemResponse(**asset)
        logger.debug(f"Fetched asset: {asset_response.asset_name}")
        return asset_response
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error fetching asset {asset_id}: {str(e)}", exc_info=True)
        raise

def create_asset_item(db: Collection, asset: AssetItemCreate) -> AssetItemResponse:
    """
    Create a new asset item.
    
    Args:
        db (Collection): MongoDB collection
        asset (AssetItemCreate): Asset data to create
        
    Returns:
        AssetItemResponse: The created asset
    """
    logger.info(f"Creating asset: {asset.asset_name}")
    try:
        # Convert to dict, excluding None values
        asset_dict = asset.model_dump(exclude_none=True)
        
        # Check if asset with serial number already exists (if provided)
        if asset.serial_number:
            existing = db.find_one({"serial_number": asset.serial_number})
            if existing:
                logger.warning(f"Asset with serial number already exists: {asset.serial_number}")
                raise ValueError(f"Asset with serial number '{asset.serial_number}' already exists")
        
        # Check if asset with asset tag already exists (if provided)
        if asset.asset_tag:
            existing = db.find_one({"asset_tag": asset.asset_tag})
            if existing:
                logger.warning(f"Asset with asset tag already exists: {asset.asset_tag}")
                raise ValueError(f"Asset with asset tag '{asset.asset_tag}' already exists")
        
        # Check if the category exists
        if asset.category_id:
            category = db.database["asset_categories"].find_one({"id": asset.category_id})
            if not category:
                logger.warning(f"Category not found: {asset.category_id}")
                raise ValueError(f"Category with ID '{asset.category_id}' does not exist")
            
            # Add category name to asset
            asset_dict["category_name"] = category.get("category_name", "Unknown")
        
        # Set default values
        asset_dict["is_active"] = asset_dict.get("is_active", True)
        asset_dict["is_operational"] = asset_dict.get("is_operational", True)
        asset_dict["has_active_assignment"] = False
        asset_dict["status"] = asset_dict.get("status", "available")
        
        # Initialize metadata fields
        asset_dict["assignment_history"] = []
        asset_dict["maintenance_history"] = []
        asset_dict["ownership_history"] = []
        asset_dict["edit_history"] = []
        asset_dict["created_at"] = get_current_datetime()
        
        # Handle maintenance scheduling
        if "maintenance_schedule" in asset_dict and asset_dict["maintenance_schedule"]:
            if not isinstance(asset_dict["maintenance_schedule"], dict):
                asset_dict["maintenance_schedule"] = asset_dict["maintenance_schedule"].model_dump()
            
            if asset_dict["maintenance_schedule"].get("frequency") and asset_dict["maintenance_schedule"].get("frequency_unit"):
                # Calculate next maintenance date
                frequency = asset_dict["maintenance_schedule"]["frequency"]
                frequency_unit = asset_dict["maintenance_schedule"]["frequency_unit"]
                
                if frequency > 0:
                    now = get_current_datetime()
                    if frequency_unit == "days":
                        asset_dict["next_maintenance_date"] = now + timedelta(days=frequency)
                    elif frequency_unit == "weeks":
                        asset_dict["next_maintenance_date"] = now + timedelta(weeks=frequency)
                    elif frequency_unit == "months":
                        # Approximate months as 30 days
                        asset_dict["next_maintenance_date"] = now + timedelta(days=30 * frequency)
                    elif frequency_unit == "years":
                        # Approximate years as 365 days
                        asset_dict["next_maintenance_date"] = now + timedelta(days=365 * frequency)
        
        # Generate UUID for the id field
        asset_dict["id"] = generate_uuid()
        
        # Add _id field for MongoDB to use the same value as id
        asset_dict["_id"] = asset_dict["id"]
        
        # Insert the asset
        result = db.insert_one(asset_dict)
        logger.debug(f"Inserted asset: {asset.asset_name} with ID: {asset_dict['id']}")
        
        # Add a history entry for this creation
        edit_entry = {
            "id": generate_uuid(),
            "type": "creation",
            "edit_date": get_current_datetime().strftime("%Y-%m-%d"),
            "change_type": "Asset Creation",
            "details": "Initial asset creation",
            "notes": asset_dict.get("notes", "")
        }
        
        # Add history entry to the document
        db.update_one(
            {"id": asset_dict["id"]},
            {"$push": {"edit_history": edit_entry}}
        )
        
        # Retrieve the created asset
        created_asset = db.find_one({"id": asset_dict["id"]})
        
        # Remove _id field
        if "_id" in created_asset:
            del created_asset["_id"]
        
        # Convert to AssetItemResponse
        asset_response = AssetItemResponse(**created_asset)
        logger.info(f"Created asset with ID: {asset_response.id}")
        return asset_response
    except DuplicateKeyError as e:
        logger.warning(f"Duplicate key error: {str(e)}")
        raise ValueError(f"Asset with duplicate key already exists: {str(e)}")
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except ValueError as e:
        # Re-raise ValueError as is
        raise
    except Exception as e:
        logger.error(f"Error creating asset: {str(e)}", exc_info=True)
        raise

def update_asset_item(db: Collection, asset_id: str, asset: AssetItemUpdate) -> Optional[AssetItemResponse]:
    """
    Update an existing asset item.
    
    Args:
        db (Collection): MongoDB collection
        asset_id (str): Asset ID to update
        asset (AssetItemUpdate): Asset data to update
        
    Returns:
        Optional[AssetItemResponse]: The updated asset if found, None otherwise
    """
    logger.info(f"Updating asset ID: {asset_id}")
    try:
        # Check if asset exists
        existing_asset = db.find_one({"id": asset_id})
        if not existing_asset:
            logger.warning(f"Asset not found: {asset_id}")
            return None
        
        # Convert to dict, excluding unset and None values
        asset_dict = asset.model_dump(exclude_unset=True, exclude_none=True)
        
        # Check for duplicate serial_number
        if "serial_number" in asset_dict and asset_dict["serial_number"]:
            existing = db.find_one({
                "serial_number": asset_dict["serial_number"], 
                "id": {"$ne": asset_id}
            })
            if existing:
                logger.warning(f"Asset with serial number already exists: {asset_dict['serial_number']}")
                raise ValueError(f"Asset with serial number '{asset_dict['serial_number']}' already exists")
        
        # Check for duplicate asset_tag
        if "asset_tag" in asset_dict and asset_dict["asset_tag"]:
            existing = db.find_one({
                "asset_tag": asset_dict["asset_tag"], 
                "id": {"$ne": asset_id}
            })
            if existing:
                logger.warning(f"Asset with asset tag already exists: {asset_dict['asset_tag']}")
                raise ValueError(f"Asset with asset tag '{asset_dict['asset_tag']}' already exists")
        
        # Check if category exists if being updated
        if "category_id" in asset_dict and asset_dict["category_id"]:
            category = db.database["asset_categories"].find_one({"id": asset_dict["category_id"]})
            if not category:
                logger.warning(f"Category not found: {asset_dict['category_id']}")
                raise ValueError(f"Category with ID '{asset_dict['category_id']}' does not exist")
            
            # Update category name
            asset_dict["category_name"] = category.get("category_name", "Unknown")
        
        # Handle maintenance scheduling
        if "maintenance_schedule" in asset_dict and asset_dict["maintenance_schedule"]:
            if not isinstance(asset_dict["maintenance_schedule"], dict):
                asset_dict["maintenance_schedule"] = asset_dict["maintenance_schedule"].model_dump()
            
            if asset_dict["maintenance_schedule"].get("frequency") and asset_dict["maintenance_schedule"].get("frequency_unit"):
                # Calculate next maintenance date
                frequency = asset_dict["maintenance_schedule"]["frequency"]
                frequency_unit = asset_dict["maintenance_schedule"]["frequency_unit"]
                
                if frequency > 0:
                    now = get_current_datetime()
                    if frequency_unit == "days":
                        asset_dict["next_maintenance_date"] = now + timedelta(days=frequency)
                    elif frequency_unit == "weeks":
                        asset_dict["next_maintenance_date"] = now + timedelta(weeks=frequency)
                    elif frequency_unit == "months":
                        # Approximate months as 30 days
                        asset_dict["next_maintenance_date"] = now + timedelta(days=30 * frequency)
                    elif frequency_unit == "years":
                        # Approximate years as 365 days
                        asset_dict["next_maintenance_date"] = now + timedelta(days=365 * frequency)
        
        # Track edit history
        current_time = get_current_datetime()
        asset_dict["updated_at"] = current_time
        
        # Add a history entry for this update
        edit_entry = {
            "id": generate_uuid(),
            "type": "edit",
            "edit_date": current_time.strftime("%Y-%m-%d"),
            "change_type": "Asset Update",
            "details": f"Updated asset fields: {', '.join(asset_dict.keys())}",
            "notes": asset_dict.get("notes", "")
        }
        
        # Add history entry to the document
        db.update_one(
            {"id": asset_id},
            {"$push": {"edit_history": edit_entry}}
        )
        
        # Apply all updates
        result = db.update_one(
            {"id": asset_id},
            {"$set": asset_dict}
        )
        
        if result.matched_count == 0:
            logger.warning(f"Asset not found: {asset_id}")
            return None
        
        # Fetch the updated asset
        updated_asset = db.find_one({"id": asset_id})
        
        # Remove _id field
        if "_id" in updated_asset:
            del updated_asset["_id"]
        
        # Convert to AssetItemResponse
        asset_response = AssetItemResponse(**updated_asset)
        logger.debug(f"Updated asset: {asset_response.asset_name}")
        return asset_response
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except ValueError as e:
        # Re-raise ValueError as is
        raise
    except Exception as e:
        logger.error(f"Error updating asset {asset_id}: {str(e)}", exc_info=True)
        raise

def delete_asset_item(db: Collection, asset_id: str) -> bool:
    """
    Delete an asset item if it has no active assignments.
    
    Args:
        db (Collection): MongoDB collection
        asset_id (str): Asset ID to delete
        
    Returns:
        bool: True if asset was deleted, False if not found or has active assignment
    """
    logger.info(f"Deleting asset ID: {asset_id}")
    try:
        # Check if asset exists
        existing_asset = db.find_one({"id": asset_id})
        if not existing_asset:
            logger.warning(f"Asset not found: {asset_id}")
            return False
        
        # Check if asset has active assignment
        if existing_asset.get("has_active_assignment", False):
            logger.warning(f"Cannot delete asset with active assignment: {asset_id}")
            raise ValueError("Cannot delete asset with active assignment")
        
        # Delete the asset
        result = db.delete_one({"id": asset_id})
        if result.deleted_count == 0:
            logger.warning(f"Asset not found: {asset_id}")
            return False
        
        logger.debug(f"Deleted asset ID: {asset_id}")
        return True
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error deleting asset {asset_id}: {str(e)}", exc_info=True)
        raise

def get_asset_utilization(db: Collection) -> Dict[str, Any]:
    """
    Get utilization statistics for all assets.
    
    Args:
        db (Collection): MongoDB collection
        
    Returns:
        Dict[str, Any]: Asset utilization statistics
    """
    logger.info("Calculating asset utilization statistics")
    try:
        # Count total assets
        total_assets = db.count_documents({})
        
        # Count assets by status
        status_counts = {}
        for status in ["available", "assigned", "under_maintenance", "maintenance_requested", "retired", "lost"]:
            status_counts[status] = db.count_documents({"status": status})
        
        # Count assets by operational status
        operational_count = db.count_documents({"is_operational": True})
        non_operational_count = db.count_documents({"is_operational": False})
        
        # Count assets with active assignments
        assigned_count = db.count_documents({"has_active_assignment": True})
        
        # Calculate utilization rate (assigned / assignable)
        assignable_count = total_assets - db.count_documents({"status": "retired"}) - db.count_documents({"status": "lost"})
        utilization_rate = (assigned_count / assignable_count) * 100 if assignable_count > 0 else 0
        
        return {
            "total_assets": total_assets,
            "status_counts": status_counts,
            "operational_count": operational_count,
            "non_operational_count": non_operational_count,
            "assigned_count": assigned_count,
            "utilization_rate": utilization_rate
        }
    except Exception as e:
        logger.error(f"Error calculating asset utilization: {str(e)}", exc_info=True)
        raise

def get_asset_statistics(db: Collection) -> Dict[str, Any]:
    """
    Get comprehensive statistics for assets including counts, values, and status information.
    
    Args:
        db (Collection): MongoDB collection
        
    Returns:
        Dict[str, Any]: Comprehensive asset statistics
    """
    logger.info("Calculating comprehensive asset statistics")
    try:
        # Basic asset counts
        total_assets = db.count_documents({})
        available_assets = db.count_documents({"status": "available"})
        assigned_assets = db.count_documents({"status": "assigned"})
        maintenance_assets = db.count_documents({"status": {"$in": ["under_maintenance", "maintenance_requested"]}})
        retired_assets = db.count_documents({"status": "retired"})
        
        # Financial statistics
        pipeline = [
            {"$match": {"purchase_cost": {"$exists": True, "$ne": None}}},
            {"$group": {
                "_id": None,
                "total_value": {"$sum": "$purchase_cost"},
                "avg_value": {"$avg": "$purchase_cost"},
                "max_value": {"$max": "$purchase_cost"},
                "min_value": {"$min": "$purchase_cost"},
                "count": {"$sum": 1}
            }}
        ]
        financial_result = list(db.aggregate(pipeline))
        financial_stats = financial_result[0] if financial_result else {
            "total_value": 0, "avg_value": 0, "max_value": 0, "min_value": 0, "count": 0
        }
        
        # Department statistics
        departments = db.distinct("department")
        department_counts = {}
        for dept in departments:
            if dept:  # Skip None values
                department_counts[dept] = db.count_documents({"department": dept})
        
        # Category statistics
        categories = db.distinct("category_id")
        category_counts = {}
        for cat_id in categories:
            if cat_id:  # Skip None values
                category = db.database["asset_categories"].find_one({"id": cat_id})
                category_name = category.get("category_name", "Unknown") if category else "Unknown"
                category_counts[category_name] = db.count_documents({"category_id": cat_id})
        
        # Maintenance statistics
        maintenance_due = db.count_documents({"due_for_maintenance": True})
        
        # Assignment statistics
        assignment_counts = {
            "assigned": assigned_assets,
            "unassigned": available_assets,
            "total": total_assets,
            "utilization_rate": (assigned_assets / total_assets * 100) if total_assets > 0 else 0
        }
        
        return {
            "total_assets": total_assets,
            "status_counts": {
                "available": available_assets,
                "assigned": assigned_assets,
                "under_maintenance": maintenance_assets,
                "retired": retired_assets
            },
            "financial_stats": {
                "total_value": financial_stats["total_value"],
                "average_value": financial_stats["avg_value"],
                "max_value": financial_stats["max_value"],
                "min_value": financial_stats["min_value"]
            },
            "department_counts": department_counts,
            "category_counts": category_counts,
            "maintenance_stats": {
                "due_for_maintenance": maintenance_due
            },
            "assignment_stats": assignment_counts
        }
    except Exception as e:
        logger.error(f"Error calculating asset statistics: {str(e)}", exc_info=True)
        raise

def check_maintenance_due_assets(db: Collection) -> List[str]:
    """
    Check for assets that are due for maintenance.
    
    Args:
        db (Collection): MongoDB collection
        
    Returns:
        List[str]: IDs of assets due for maintenance
    """
    logger.info("Checking for assets due for maintenance")
    try:
        current_date = get_current_datetime()
        
        # Find assets with maintenance due
        due_assets = list(db.find({
            "next_maintenance_date": {"$lte": current_date},
            "status": {"$nin": ["under_maintenance", "maintenance_requested", "retired", "lost"]},
            "requires_maintenance": True
        }))
        
        due_asset_ids = [asset["id"] for asset in due_assets]
        
        logger.debug(f"Found {len(due_asset_ids)} assets due for maintenance")
        return due_asset_ids
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error checking maintenance due assets: {str(e)}", exc_info=True)
        raise