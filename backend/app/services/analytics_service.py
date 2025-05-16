from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from pymongo import ASCENDING, DESCENDING
from pymongo.database import Database
from pymongo.errors import OperationFailure
import logging

logger = logging.getLogger(__name__)

def get_asset_analytics(
    db: Database,
    time_frame: str = "year",
    page: int = 1,
    limit: int = 1000
) -> Dict[str, Any]:
    """
    Get comprehensive asset analytics optimized for large datasets
    - Uses MongoDB aggregation pipeline for efficient processing
    - Implements server-side pagination and sampling for time series data
    - Returns categorized analytics data for visualization
    """
    logger.debug(f"Getting asset analytics with time frame: {time_frame}, page: {page}, limit: {limit}")
    
    # Calculate date range based on time frame
    now = datetime.now()
    if time_frame == "month":
        start_date = now - timedelta(days=30)
    elif time_frame == "quarter":
        start_date = now - timedelta(days=90) 
    elif time_frame == "year":
        start_date = now - timedelta(days=365)
    else:  # "all"
        start_date = now - timedelta(days=3650)  # ~10 years
    
    try:
        # Get asset categories with counts and values - optimized for large datasets
        pipeline_categories = [
            {"$lookup": {
                "from": "asset_items",
                "localField": "id",
                "foreignField": "category_id",
                "as": "assets"
            }},
            {"$project": {
                "name": 1,
                "count": {"$size": "$assets"},
                "value": {"$sum": "$assets.purchase_price"}
            }},
            {"$sort": {"value": -1}}
        ]
        
        categories = list(db.asset_categories.aggregate(pipeline_categories))
        
        # Get asset status distribution - optimized for large datasets
        pipeline_status = [
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "value": {"$sum": "$purchase_price"}
            }},
            {"$sort": {"count": -1}}
        ]
        
        statuses = list(db.asset_items.aggregate(pipeline_status))
        statuses = [{"status": s["_id"], "count": s["count"], "value": s["value"]} for s in statuses]
        
        # Get asset acquisition over time with pagination
        # For large datasets, this uses date bucketing and sampling
        pipeline_acquisition = [
            {"$match": {"purchase_date": {"$gte": start_date}}},
            {"$project": {
                "year_month": {"$dateToString": {"format": "%Y-%m", "date": "$purchase_date"}},
                "purchase_price": 1
            }},
            {"$group": {
                "_id": "$year_month",
                "count": {"$sum": 1},
                "value": {"$sum": "$purchase_price"}
            }},
            {"$sort": {"_id": 1}}
        ]
        
        # Get full result count for pagination
        total_months = len(list(db.asset_items.aggregate(pipeline_acquisition)))
        
        # Apply pagination 
        pipeline_acquisition.extend([
            {"$skip": (page - 1) * limit},
            {"$limit": limit}
        ])
        
        acquisitions = list(db.asset_items.aggregate(pipeline_acquisition))
        acquisitions = [{"month": a["_id"], "count": a["count"], "value": a["value"]} for a in acquisitions]
        
        # Get asset age distribution
        pipeline_age = [
            {"$project": {
                "age_days": {"$divide": [
                    {"$subtract": [datetime.now(), "$purchase_date"]}, 
                    24 * 60 * 60 * 1000  # Convert milliseconds to days
                ]}
            }},
            {"$bucket": {
                "groupBy": "$age_days",
                "boundaries": [0, 365, 730, 1095, 1460, 3650],  # 0-1 yr, 1-2, 2-3, 3-4, 4+
                "default": "4+ years",
                "output": {
                    "count": {"$sum": 1}
                }
            }}
        ]
        
        age_results = list(db.asset_items.aggregate(pipeline_age))
        
        # Calculate total assets for percentage
        total_assets = sum(age["count"] for age in age_results)
        
        # Format age results
        asset_age = []
        age_ranges = ["0-1 years", "1-2 years", "2-3 years", "3-4 years", "4+ years"]
        
        for i, age in enumerate(age_results):
            age_range = age_ranges[i] if i < len(age_ranges) else "4+ years"
            count = age["count"]
            percentage = (count / total_assets * 100) if total_assets > 0 else 0
            
            asset_age.append({
                "age_range": age_range,
                "count": count,
                "percentage": round(percentage, 1)
            })
        
        # Get total asset count and value
        total_count = db.asset_items.count_documents({})
        total_value_pipeline = [
            {"$group": {"_id": None, "total": {"$sum": "$purchase_price"}}}
        ]
        total_value_result = list(db.asset_items.aggregate(total_value_pipeline))
        total_value = total_value_result[0]["total"] if total_value_result else 0
        
        return {
            "data": {
                "categories": categories,
                "statuses": statuses,
                "acquisitions": acquisitions,
                "asset_age": asset_age,
                "total_assets": total_count,
                "total_value": total_value
            },
            "page": page,
            "total_pages": (total_months + limit - 1) // limit,
            "total_count": total_months,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Error getting asset analytics: {str(e)}", exc_info=True)
        raise


def get_department_analytics(
    db: Database,
    time_frame: str = "year",
    page: int = 1,
    limit: int = 1000
) -> Dict[str, Any]:
    """
    Get department-based asset analytics
    - Optimized for organizations with many departments
    - Implements server-side pagination and filtering
    """
    logger.debug(f"Getting department analytics with time frame: {time_frame}, page: {page}, limit: {limit}")
    
    try:
        # Calculate date range based on time frame for filtering assets
        now = datetime.now()
        if time_frame == "month":
            start_date = now - timedelta(days=30)
        elif time_frame == "quarter":
            start_date = now - timedelta(days=90) 
        elif time_frame == "year":
            start_date = now - timedelta(days=365)
        else:  # "all"
            start_date = now - timedelta(days=3650)  # ~10 years
        
        # For large datasets with many departments, we need to optimize the query
        # Use an aggregation pipeline with lookup and pagination
        
        # First, find active assignments to join with employees and departments
        pipeline = [
            # Get all current assignments (where return_date is null)
            {"$match": {"return_date": None}},
            
            # Lookup employee information
            {"$lookup": {
                "from": "employees",
                "localField": "employee_id",
                "foreignField": "id",
                "as": "employee"
            }},
            
            # Lookup asset information
            {"$lookup": {
                "from": "asset_items",
                "localField": "asset_id",
                "foreignField": "id",
                "as": "asset"
            }},
            
            # Filter assets by purchase date if needed
            {"$match": {"asset.purchase_date": {"$gte": start_date}}},
            
            # Group by department
            {"$group": {
                "_id": "$employee.department",
                "count": {"$sum": 1},
                "value": {"$sum": {"$arrayElemAt": ["$asset.purchase_price", 0]}}
            }},
            
            # Sort by value in descending order
            {"$sort": {"value": -1}},
        ]
        
        # Get total count for pagination
        total_departments = len(list(db.assignment_history.aggregate(pipeline)))
        
        # Apply pagination
        pipeline.extend([
            {"$skip": (page - 1) * limit},
            {"$limit": limit}
        ])
        
        # Execute the aggregation
        departments_result = list(db.assignment_history.aggregate(pipeline))
        
        # Format the response
        departments = []
        for dept in departments_result:
            department_name = dept["_id"][0] if isinstance(dept["_id"], list) and len(dept["_id"]) > 0 else "Unassigned"
            departments.append({
                "department": department_name,
                "count": dept["count"],
                "value": dept["value"]
            })
        
        return {
            "departments": departments,
            "page": page,
            "total_pages": (total_departments + limit - 1) // limit,
            "total_count": total_departments,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Error getting department analytics: {str(e)}", exc_info=True)
        raise


def get_maintenance_analytics(
    db: Database,
    time_frame: str = "year",
    page: int = 1,
    limit: int = 1000
) -> Dict[str, Any]:
    """
    Get maintenance statistics and cost analytics
    - Optimized for large maintenance history datasets
    - Implements time-based aggregation and pagination
    """
    logger.debug(f"Getting maintenance analytics with time frame: {time_frame}, page: {page}, limit: {limit}")
    
    try:
        # Calculate date range based on time frame
        now = datetime.now()
        if time_frame == "month":
            start_date = now - timedelta(days=30)
        elif time_frame == "quarter":
            start_date = now - timedelta(days=90) 
        elif time_frame == "year":
            start_date = now - timedelta(days=365)
        else:  # "all"
            start_date = now - timedelta(days=3650)  # ~10 years
            
        # Use date aggregation to group maintenance records by month
        pipeline = [
            # Filter by date range
            {"$match": {"maintenance_date": {"$gte": start_date}}},
            
            # Group by year-month
            {"$project": {
                "year_month": {"$dateToString": {"format": "%Y-%m", "date": "$maintenance_date"}},
                "cost": "$cost"
            }},
            
            {"$group": {
                "_id": "$year_month",
                "count": {"$sum": 1},
                "cost": {"$sum": "$cost"}
            }},
            
            # Sort chronologically
            {"$sort": {"_id": 1}}
        ]
        
        # Get full result count for pagination
        total_months = len(list(db.maintenance_history.aggregate(pipeline)))
        
        # Apply pagination
        pipeline.extend([
            {"$skip": (page - 1) * limit},
            {"$limit": limit}
        ])
        
        # Execute aggregation
        maintenance_data = list(db.maintenance_history.aggregate(pipeline))
        
        # Format results
        formatted_data = []
        for item in maintenance_data:
            formatted_data.append({
                "month": item["_id"],
                "count": item["count"],
                "cost": item["cost"]
            })
            
        # Calculate totals
        pipeline_totals = [
            {"$match": {"maintenance_date": {"$gte": start_date}}},
            {"$group": {
                "_id": None,
                "total_count": {"$sum": 1},
                "total_cost": {"$sum": "$cost"}
            }}
        ]
        
        totals_result = list(db.maintenance_history.aggregate(pipeline_totals))
        total_records = totals_result[0]["total_count"] if totals_result else 0
        total_cost = totals_result[0]["total_cost"] if totals_result else 0
        
        return {
            "maintenance_data": formatted_data,
            "total_records": total_records,
            "total_cost": total_cost,
            "page": page,
            "total_pages": (total_months + limit - 1) // limit,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Error getting maintenance analytics: {str(e)}", exc_info=True)
        raise


def get_employee_asset_analytics(
    db: Database,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "value",
    sort_order: str = "desc"
) -> Dict[str, Any]:
    """
    Get employee asset allocation statistics
    - Optimized for organizations with many employees
    - Implements sorting, filtering, and pagination
    """
    logger.debug(f"Getting employee asset analytics with page: {page}, limit: {limit}, sort_by: {sort_by}, sort_order: {sort_order}")
    
    try:
        # Define sort field and direction
        sort_direction = DESCENDING if sort_order.lower() == "desc" else ASCENDING
        
        # Map sort_by values to the appropriate field
        sort_field_map = {
            "name": "name",
            "department": "department",
            "assets": "assets_count",
            "value": "assets_value"
        }
        
        mongodb_sort_field = sort_field_map.get(sort_by, "assets_value")
        
        # Use aggregation pipeline to get employees with their asset counts and values
        pipeline = [
            # Start with employees
            {"$project": {
                "name": {"$concat": ["$first_name", " ", "$last_name"]},
                "department": 1,
                "employee_id": 1
            }},
            
            # Lookup active assignments for this employee
            {"$lookup": {
                "from": "assignment_history",
                "let": {"employee_id": "$id"},
                "pipeline": [
                    {"$match": {
                        "$expr": {
                            "$and": [
                                {"$eq": ["$employee_id", "$$employee_id"]},
                                {"$eq": ["$return_date", None]}  # Active assignments only
                            ]
                        }
                    }},
                    # Lookup asset details
                    {"$lookup": {
                        "from": "asset_items",
                        "localField": "asset_id",
                        "foreignField": "id",
                        "as": "asset"
                    }},
                ],
                "as": "assignments"
            }},
            
            # Calculate asset count and total value
            {"$addFields": {
                "assets_count": {"$size": "$assignments"},
                "assets_value": {
                    "$sum": {
                        "$map": {
                            "input": "$assignments",
                            "as": "assignment",
                            "in": {
                                "$ifNull": [
                                    {"$arrayElemAt": ["$$assignment.asset.purchase_price", 0]},
                                    0
                                ]
                            }
                        }
                    }
                }
            }},
            
            # Project final fields needed for the result
            {"$project": {
                "_id": 0,
                "id": "$id",
                "name": 1,
                "department": 1,
                "assets": "$assets_count",
                "value": "$assets_value"
            }},
            
            # Sort as requested
            {"$sort": {mongodb_sort_field: sort_direction}}
        ]
        
        # Get total count for pagination
        total_employees = db.employees.count_documents({})
        
        # Apply pagination
        pipeline.extend([
            {"$skip": (page - 1) * limit},
            {"$limit": limit}
        ])
        
        # Execute the aggregation
        employees_result = list(db.employees.aggregate(pipeline))
        
        return {
            "employees": employees_result,
            "page": page,
            "total_pages": (total_employees + limit - 1) // limit,
            "total_count": total_employees,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Error getting employee asset analytics: {str(e)}", exc_info=True)
        raise 