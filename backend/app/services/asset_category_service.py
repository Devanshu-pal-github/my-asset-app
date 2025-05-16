from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError, OperationFailure
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.asset_category import (
    AssetCategory, 
    AssetCategoryCreate, 
    AssetCategoryUpdate,
    AssetCategoryResponse,
    AssignmentPolicies, 
    Documents
)
from app.models.utils import generate_uuid, get_current_datetime, serialize_model
import logging

logger = logging.getLogger(__name__)

def get_asset_categories(
    db: Collection, 
    filters: Dict[str, Any] = None
) -> List[AssetCategoryResponse]:
    """
    Retrieve all asset categories with statistics.
    
    Args:
        db (Collection): MongoDB collection
        filters (Dict[str, Any], optional): Filtering criteria
        
    Returns:
        List[AssetCategoryResponse]: List of asset categories with computed statistics
    """
    logger.info("Fetching all asset categories")
    try:
        query = filters or {}
        categories = list(db.find(query))
        result = []
        for cat in categories:
            # Convert _id to id if needed
            if "_id" in cat and "id" not in cat:
                cat["id"] = str(cat["_id"])
            
            # Get statistics from asset items collection
            count = db.database["asset_items"].count_documents({"category_id": cat["id"]})
            
            # Sum the purchase cost of all items in this category
            total_cost = sum(
                item.get("purchase_cost", 0) for item in db.database["asset_items"].find({"category_id": cat["id"]})
            )
            
            # Count assigned and maintenance assets
            assigned_count = db.database["asset_items"].count_documents({
                "category_id": cat["id"], 
                "has_active_assignment": True
            })
            
            maintenance_count = db.database["asset_items"].count_documents({
                "category_id": cat["id"], 
                "status": {"$in": ["under_maintenance", "maintenance_requested"]}
            })
            
            # Calculate utilization rate
            utilization_rate = (
                db.database["asset_items"].count_documents({"category_id": cat["id"], "is_operational": True}) /
                count * 100
            ) if count > 0 else 0.0
            
            cat_dict = {
                **cat,
                "total_assets": count,
                "total_cost": total_cost,
                "assigned_assets": assigned_count,
                "under_maintenance": maintenance_count,
                "utilizationRate": round(utilization_rate, 2)
            }
            
            # Remove _id field as we already have id
            if "_id" in cat_dict:
                del cat_dict["_id"]
            
            result.append(AssetCategoryResponse(**cat_dict))
        
        logger.debug(f"Fetched {len(result)} categories")
        return result
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}", exc_info=True)
        raise

def get_asset_category_by_id(db: Collection, category_id: str) -> Optional[AssetCategory]:
    """
    Retrieve a specific asset category by ID with statistics.
    
    Args:
        db (Collection): MongoDB collection
        category_id (str): Category ID to retrieve
        
    Returns:
        Optional[AssetCategory]: The category if found, None otherwise
    """
    logger.info(f"Fetching asset category ID: {category_id}")
    try:
        category = db.find_one({"id": category_id})
        if not category:
            logger.warning(f"Category not found: {category_id}")
            return None
        
        # Get statistics from asset items collection
        count = db.database["asset_items"].count_documents({"category_id": category_id})
        
        # Sum the purchase cost of all items in this category
        total_cost = sum(
            item.get("purchase_cost", 0) for item in db.database["asset_items"].find({"category_id": category_id})
        )
        
        # Count assigned and maintenance assets
        assigned_count = db.database["asset_items"].count_documents({
            "category_id": category_id, 
            "has_active_assignment": True
        })
        
        maintenance_count = db.database["asset_items"].count_documents({
            "category_id": category_id, 
            "status": {"$in": ["under_maintenance", "maintenance_requested"]}
        })
        
        unassignable_count = db.database["asset_items"].count_documents({
            "category_id": category_id, 
            "status": {"$in": ["retired", "lost", "under_maintenance"]}
        })
        
        # Calculate utilization rate
        utilization_rate = (
            db.database["asset_items"].count_documents({"category_id": category_id, "is_operational": True}) /
            count * 100
        ) if count > 0 else 0.0
        
        cat_dict = {
            **category,
            "total_assets": count,
            "total_cost": total_cost,
            "assigned_assets": assigned_count,
            "under_maintenance": maintenance_count,
            "unassignable_assets": unassignable_count,
            "utilizationRate": round(utilization_rate, 2)
        }
        
        # Remove _id field as we already have id
        if "_id" in cat_dict:
            del cat_dict["_id"]
        
        result = AssetCategory(**cat_dict)
        logger.debug(f"Fetched category: {result.category_name}")
        return result
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error fetching category {category_id}: {str(e)}", exc_info=True)
        raise

def create_asset_category(db: Collection, category: AssetCategoryCreate) -> AssetCategory:
    """
    Create a new asset category with validation.
    
    Args:
        db (Collection): MongoDB collection
        category (AssetCategoryCreate): Category data to create
        
    Returns:
        AssetCategory: The created category
    """
    logger.info(f"Creating category: {category.category_name}")
    try:
        existing = db.find_one({"category_name": category.category_name})
        if existing:
            logger.warning(f"Category already exists: {category.category_name}")
            raise ValueError(f"Category '{category.category_name}' already exists")
        
        # Convert to dictionary and populate defaults
        category_dict = category.model_dump(exclude_none=True)
        
        # Handle boolean fields with defaults
        category_dict["is_active"] = category_dict.get("is_active", True)
        category_dict["is_enabled"] = category_dict.get("is_enabled", True)
        category_dict["can_be_assigned_reassigned"] = category_dict.get("can_be_assigned_reassigned", False)
        category_dict["is_consumable"] = category_dict.get("is_consumable", False)
        category_dict["is_allotted"] = category_dict.get("is_allotted", False)
        category_dict["maintenance_required"] = category_dict.get("maintenance_required", False)
        category_dict["is_recurring_maintenance"] = category_dict.get("is_recurring_maintenance", False)
        category_dict["requires_maintenance"] = category_dict.get("requires_maintenance", False)
        category_dict["has_specifications"] = category_dict.get("has_specifications", False)
        category_dict["required_documents"] = category_dict.get("required_documents", False)
        category_dict["allow_multiple_assignments"] = category_dict.get("allow_multiple_assignments", False)
        category_dict["save_as_template"] = category_dict.get("save_as_template", False)
        category_dict["is_reassignable"] = category_dict.get("is_reassignable", True)
        
        # Handle documents field properly
        if "documents" in category_dict and category_dict["documents"]:
            if not isinstance(category_dict["documents"], dict):
                category_dict["documents"] = category_dict["documents"].model_dump()
        else:
            category_dict["documents"] = {
                "purchase": False,
                "warranty": False,
                "insurance": False,
                "custom": []
            }
        
        # Handle assignment policies
        if "assignment_policies" in category_dict and category_dict["assignment_policies"]:
            if not isinstance(category_dict["assignment_policies"], dict):
                category_dict["assignment_policies"] = category_dict["assignment_policies"].model_dump()
        else:
            category_dict["assignment_policies"] = {
                "max_assignments": 1,
                "assignable_to": category_dict.get("can_be_assigned_to", None),
                "assignment_duration": category_dict.get("default_assignment_duration", None),
                "duration_unit": category_dict.get("assignment_duration_unit", "days"),
                "allow_multiple_assignments": category_dict.get("allow_multiple_assignments", False)
            }
        
        # Build policies from individual fields if not provided
        if "policies" not in category_dict or not category_dict["policies"]:
            category_dict["policies"] = [
                f"max_assignments: {category_dict.get('assignment_policies', {}).get('max_assignments', 1)}",
                f"assignable_to: {category_dict.get('can_be_assigned_to', 'None')}",
                f"assignment_duration: {category_dict.get('default_assignment_duration', 'None')} {category_dict.get('assignment_duration_unit', '')}"
            ]
        
        # Statistics fields (default values)
        category_dict["total_assets"] = 0
        category_dict["total_cost"] = 0.0
        category_dict["assigned_assets"] = 0
        category_dict["under_maintenance"] = 0
        category_dict["unassignable_assets"] = 0
        category_dict["edit_history"] = []
        category_dict["created_at"] = get_current_datetime()
        
        # Generate UUID for the id field if not provided
        if "id" not in category_dict:
            category_dict["id"] = generate_uuid()
        
        # Add _id field for MongoDB to use the same value as id
        category_dict["_id"] = category_dict["id"]
        
        result = db.insert_one(category_dict)
        logger.debug(f"Inserted category: {category.category_name} with ID: {category_dict['id']}")
        
        # Create full AssetCategory object from saved data
        created_category = AssetCategory(**category_dict)
        logger.info(f"Created category with ID: {created_category.id}")
        return created_category
    except DuplicateKeyError:
        logger.warning(f"Category already exists: {category.category_name}")
        raise ValueError(f"Category '{category.category_name}' already exists")
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error creating category: {str(e)}", exc_info=True)
        raise

def update_asset_category(db: Collection, category_id: str, category: AssetCategoryUpdate) -> Optional[AssetCategory]:
    """
    Update an existing asset category.
    
    Args:
        db (Collection): MongoDB collection
        category_id (str): Category ID to update
        category (AssetCategoryUpdate): Category data to update
        
    Returns:
        Optional[AssetCategory]: The updated category if found, None otherwise
    """
    logger.info(f"Updating category ID: {category_id}")
    try:
        # Check if category exists
        existing_category = db.find_one({"id": category_id})
        if not existing_category:
            logger.warning(f"Category not found: {category_id}")
            return None
        
        # Check for duplicate name
        if category.category_name:
            existing = db.find_one({"category_name": category.category_name, "id": {"$ne": category_id}})
            if existing:
                logger.warning(f"Category name already taken: {category.category_name}")
                raise ValueError(f"Category name '{category.category_name}' already exists")
        
        # Convert to dictionary, excluding unset and None values
        category_dict = category.model_dump(exclude_unset=True, exclude_none=True)
        
        # Handle boolean fields
        bool_fields = [
            "is_active", "is_enabled", "can_be_assigned_reassigned", "is_consumable", "is_allotted", 
            "maintenance_required", "is_recurring_maintenance", "requires_maintenance",
            "has_specifications", "required_documents", "allow_multiple_assignments", 
            "save_as_template", "is_reassignable"
        ]
        
        for field in bool_fields:
            if field in category_dict:
                category_dict[field] = bool(category_dict[field])
        
        # Handle documents field
        if "documents" in category_dict and category_dict["documents"]:
            if not isinstance(category_dict["documents"], dict):
                category_dict["documents"] = category_dict["documents"].model_dump()
        
        # Handle assignment policies
        if "assignment_policies" in category_dict and category_dict["assignment_policies"]:
            if not isinstance(category_dict["assignment_policies"], dict):
                category_dict["assignment_policies"] = category_dict["assignment_policies"].model_dump()
        
        # Update policies from individual fields if specified
        if "policies" in category_dict:
            if not category_dict["policies"]:
                ap = category_dict.get("assignment_policies", {})
                category_dict["policies"] = [
                    f"max_assignments: {ap.get('max_assignments', 1)}",
                    f"assignable_to: {category_dict.get('can_be_assigned_to', 'None')}",
                    f"assignment_duration: {category_dict.get('default_assignment_duration', 'None')} {category_dict.get('assignment_duration_unit', '')}"
                ]
        
        # Track edit history
        current_time = get_current_datetime()
        category_dict["updated_at"] = current_time
        
        # Add a history entry for this update
        edit_entry = {
            "id": generate_uuid(),
            "type": "edit",
            "edit_date": current_time.strftime("%Y-%m-%d"),
            "change_type": "Category Update",
            "details": f"Updated category fields: {', '.join(category_dict.keys())}",
            "notes": "Updated via API"
        }
        
        # Add history entry to the document
        db.update_one(
            {"id": category_id},
            {"$push": {"edit_history": edit_entry}}
        )
        
        # Apply all updates
        result = db.update_one(
            {"id": category_id},
            {"$set": category_dict}
        )
        
        if result.matched_count == 0:
            logger.warning(f"Category not found: {category_id}")
            return None
        
        # Fetch the updated category
        updated = db.find_one({"id": category_id})
        
        # Calculate statistics
        count = db.database["asset_items"].count_documents({"category_id": category_id})
        total_cost = sum(
            item.get("purchase_cost", 0) for item in db.database["asset_items"].find({"category_id": category_id})
        )
        assigned_count = db.database["asset_items"].count_documents({
            "category_id": category_id, 
            "has_active_assignment": True
        })
        maintenance_count = db.database["asset_items"].count_documents({
            "category_id": category_id, 
            "status": {"$in": ["under_maintenance", "maintenance_requested"]}
        })
        unassignable_count = db.database["asset_items"].count_documents({
            "category_id": category_id, 
            "status": {"$in": ["retired", "lost", "under_maintenance"]}
        })
        utilization_rate = (
            db.database["asset_items"].count_documents({"category_id": category_id, "is_operational": True}) /
            count * 100
        ) if count > 0 else 0.0
        
        updated_dict = {
            **updated,
            "total_assets": count,
            "total_cost": total_cost,
            "assigned_assets": assigned_count,
            "under_maintenance": maintenance_count,
            "unassignable_assets": unassignable_count,
            "utilizationRate": round(utilization_rate, 2)
        }
        
        # Remove _id field as we already have id
        if "_id" in updated_dict:
            del updated_dict["_id"]
        
        result = AssetCategory(**updated_dict)
        logger.debug(f"Updated category: {result.category_name}")
        return result
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error updating category {category_id}: {str(e)}", exc_info=True)
        raise

def delete_asset_category(db: Collection, category_id: str) -> bool:
    """
    Delete an asset category if no assets are associated.
    
    Args:
        db (Collection): MongoDB collection
        category_id (str): Category ID to delete
        
    Returns:
        bool: True if category was deleted, False if not found
    """
    logger.info(f"Deleting category ID: {category_id}")
    try:
        asset_count = db.database["asset_items"].count_documents({"category_id": category_id})
        if asset_count > 0:
            logger.warning(f"Cannot delete category {category_id}: {asset_count} assets associated")
            raise ValueError(f"Cannot delete category with {asset_count} associated assets")
        
        result = db.delete_one({"id": category_id})
        if result.deleted_count == 0:
            logger.warning(f"Category not found: {category_id}")
            return False
        
        logger.debug(f"Deleted category ID: {category_id}")
        return True
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error deleting category {category_id}: {str(e)}", exc_info=True)
        raise