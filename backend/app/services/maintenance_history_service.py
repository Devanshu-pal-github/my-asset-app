from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError, OperationFailure
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from app.models.asset_item import AssetItemResponse
from app.models.maintenance_history import (
    MaintenanceHistoryEntry, 
    MaintenanceStatus,
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse
)
from app.models.utils import generate_uuid, get_current_datetime, serialize_model
import logging

logger = logging.getLogger(__name__)

def get_maintenance_history_by_asset(
    db: Collection, 
    asset_id: str, 
    status: Optional[str] = None
) -> List[MaintenanceResponse]:
    """
    Retrieve maintenance history for a specific asset.
    
    Args:
        db (Collection): MongoDB collection
        asset_id (str): Asset ID to retrieve history for
        status (Optional[str]): Optional status filter
        
    Returns:
        List[MaintenanceResponse]: List of maintenance history entries
    """
    logger.info(f"Fetching maintenance history for asset ID: {asset_id}")
    try:
        # Check if asset exists
        asset = db.database["asset_items"].find_one({"id": asset_id})
        if not asset:
            logger.warning(f"Asset not found: {asset_id}")
            raise ValueError(f"Asset with ID {asset_id} not found")
        
        # Build query
        query = {"asset_id": asset_id}
        if status:
            query["status"] = status
        
        # Find maintenance history in the collection
        history_entries = list(db.find(query).sort("request_date", -1))
        
        result = []
        for entry in history_entries:
            # Convert _id to id if needed
            if "_id" in entry and "id" not in entry:
                entry["id"] = str(entry["_id"])
            
            # Remove _id field as we have id
            if "_id" in entry:
                del entry["_id"]
            
            # Convert to MaintenanceResponse
            maintenance_response = MaintenanceResponse(**entry)
            result.append(maintenance_response)
        
        logger.debug(f"Fetched {len(result)} maintenance entries for asset ID: {asset_id}")
        return result
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except ValueError as e:
        # Re-raise ValueError as is
        raise
    except Exception as e:
        logger.error(f"Error fetching maintenance history for asset {asset_id}: {str(e)}", exc_info=True)
        raise

def get_maintenance_by_id(db: Collection, maintenance_id: str) -> Optional[MaintenanceResponse]:
    """
    Retrieve a specific maintenance entry by ID.
    
    Args:
        db (Collection): MongoDB collection
        maintenance_id (str): Maintenance ID to retrieve
        
    Returns:
        Optional[MaintenanceResponse]: The maintenance entry if found, None otherwise
    """
    logger.info(f"Fetching maintenance ID: {maintenance_id}")
    try:
        maintenance = db.find_one({"id": maintenance_id})
        if not maintenance:
            logger.warning(f"Maintenance entry not found: {maintenance_id}")
            return None
        
        # Remove _id field as we have id
        if "_id" in maintenance:
            del maintenance["_id"]
        
        # Convert to MaintenanceResponse
        maintenance_response = MaintenanceResponse(**maintenance)
        logger.debug(f"Fetched maintenance entry: {maintenance_response.id}")
        return maintenance_response
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error fetching maintenance {maintenance_id}: {str(e)}", exc_info=True)
        raise

def request_maintenance(db: Collection, maintenance: MaintenanceCreate) -> MaintenanceResponse:
    """
    Create a new maintenance request and update asset status.
    
    Args:
        db (Collection): MongoDB collection
        maintenance (MaintenanceCreate): Maintenance request data
        
    Returns:
        MaintenanceResponse: The created maintenance request
    """
    logger.info(f"Creating maintenance request for asset ID: {maintenance.asset_id}")
    try:
        # Check if asset exists
        asset = db.database["asset_items"].find_one({"id": maintenance.asset_id})
        if not asset:
            logger.warning(f"Asset not found: {maintenance.asset_id}")
            raise ValueError(f"Asset with ID {maintenance.asset_id} not found")
        
        # Convert to dict, excluding None values
        maintenance_dict = maintenance.model_dump(exclude_none=True)
        
        # Set default values
        current_time = get_current_datetime()
        maintenance_dict["request_date"] = current_time
        maintenance_dict["status"] = maintenance_dict.get("status", "requested")
        maintenance_dict["is_complete"] = False
        
        # Generate UUID for the id field
        maintenance_dict["id"] = generate_uuid()
        
        # Add _id field for MongoDB to use the same value as id
        maintenance_dict["_id"] = maintenance_dict["id"]
        
        # Add asset name for reference
        maintenance_dict["asset_name"] = asset.get("asset_name", "Unknown")
        
        # Insert the maintenance request
        result = db.insert_one(maintenance_dict)
        logger.debug(f"Inserted maintenance request with ID: {maintenance_dict['id']}")
        
        # Update asset status if requested
        if maintenance_dict["status"] == "requested":
            db.database["asset_items"].update_one(
                {"id": maintenance.asset_id},
                {"$set": {
                    "status": "maintenance_requested",
                    "is_operational": False,
                    "maintenance_history": {
                        "id": maintenance_dict["id"],
                        "type": maintenance_dict.get("maintenance_type", "corrective"),
                        "issue": maintenance_dict.get("issue", ""),
                        "date": current_time,
                        "status": "requested"
                    }
                }}
            )
            logger.info(f"Updated asset status to maintenance_requested: {maintenance.asset_id}")
        elif maintenance_dict["status"] == "in_progress":
            db.database["asset_items"].update_one(
                {"id": maintenance.asset_id},
                {"$set": {
                    "status": "under_maintenance",
                    "is_operational": False,
                    "maintenance_history": {
                        "id": maintenance_dict["id"],
                        "type": maintenance_dict.get("maintenance_type", "corrective"),
                        "issue": maintenance_dict.get("issue", ""),
                        "date": current_time,
                        "status": "in_progress"
                    }
                }}
            )
            logger.info(f"Updated asset status to under_maintenance: {maintenance.asset_id}")
        
        # Push the entry to asset's maintenance history
        db.database["asset_items"].update_one(
            {"id": maintenance.asset_id},
            {"$push": {"maintenance_history": {
                "id": maintenance_dict["id"],
                "type": maintenance_dict.get("maintenance_type", "corrective"),
                "issue": maintenance_dict.get("issue", ""),
                "date": current_time,
                "status": maintenance_dict["status"],
                "notes": maintenance_dict.get("notes", "")
            }}}
        )
        
        # Retrieve the created maintenance request
        created_maintenance = db.find_one({"id": maintenance_dict["id"]})
        
        # Remove _id field
        if "_id" in created_maintenance:
            del created_maintenance["_id"]
        
        # Convert to MaintenanceResponse
        maintenance_response = MaintenanceResponse(**created_maintenance)
        logger.info(f"Created maintenance request with ID: {maintenance_response.id}")
        return maintenance_response
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except ValueError as e:
        # Re-raise ValueError as is
        raise
    except Exception as e:
        logger.error(f"Error creating maintenance request: {str(e)}", exc_info=True)
        raise

def update_maintenance_status(
    db: Collection, 
    maintenance_id: str, 
    maintenance: MaintenanceUpdate
) -> Optional[MaintenanceResponse]:
    """
    Update an existing maintenance request status and update asset status accordingly.
    
    Args:
        db (Collection): MongoDB collection
        maintenance_id (str): Maintenance ID to update
        maintenance (MaintenanceUpdate): Updated maintenance data
        
    Returns:
        Optional[MaintenanceResponse]: The updated maintenance request if found, None otherwise
    """
    logger.info(f"Updating maintenance request ID: {maintenance_id}")
    try:
        # Check if maintenance request exists
        existing_maintenance = db.find_one({"id": maintenance_id})
        if not existing_maintenance:
            logger.warning(f"Maintenance request not found: {maintenance_id}")
            return None
        
        # Convert to dict, excluding unset and None values
        maintenance_dict = maintenance.model_dump(exclude_unset=True, exclude_none=True)
        
        # Set completion date if status is completed
        if "status" in maintenance_dict and maintenance_dict["status"] == "completed":
            maintenance_dict["completion_date"] = get_current_datetime()
            maintenance_dict["is_complete"] = True
            
            # Schedule next maintenance if needed
            asset_id = existing_maintenance["asset_id"]
            asset = db.database["asset_items"].find_one({"id": asset_id})
            
            if asset and "maintenance_schedule" in asset and asset["maintenance_schedule"].get("frequency") > 0:
                frequency = asset["maintenance_schedule"]["frequency"]
                frequency_unit = asset["maintenance_schedule"]["frequency_unit"]
                next_maintenance_date = get_current_datetime()
                
                if frequency_unit == "days":
                    next_maintenance_date += timedelta(days=frequency)
                elif frequency_unit == "weeks":
                    next_maintenance_date += timedelta(weeks=frequency)
                elif frequency_unit == "months":
                    # Approximate months as 30 days
                    next_maintenance_date += timedelta(days=30 * frequency)
                elif frequency_unit == "years":
                    # Approximate years as 365 days
                    next_maintenance_date += timedelta(days=365 * frequency)
                
                # Update asset with next maintenance date
                db.database["asset_items"].update_one(
                    {"id": asset_id},
                    {"$set": {"next_maintenance_date": next_maintenance_date}}
                )
                logger.info(f"Updated next maintenance date for asset: {asset_id}")
        
        # Apply all updates to the maintenance request
        result = db.update_one(
            {"id": maintenance_id},
            {"$set": maintenance_dict}
        )
        
        if result.matched_count == 0:
            logger.warning(f"Maintenance request not found: {maintenance_id}")
            return None
        
        # Update asset status based on maintenance status
        asset_id = existing_maintenance["asset_id"]
        
        if "status" in maintenance_dict:
            new_status = maintenance_dict["status"]
            
            if new_status == "in_progress":
                # Update asset status to under maintenance
                db.database["asset_items"].update_one(
                    {"id": asset_id},
                    {"$set": {
                        "status": "under_maintenance",
                        "is_operational": False
                    }}
                )
                logger.info(f"Updated asset status to under_maintenance: {asset_id}")
            elif new_status == "completed":
                # Update asset status to available
                db.database["asset_items"].update_one(
                    {"id": asset_id},
                    {"$set": {
                        "status": "available",
                        "is_operational": True
                    }}
                )
                logger.info(f"Updated asset status to available: {asset_id}")
            elif new_status == "cancelled":
                # Update asset status to available if it was under maintenance
                db.database["asset_items"].update_one(
                    {"id": asset_id, "status": {"$in": ["maintenance_requested", "under_maintenance"]}},
                    {"$set": {
                        "status": "available",
                        "is_operational": True
                    }}
                )
                logger.info(f"Updated asset status to available (cancelled maintenance): {asset_id}")
        
        # Update the maintenance history entry in the asset
        db.database["asset_items"].update_one(
            {"id": asset_id, "maintenance_history.id": maintenance_id},
            {"$set": {
                "maintenance_history.$.status": maintenance_dict.get("status", existing_maintenance["status"]),
                "maintenance_history.$.notes": maintenance_dict.get("notes", existing_maintenance.get("notes", "")),
                "maintenance_history.$.completion_date": maintenance_dict.get("completion_date", existing_maintenance.get("completion_date"))
            }}
        )
        
        # Fetch the updated maintenance request
        updated_maintenance = db.find_one({"id": maintenance_id})
        
        # Remove _id field
        if "_id" in updated_maintenance:
            del updated_maintenance["_id"]
        
        # Convert to MaintenanceResponse
        maintenance_response = MaintenanceResponse(**updated_maintenance)
        logger.debug(f"Updated maintenance request: {maintenance_response.id}")
        return maintenance_response
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error updating maintenance request {maintenance_id}: {str(e)}", exc_info=True)
        raise

def get_maintenance_statistics(db: Collection) -> Dict[str, Any]:
    """
    Get statistics for maintenance requests.
    
    Args:
        db (Collection): MongoDB collection
        
    Returns:
        Dict[str, Any]: Maintenance statistics
    """
    logger.info("Calculating maintenance statistics")
    try:
        total = db.count_documents({})
        requested = db.count_documents({"status": "requested"})
        in_progress = db.count_documents({"status": "in_progress"})
        completed = db.count_documents({"status": "completed"})
        cancelled = db.count_documents({"status": "cancelled"})
        
        # Calculate average time to complete maintenance (in days)
        completed_entries = list(db.find({
            "status": "completed",
            "completion_date": {"$exists": True},
            "request_date": {"$exists": True}
        }))
        
        total_days = 0
        for entry in completed_entries:
            request_date = entry.get("request_date")
            completion_date = entry.get("completion_date")
            
            if request_date and completion_date:
                days_diff = (completion_date - request_date).total_seconds() / (24 * 3600)
                total_days += days_diff
        
        avg_days_to_complete = total_days / len(completed_entries) if completed_entries else 0
        
        # Count by maintenance type
        preventive = db.count_documents({"maintenance_type": "preventive"})
        corrective = db.count_documents({"maintenance_type": "corrective"})
        
        # Assets requiring maintenance soon (next 30 days)
        now = get_current_datetime()
        thirty_days_later = now + timedelta(days=30)
        
        maintenance_due_soon = db.database["asset_items"].count_documents({
            "next_maintenance_date": {"$gte": now, "$lte": thirty_days_later},
            "status": {"$nin": ["under_maintenance", "maintenance_requested", "retired", "lost"]},
            "requires_maintenance": True
        })
        
        statistics = {
            "total": total,
            "by_status": {
                "requested": requested,
                "in_progress": in_progress,
                "completed": completed,
                "cancelled": cancelled
            },
            "by_type": {
                "preventive": preventive,
                "corrective": corrective
            },
            "avg_days_to_complete": round(avg_days_to_complete, 2),
            "maintenance_due_soon": maintenance_due_soon
        }
        
        logger.debug("Calculated maintenance statistics")
        return statistics
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error calculating maintenance statistics: {str(e)}", exc_info=True)
        raise