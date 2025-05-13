from pymongo.collection import Collection
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from app.models.asset_item import AssetItem, AssetStatus
from app.models.assignment_history import AssignmentHistoryEntry
import logging

logger = logging.getLogger(__name__)

def parse_policies(policies: List[str]) -> dict:
    """
    Parse the policies list into a dictionary for easier validation.
    """
    policy_dict = {}
    for policy in policies:
        if ":" in policy:
            key, value = policy.split(":", 1)
            policy_dict[key.strip()] = value.strip()
    return policy_dict

def assign_asset_to_employee(
    db: Collection,
    asset_id: str,
    employee_ids: List[str],
    condition: str,
    department: Optional[str] = None,
    assignment_type: Optional[str] = None,
    entity_type: Optional[str] = "Employee",
    notes: Optional[str] = None
) -> AssetItem:
    """
    Assign an asset to employees, updating history and enforcing policies.
    """
    logger.info(f"Assigning asset {asset_id} to employees {employee_ids}")
    try:
        if not ObjectId.is_valid(asset_id):
            logger.warning(f"Invalid asset ID: {asset_id}")
            raise ValueError("Invalid asset ID")
        
        asset = db.asset_items.find_one({"_id": ObjectId(asset_id)})
        if not asset:
            logger.warning(f"Asset not found: {asset_id}")
            raise ValueError("Asset not found")
        
        category = db.asset_categories.find_one({"_id": ObjectId(asset["category_id"])})
        if not category:
            logger.warning(f"Category not found for asset: {asset_id}")
            raise ValueError("Category not found")
        
        if asset["status"] != AssetStatus.AVAILABLE:
            logger.warning(f"Asset not available: {asset_id}, status: {asset['status']}")
            raise ValueError(f"Asset is not available (status: {asset['status']})")
        
        if not category.get("is_reassignable", False) and asset["assignment_history"]:
            logger.warning(f"Asset not reassignable: {asset_id}")
            raise ValueError("Asset cannot be reassigned")
        
        for emp_id in employee_ids:
            if not ObjectId.is_valid(emp_id):
                logger.warning(f"Invalid employee ID: {emp_id}")
                raise ValueError(f"Invalid employee ID: {emp_id}")
            emp = db.employees.find_one({"_id": ObjectId(emp_id)})
            if not emp:
                logger.warning(f"Employee not found: {emp_id}")
                raise ValueError(f"Employee not found: {emp_id}")
        
        policies = parse_policies(category.get("policies", []))
        max_assignments = int(policies.get("max_assignments", "1"))
        allow_multiple = category.get("allow_multiple_assignments", False)
        
        if not allow_multiple and len(employee_ids) > 1:
            logger.warning(f"Multiple assignments not allowed for asset {asset_id}")
            raise ValueError("Multiple assignments not allowed")
        if len(employee_ids) > max_assignments:
            logger.warning(f"Exceeds max assignments ({max_assignments}) for asset {asset_id}")
            raise ValueError(f"Cannot assign to more than {max_assignments} employees")
        
        assignment_entry = AssignmentHistoryEntry(
            id=str(ObjectId()),
            asset_id=asset_id,
            assigned_to=employee_ids,
            department=department or asset.get("department"),
            assignment_type=assignment_type or "Standard",
            entity_type=entity_type,
            condition_at_assignment=condition,
            assignment_date=datetime.utcnow(),
            notes=notes
        )
        
        update_dict = {
            "status": AssetStatus.IN_USE,
            "has_active_assignment": True,
            "is_operational": True,
            "current_assignee_id": employee_ids[0] if employee_ids else None,
            "current_assignment_date": datetime.utcnow(),
            "department": department or asset.get("department"),
            "updated_at": datetime.utcnow(),
            "assignment_history": (asset.get("assignment_history", []) + [assignment_entry.dict()])
        }
        db.asset_items.update_one({"_id": ObjectId(asset_id)}, {"$set": update_dict})
        
        for emp_id in employee_ids:
            db.employees.update_one(
                {"_id": ObjectId(emp_id)},
                {
                    "$push": {
                        "assigned_assets": {
                            "asset_id": asset_id,
                            "assigned_at": datetime.utcnow()
                        }
                    },
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
        
        updated_asset = db.asset_items.find_one({"_id": ObjectId(asset_id)})
        category = db.asset_categories.find_one({"_id": ObjectId(updated_asset["category_id"])})
        updated_dict = {
            **updated_asset,
            "id": str(updated_asset["_id"]),
            "category_name": category.get("name", "") if category else ""
        }
        updated_item = AssetItem(**updated_dict)
        logger.debug(f"Assigned asset {asset_id} to {len(employee_ids)} employees")
        return updated_item
    except Exception as e:
        logger.error(f"Error assigning asset {asset_id}: {str(e)}", exc_info=True)
        raise

def unassign_employee_from_asset(
    db: Collection,
    asset_id: str,
    employee_id: str,
    condition: str,
    notes: Optional[str] = None
) -> AssetItem:
    """
    Unassign an employee from an asset, updating history.
    """
    logger.info(f"Unassigning employee {employee_id} from asset {asset_id}")
    try:
        if not ObjectId.is_valid(asset_id) or not ObjectId.is_valid(employee_id):
            logger.warning(f"Invalid IDs - asset: {asset_id}, employee: {employee_id}")
            raise ValueError("Invalid asset or employee ID")
        
        asset = db.asset_items.find_one({"_id": ObjectId(asset_id)})
        if not asset:
            logger.warning(f"Asset not found: {asset_id}")
            raise ValueError("Asset not found")
        
        employee = db.employees.find_one({"_id": ObjectId(employee_id)})
        if not employee:
            logger.warning(f"Employee not found: {employee_id}")
            raise ValueError("Employee not found")
        
        active_assignment = None
        for entry in asset.get("assignment_history", []):
            if employee_id in entry["assigned_to"] and not entry.get("return_date"):
                active_assignment = entry
                break
        
        if not active_assignment:
            logger.warning(f"No active assignment found for employee {employee_id} on asset {asset_id}")
            raise ValueError("No active assignment found")
        
        db.asset_items.update_one(
            {"_id": ObjectId(asset_id), "assignment_history.id": active_assignment["id"]},
            {
                "$set": {
                    "assignment_history.$.condition_at_return": condition,
                    "assignment_history.$.return_date": datetime.utcnow(),
                    "assignment_history.$.notes": notes or active_assignment.get("notes")
                }
            }
        )
        
        remaining_assignments = sum(
            1 for entry in asset.get("assignment_history", []) if not entry.get("return_date")
        )
        
        update_dict = {
            "updated_at": datetime.utcnow(),
            "has_active_assignment": remaining_assignments > 0,
            "status": AssetStatus.AVAILABLE if remaining_assignments == 0 else AssetStatus.IN_USE,
            "current_assignee_id": None if remaining_assignments == 0 else asset["current_assignee_id"],
            "current_assignment_date": None if remaining_assignments == 0 else asset["current_assignment_date"],
            "department": None if remaining_assignments == 0 else asset.get("department")
        }
        db.asset_items.update_one({"_id": ObjectId(asset_id)}, {"$set": update_dict})
        
        db.employees.update_one(
            {"_id": ObjectId(employee_id)},
            {
                "$pull": {"assigned_assets": {"asset_id": asset_id}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        updated_asset = db.asset_items.find_one({"_id": ObjectId(asset_id)})
        category = db.asset_categories.find_one({"_id": ObjectId(updated_asset["category_id"])})
        updated_dict = {
            **updated_asset,
            "id": str(updated_asset["_id"]),
            "category_name": category.get("name", "") if category else ""
        }
        updated_item = AssetItem(**updated_dict)
        logger.debug(f"Unassigned employee {employee_id} from asset {asset_id}")
        return updated_item
    except Exception as e:
        logger.error(f"Error unassigning asset {asset_id}: {str(e)}", exc_info=True)
        raise