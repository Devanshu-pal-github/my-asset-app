from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError
from app.models.employee import EmployeeCreate, Employee, EmployeeBase
from datetime import datetime
from bson import ObjectId
from typing import List, Optional, Dict
from fastapi import HTTPException
import logging
from pydantic import ValidationError

logger = logging.getLogger(__name__)

def is_valid_objectid(oid: str) -> bool:
    try:
        ObjectId(oid)
        return True
    except:
        return False

def check_collection_exists(db: Collection, collection_name: str) -> bool:
    try:
        return collection_name in db.list_collection_names()
    except Exception as e:
        logger.error(f"Failed to check collection {collection_name}: {str(e)}")
        return False

def normalize_assigned_assets(assigned_assets: List) -> List[Dict[str, str]]:
    """Normalize assigned_assets to [{"asset_id": "..."}] format."""
    if not assigned_assets:
        return []
    normalized = []
    for asset in assigned_assets:
        if isinstance(asset, dict) and "asset_id" in asset:
            normalized.append({"asset_id": str(asset["asset_id"])})
        elif isinstance(asset, str) and is_valid_objectid(asset):
            normalized.append({"asset_id": asset})
        else:
            logger.warning(f"Skipping invalid asset format: {asset}")
    return normalized

def get_employees(db: Collection) -> List[Employee]:
    try:
        logger.debug("Fetching all employees")
        employees = list(db.employees.find())
        result = []
        for emp in employees:
            try:
                emp["assigned_assets"] = normalize_assigned_assets(emp.get("assigned_assets", []))
                result.append(Employee(**{**emp, "id": str(emp["_id"])}))
            except ValidationError as ve:
                logger.error(f"Validation error for employee {emp.get('_id')}: {str(ve)}")
                continue
        logger.debug(f"Fetched {len(result)} employees")
        return result
    except Exception as e:
        logger.error(f"Failed to fetch employees: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch employees")

def get_employee_by_id(db: Collection, id: str) -> Optional[Employee]:
    try:
        logger.debug(f"Fetching employee by ID: {id}")
        if not is_valid_objectid(id):
            logger.warning(f"Invalid ObjectId format: {id}")
            return None
        employee = db.employees.find_one({"_id": ObjectId(id)})
        if employee:
            try:
                employee["assigned_assets"] = normalize_assigned_assets(employee.get("assigned_assets", []))
                result = Employee(**{**employee, "id": str(employee["_id"])})
                logger.debug(f"Found employee: {result.employee_id}")
                return result
            except ValidationError as ve:
                logger.error(f"Validation error for employee ID {id}: {str(ve)}", exc_info=True)
                raise HTTPException(status_code=500, detail=f"Employee data invalid: {str(ve)}")
        logger.warning(f"Employee not found for ID: {id}")
        return None
    except Exception as e:
        logger.error(f"Failed to fetch employee by ID {id}: {str(e)}", exc_info=True)
        return None

def get_employee_details(db: Collection, id: str) -> dict:
    try:
        logger.debug(f"Starting get_employee_details for ID: {id}")
        # Fetch employee
        employee = get_employee_by_id(db, id)
        if not employee:
            logger.error(f"Employee not found for ID: {id}")
            raise HTTPException(status_code=404, detail="Employee not found")

        # Validate collections
        required_collections = ["asset_items", "asset_categories", "assignment_history", "maintenance_history", "documents"]
        for collection in required_collections:
            if not check_collection_exists(db, collection):
                logger.warning(f"Collection {collection} does not exist")

        # Validate assigned assets
        valid_asset_ids = []
        assigned_assets = employee.assigned_assets or []
        logger.debug(f"Processing assigned assets: {assigned_assets}")
        if check_collection_exists(db, "asset_items"):
            for asset in assigned_assets:
                asset_id = asset.get("asset_id") if isinstance(asset, dict) else asset
                if not asset_id:
                    logger.warning(f"Empty asset ID in assigned_assets for employee {id}")
                    continue
                if not is_valid_objectid(asset_id):
                    logger.warning(f"Invalid asset ID format: {asset_id} for employee {id}")
                    continue
                try:
                    if db.asset_items.find_one({"_id": ObjectId(asset_id)}):
                        valid_asset_ids.append(asset_id)
                    else:
                        logger.warning(f"Asset ID {asset_id} not found in asset_items for employee {id}")
                except Exception as e:
                    logger.error(f"Error validating asset ID {asset_id} for employee {id}: {str(e)}")
                    continue
        else:
            logger.warning("asset_items collection not found, skipping asset validation")

        logger.debug(f"Valid asset IDs: {valid_asset_ids}")

        # Fetch current assets
        current_assets = []
        if valid_asset_ids and check_collection_exists(db, "asset_items"):
            assets_pipeline = [
                {"$match": {"_id": {"$in": [ObjectId(aid) for aid in valid_asset_ids]}}},
                {"$lookup": {
                    "from": "asset_categories",
                    "localField": "category_id",
                    "foreignField": "_id",
                    "as": "category"
                }},
                {"$unwind": {"path": "$category", "preserveNullAndEmptyArrays": True}},
                {"$project": {
                    "id": {"$toString": "$_id"},
                    "name": {"$ifNull": ["$name", "Unknown"]},
                    "asset_tag": {"$ifNull": ["$asset_tag", "N/A"]},
                    "serial_number": {"$ifNull": ["$serial_number", "N/A"]},
                    "status": {"$ifNull": ["$status", "N/A"]},
                    "condition": {"$ifNull": ["$condition", "N/A"]},
                    "category_name": {"$ifNull": ["$category.name", "Unknown"]},
                    "purchase_date": {"$ifNull": ["$purchase_date", null]},
                    "purchase_cost": {"$ifNull": ["$purchase_cost", 0]},
                    "current_assignment_date": {"$ifNull": ["$current_assignment_date", null]}
                }}
            ]
            try:
                logger.debug(f"Running assets pipeline: {assets_pipeline}")
                current_assets = list(db.asset_items.aggregate(assets_pipeline))
                logger.debug(f"Current assets fetched: {len(current_assets)}")
            except Exception as e:
                logger.error(f"Failed to fetch current assets for employee {id}: {str(e)}")
                current_assets = []

        # Fetch assignment history
        assignment_history = []
        if check_collection_exists(db, "assignment_history"):
            assignment_pipeline = [
                {"$match": {"$or": [
                    {"assigned_to": {"$in": [id, ObjectId(id)]}},
                    {"assigned_to": {"$in": [[id], [ObjectId(id)]]}}
                ]}},
                {"$lookup": {
                    "from": "asset_items",
                    "localField": "asset_id",
                    "foreignField": "_id",
                    "as": "asset"
                }},
                {"$unwind": {"path": "$asset", "preserveNullAndEmptyArrays": True}},
                {"$project": {
                    "id": {"$toString": "$_id"},
                    "asset_id": {"$toString": "$asset_id"},
                    "asset_name": {"$ifNull": ["$asset.name", "Unknown"]},
                    "assignment_date": {"$ifNull": ["$assignment_date", null]},
                    "return_date": {"$ifNull": ["$return_date", null]},
                    "assignment_type": {"$ifNull": ["$assignment_type", "N/A"]},
                    "notes": {"$ifNull": ["$notes", "N/A"]},
                    "is_active": {"$ifNull": ["$is_active", false]}
                }}
            ]
            try:
                logger.debug(f"Running assignment pipeline: {assignment_pipeline}")
                assignment_history = list(db.assignment_history.aggregate(assignment_pipeline))
                logger.debug(f"Assignment history fetched: {len(assignment_history)}")
            except Exception as e:
                logger.error(f"Failed to fetch assignment history for employee {id}: {str(e)}")
                assignment_history = []

        # Fetch maintenance history
        maintenance_history = []
        if valid_asset_ids and check_collection_exists(db, "maintenance_history"):
            maintenance_pipeline = [
                {"$match": {"asset_id": {"$in": [ObjectId(aid) for aid in valid_asset_ids]}}},
                {"$lookup": {
                    "from": "asset_items",
                    "localField": "asset_id",
                    "foreignField": "_id",
                    "as": "asset"
                }},
                {"$unwind": {"path": "$asset", "preserveNullAndEmptyArrays": True}},
                {"$project": {
                    "id": {"$toString": "$_id"},
                    "asset_id": {"$toString": "$asset_id"},
                    "asset_name": {"$ifNull": ["$asset.name", "Unknown"]},
                    "maintenance_date": {"$ifNull": ["$maintenance_date", null]},
                    "maintenance_type": {"$ifNull": ["$maintenance_type", "N/A"]},
                    "cost": {"$ifNull": ["$cost", 0]},
                    "performed_by": {"$ifNull": ["$technician", "N/A"]},  # Map technician to performed_by
                    "notes": {"$ifNull": ["$notes", "N/A"]},
                    "next_scheduled_maintenance": {"$ifNull": ["$completed_date", null]}
                }}
            ]
            try:
                logger.debug(f"Running maintenance pipeline: {maintenance_pipeline}")
                maintenance_history = list(db.maintenance_history.aggregate(maintenance_pipeline))
                logger.debug(f"Maintenance history fetched: {len(maintenance_history)}")
            except Exception as e:
                logger.error(f"Failed to fetch maintenance history for employee {id}: {str(e)}")
                assignment_history = []

        # Fetch documents
        documents = []
        if check_collection_exists(db, "documents"):
            documents_pipeline = [
                {"$match": {"$or": [
                    {"employee_id": {"$in": [id, ObjectId(id)]}},
                    {"asset_id": {"$in": [ObjectId(aid) for aid in valid_asset_ids]}}
                ]}},
                {"$lookup": {
                    "from": "asset_items",
                    "localField": "asset_id",
                    "foreignField": "_id",
                    "as": "asset"
                }},
                {"$unwind": {"path": "$asset", "preserveNullAndEmptyArrays": True}},
                {"$project": {
                    "id": {"$toString": "$_id"},
                    "asset_id": {"$toString": "$asset_id"},
                    "asset_name": {"$ifNull": ["$asset.name", "Unknown"]},
                    "employee_id": {"$ifNull": ["$employee_id", "N/A"]},
                    "document_type": {"$ifNull": ["$document_type", "N/A"]},
                    "document_url": {"$ifNull": ["$document_url", ""]},
                    "document_name": {"$ifNull": ["$document_name", "Unnamed"]},
                    "notes": {"$ifNull": ["$notes", "N/A"]},
                    "created_at": {"$ifNull": ["$created_at", null]},
                    "uploaded_by": {"$ifNull": ["$uploaded_by", "N/A"]}
                }}
            ]
            try:
                logger.debug(f"Running documents pipeline: {documents_pipeline}")
                documents = list(db.documents.aggregate(documents_pipeline))
                logger.debug(f"Documents fetched: {len(documents)}")
            except Exception as e:
                logger.error(f"Failed to fetch documents for employee {id}: {str(e)}")
                documents = []

        result = {
            "employee": employee,
            "current_assets": current_assets,
            "assignment_history": assignment_history,
            "maintenance_history": maintenance_history,
            "documents": documents
        }
        logger.debug(f"Returning employee details for ID {id}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch employee details for ID {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee details: {str(e)}")

def create_employee(db: Collection, employee: EmployeeCreate) -> Employee:
    try:
        logger.debug("Creating new employee")
        employee_dict = employee.dict()
        employee_dict["created_at"] = datetime.utcnow()
        employee_dict["updated_at"] = datetime.utcnow()
        employee_dict["assigned_assets"] = normalize_assigned_assets(employee_dict.get("assigned_assets", []))
        result = db.employees.insert_one(employee_dict)
        employee = Employee(**{**employee_dict, "id": str(result.inserted_id)})
        logger.debug(f"Created employee: {employee.employee_id}")
        return employee
    except DuplicateKeyError:
        logger.error("Employee ID already exists")
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    except Exception as e:
        logger.error(f"Failed to create employee: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create employee")

def update_employee(db: Collection, id: str, employee: EmployeeBase) -> Optional[Employee]:
    try:
        logger.debug(f"Updating employee ID: {id}")
        update_data = employee.dict(exclude_unset=True)
        if "assigned_assets" in update_data:
            update_data["assigned_assets"] = normalize_assigned_assets(update_data["assigned_assets"])
        update_data["updated_at"] = datetime.utcnow()
        result = db.employees.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )
        if result.modified_count == 0:
            logger.warning(f"No changes made to employee ID: {id}")
            return None
        updated_employee = db.employees.find_one({"_id": ObjectId(id)})
        updated_employee["assigned_assets"] = normalize_assigned_assets(updated_employee.get("assigned_assets", []))
        result = Employee(**{**updated_employee, "id": str(updated_employee["_id"])})
        logger.debug(f"Updated employee: {result.employee_id}")
        return result
    except DuplicateKeyError:
        logger.error(f"Employee ID already exists for ID {id}")
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    except Exception as e:
        logger.error(f"Failed to update employee ID {id}: {str(e)}")
        return None

def delete_employee(db: Collection, id: str) -> bool:
    try:
        logger.debug(f"Deleting employee ID: {id}")
        employee = db.employees.find_one({"_id": ObjectId(id)})
        if employee and employee.get("assigned_assets", []):
            logger.error(f"Cannot delete employee with assigned assets: {id}")
            raise HTTPException(status_code=400, detail="Cannot delete employee with assigned assets")
        result = db.employees.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            logger.warning(f"Employee not found for deletion: {id}")
            return False
        logger.debug(f"Deleted employee ID: {id}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete employee ID {id}: {str(e)}")
        return False