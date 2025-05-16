from pymongo.database import Database
from pymongo.collection import Collection
from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from pymongo.errors import OperationFailure
import logging
from app.models.request_approval import (
    Request, 
    RequestCreate, 
    RequestUpdate, 
    RequestResponse,
    RequestStatus,
    RequestType,
    RequestPriority,
    CommentCreate,
    ApprovalUpdate
)
from app.models.utils import get_current_datetime, serialize_model, generate_uuid

logger = logging.getLogger(__name__)

COLLECTION_NAME = "requests"

def get_requests(db: Database, filters: Optional[Dict[str, Any]] = None) -> List[RequestResponse]:
    """
    Retrieve requests with optional filtering.
    
    Args:
        db (Database): MongoDB database instance
        filters (Optional[Dict[str, Any]]): Filter criteria
        
    Returns:
        List[RequestResponse]: List of requests matching filters
    """
    query = {}
    collection = db[COLLECTION_NAME]
    
    # Handle special filters
    if filters:
        # Basic filters
        if "request_type" in filters:
            query["type"] = filters["request_type"]
        
        if "status" in filters:
            query["status"] = filters["status"]
            
        if "priority" in filters:
            query["priority"] = filters["priority"]
            
        if "requester_id" in filters:
            query["requestor.id"] = filters["requester_id"]
            
        if "asset_id" in filters:
            # For requests related to specific assets
            if "asset_details.asset_id" in collection.find_one() or {}:
                query["asset_details.asset_id"] = filters["asset_id"]
            else:
                # Try checking in linked_assets array
                query["linked_assets"] = filters["asset_id"]
                
        # Date range filters
        if "created_after" in filters:
            try:
                after_date = datetime.fromisoformat(filters["created_after"].replace("Z", "+00:00"))
                query["created_at"] = {"$gte": after_date}
            except (ValueError, TypeError):
                logger.warning(f"Invalid created_after date format: {filters['created_after']}")
                
        if "created_before" in filters:
            try:
                before_date = datetime.fromisoformat(filters["created_before"].replace("Z", "+00:00"))
                if "created_at" in query:
                    query["created_at"]["$lte"] = before_date
                else:
                    query["created_at"] = {"$lte": before_date}
            except (ValueError, TypeError):
                logger.warning(f"Invalid created_before date format: {filters['created_before']}")
    
    logger.debug(f"Fetching requests with query: {query}")
    cursor = collection.find(query).sort("created_at", -1)  # Most recent first
    
    requests = []
    for doc in cursor:
        # No need to convert id as we're now using UUID-based string IDs
        requests.append(RequestResponse(**doc))
    
    return requests

def get_request_by_id(db: Database, request_id: str) -> Optional[RequestResponse]:
    """
    Retrieve a request by ID.
    
    Args:
        db (Database): MongoDB database instance
        request_id (str): ID of the request to retrieve
        
    Returns:
        Optional[RequestResponse]: Request if found, None otherwise
    """
    collection = db[COLLECTION_NAME]
    
    query = {"id": request_id}
    doc = collection.find_one(query)
    
    if not doc:
        logger.warning(f"Request not found: {request_id}")
        return None
    
    return RequestResponse(**doc)

def create_request(db: Database, request_data: RequestCreate) -> RequestResponse:
    """
    Create a new request.
    
    Args:
        db (Database): MongoDB database instance
        request_data (RequestCreate): Request data
        
    Returns:
        RequestResponse: Created request
    """
    collection = db[COLLECTION_NAME]
    
    # Create new request with generated ID
    request = Request(
        type=request_data.type,
        title=request_data.title,
        requestor=request_data.requestor,
        date_submitted=request_data.date_submitted or datetime.now().strftime("%Y-%m-%d"),
        status=request_data.status,
        priority=request_data.priority,
        asset_details=request_data.asset_details,
        description=request_data.description,
        category=request_data.category,
        department=request_data.department,
        location=request_data.location,
        due_date=request_data.due_date,
        approvers=request_data.approvers or [],
        comments=request_data.comments or [],
    )
    
    # Set last_updated field
    request.last_updated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Convert to dict for MongoDB
    request_dict = serialize_model(request)
    
    # Insert into MongoDB - id is already a UUID string, so no need to use _id
    try:
        result = collection.insert_one(request_dict)
        
        # Update linked collections based on request type
        _update_linked_collections(db, request.type, request.asset_details, "create")
        
        # Retrieve the inserted document
        inserted_request = collection.find_one({"id": request.id})
        
        return RequestResponse(**inserted_request)
    except Exception as e:
        logger.error(f"Failed to create request: {str(e)}")
        raise

def update_request(db: Database, request_id: str, request_data: RequestUpdate) -> Optional[RequestResponse]:
    """
    Update an existing request.
    
    Args:
        db (Database): MongoDB database instance
        request_id (str): ID of the request to update
        request_data (RequestUpdate): Updated request data
        
    Returns:
        Optional[RequestResponse]: Updated request if found, None otherwise
    """
    collection = db[COLLECTION_NAME]
    
    # Get current request
    current_request = collection.find_one({"id": request_id})
    if not current_request:
        logger.warning(f"Request not found for update: {request_id}")
        return None
    
    # Prepare update dictionary with only fields that are not None
    update_data = {k: v for k, v in request_data.model_dump().items() if v is not None}
    
    # Set last_updated field
    update_data["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    update_data["updated_at"] = get_current_datetime()
    
    # Status change handling
    status_changed = False
    old_status = current_request.get("status")
    new_status = update_data.get("status")
    
    if new_status and new_status != old_status:
        status_changed = True
        # If status changed to completed or rejected, set completed_date
        if new_status in [RequestStatus.APPROVED.value, RequestStatus.REJECTED.value]:
            update_data["completed_date"] = datetime.now().strftime("%Y-%m-%d")
    
    # Update the document
    try:
        result = collection.update_one(
            {"id": request_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            logger.warning(f"Request not found for update: {request_id}")
            return None
        
        # Handle status change actions
        if status_changed:
            request_type = current_request.get("type")
            asset_details = current_request.get("asset_details", {})
            _handle_status_change(db, request_id, request_type, old_status, new_status, asset_details)
        
        # Retrieve the updated document
        updated_request = collection.find_one({"id": request_id})
        
        return RequestResponse(**updated_request)
    except Exception as e:
        logger.error(f"Failed to update request: {str(e)}")
        raise

def delete_request(db: Database, request_id: str) -> bool:
    """
    Delete a request.
    
    Args:
        db (Database): MongoDB database instance
        request_id (str): ID of the request to delete
        
    Returns:
        bool: True if deleted, False if not found
    """
    collection = db[COLLECTION_NAME]
    
    # Get current request to know its type and details
    current_request = collection.find_one({"id": request_id})
    if not current_request:
        logger.warning(f"Request not found for deletion: {request_id}")
        return False
    
    # Delete the document
    try:
        result = collection.delete_one({"id": request_id})
        
        if result.deleted_count == 0:
            logger.warning(f"Request not found for deletion: {request_id}")
            return False
        
        # Update linked collections if needed
        if current_request.get("status") == RequestStatus.PENDING.value:
            request_type = current_request.get("type")
            asset_details = current_request.get("asset_details", {})
            _update_linked_collections(db, request_type, asset_details, "delete")
        
        return True
    except Exception as e:
        logger.error(f"Failed to delete request: {str(e)}")
        raise

def add_comment(db: Database, comment_data: CommentCreate) -> Optional[RequestResponse]:
    """
    Add a comment to a request.
    
    Args:
        db (Database): MongoDB database instance
        comment_data (CommentCreate): Comment data
        
    Returns:
        Optional[RequestResponse]: Updated request if found, None otherwise
    """
    collection = db[COLLECTION_NAME]
    
    # Create comment with generated ID and current date
    comment = {
        "id": generate_uuid(),
        "author": comment_data.author,
        "content": comment_data.content,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "author_id": comment_data.author_id,
        "author_role": comment_data.author_role
    }
    
    # Update the document
    try:
        result = collection.update_one(
            {"id": comment_data.request_id},
            {
                "$push": {"comments": comment},
                "$set": {
                    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": get_current_datetime()
                }
            }
        )
        
        if result.matched_count == 0:
            logger.warning(f"Request not found for adding comment: {comment_data.request_id}")
            return None
        
        # Retrieve the updated document
        updated_request = collection.find_one({"id": comment_data.request_id})
        
        return RequestResponse(**updated_request)
    except Exception as e:
        logger.error(f"Failed to add comment: {str(e)}")
        raise

def update_approval(db: Database, approval_data: ApprovalUpdate) -> Optional[RequestResponse]:
    """
    Update approval status for a request.
    
    Args:
        db (Database): MongoDB database instance
        approval_data (ApprovalUpdate): Approval update data
        
    Returns:
        Optional[RequestResponse]: Updated request if found, None otherwise
    """
    collection = db[COLLECTION_NAME]
    
    # Get current request
    current_request = collection.find_one({"id": approval_data.request_id})
    if not current_request:
        logger.warning(f"Request not found for approval update: {approval_data.request_id}")
        return None
    
    # Find the approver
    approver_found = False
    for i, approver in enumerate(current_request.get("approvers", [])):
        if approver.get("id") == approval_data.approver_id:
            approver_found = True
            # Update approver status, date and notes
            update_field = f"approvers.{i}.status"
            date_field = f"approvers.{i}.date"
            notes_field = f"approvers.{i}.notes"
            
            update_dict = {
                update_field: approval_data.status.value,
                date_field: datetime.now().strftime("%Y-%m-%d"),
                "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": get_current_datetime()
            }
            
            if approval_data.notes:
                update_dict[notes_field] = approval_data.notes
            
            # Update the document
            try:
                collection.update_one(
                    {"id": approval_data.request_id},
                    {"$set": update_dict}
                )
                break
            except Exception as e:
                logger.error(f"Failed to update approval status: {str(e)}")
                raise
    
    if not approver_found:
        logger.warning(f"Approver not found in request: {approval_data.approver_id}")
        return None
    
    # Check if all approvers have approved and update request status if needed
    updated_request = collection.find_one({"id": approval_data.request_id})
    
    # Update the overall request status based on approvers
    _update_request_status_from_approvers(db, updated_request)
    
    # Get the final updated request
    final_request = collection.find_one({"id": approval_data.request_id})
    
    return RequestResponse(**final_request)

def _update_request_status_from_approvers(db: Database, request_doc: Dict[str, Any]) -> None:
    """
    Update the overall request status based on approver statuses.
    
    Args:
        db (Database): MongoDB database instance
        request_doc (Dict[str, Any]): Request document
    """
    collection = db[COLLECTION_NAME]
    request_id = request_doc.get("id")
    approvers = request_doc.get("approvers", [])
    
    if not approvers:
        return
    
    # Check if any approver rejected
    rejected = any(approver.get("status") == RequestStatus.REJECTED.value for approver in approvers)
    
    if rejected:
        # If any approver rejected, request is rejected
        try:
            collection.update_one(
                {"id": request_id},
                {
                    "$set": {
                        "status": RequestStatus.REJECTED.value,
                        "completed_date": datetime.now().strftime("%Y-%m-%d"),
                        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "updated_at": get_current_datetime()
                    }
                }
            )
            
            # Handle rejection actions
            _handle_status_change(
                db, 
                request_id, 
                request_doc.get("type"), 
                request_doc.get("status"), 
                RequestStatus.REJECTED.value, 
                request_doc.get("asset_details", {})
            )
        except Exception as e:
            logger.error(f"Failed to update request status to rejected: {str(e)}")
            raise
        return
    
    # Check if all approvers approved
    all_approved = all(approver.get("status") == RequestStatus.APPROVED.value for approver in approvers)
    
    if all_approved:
        # If all approvers approved, request is approved
        try:
            collection.update_one(
                {"id": request_id},
                {
                    "$set": {
                        "status": RequestStatus.APPROVED.value,
                        "completed_date": datetime.now().strftime("%Y-%m-%d"),
                        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "updated_at": get_current_datetime()
                    }
                }
            )
            
            # Handle approval actions
            _handle_status_change(
                db, 
                request_id, 
                request_doc.get("type"), 
                request_doc.get("status"), 
                RequestStatus.APPROVED.value, 
                request_doc.get("asset_details", {})
            )
        except Exception as e:
            logger.error(f"Failed to update request status to approved: {str(e)}")
            raise

def _handle_status_change(
    db: Database, 
    request_id: str, 
    request_type: str, 
    old_status: str, 
    new_status: str, 
    asset_details: Dict[str, Any]
) -> None:
    """
    Handle actions needed when a request status changes.
    
    Args:
        db (Database): MongoDB database instance
        request_id (str): Request ID
        request_type (str): Type of request
        old_status (str): Previous status
        new_status (str): New status
        asset_details (Dict[str, Any]): Asset details from the request
    """
    # Only handle transitions to APPROVED or REJECTED
    if new_status not in [RequestStatus.APPROVED.value, RequestStatus.REJECTED.value]:
        return
    
    if request_type == RequestType.ASSET_REQUEST.value and new_status == RequestStatus.APPROVED.value:
        # For approved asset requests, potentially create a new asset
        logger.info(f"Asset request {request_id} approved - follow-up actions may be needed")
        # Implementation would depend on asset creation workflow
        
    elif request_type == RequestType.MAINTENANCE_APPROVAL.value and new_status == RequestStatus.APPROVED.value:
        # For approved maintenance requests, update asset status
        asset_id = asset_details.get("asset_id")
        if asset_id:
            logger.info(f"Maintenance request {request_id} approved for asset {asset_id}")
            # Update asset status to scheduled for maintenance
            try:
                db.asset_items.update_one(
                    {"id": asset_id},
                    {"$set": {"status": "under_maintenance"}}
                )
            except Exception as e:
                logger.error(f"Failed to update asset status for maintenance: {str(e)}")
                raise
            
    elif request_type == RequestType.ASSIGNMENT_APPROVAL.value and new_status == RequestStatus.APPROVED.value:
        # For approved assignment requests, initiate assignment process
        items = asset_details.get("items", [])
        if items:
            logger.info(f"Assignment request {request_id} approved for {len(items)} items")
            # Implementation would depend on assignment workflow
            
    elif request_type == RequestType.PURCHASE_APPROVAL.value and new_status == RequestStatus.APPROVED.value:
        # For approved purchase requests, potentially initiate procurement
        logger.info(f"Purchase request {request_id} approved - follow-up actions may be needed")
        # Implementation would depend on purchasing workflow
            
    elif request_type == RequestType.ASSET_RETURN.value and new_status == RequestStatus.APPROVED.value:
        # For approved return requests, update asset status
        asset_id = asset_details.get("asset_id")
        if asset_id:
            logger.info(f"Asset return request {request_id} approved for asset {asset_id}")
            # Update asset status to available
            try:
                db.asset_items.update_one(
                    {"id": asset_id},
                    {"$set": {"status": "available", "assigned_to": None, "assigned_to_name": None}}
                )
            except Exception as e:
                logger.error(f"Failed to update asset status for return: {str(e)}")
                raise

def _update_linked_collections(
    db: Database, 
    request_type: str, 
    asset_details: Dict[str, Any], 
    action: str
) -> None:
    """
    Update linked collections when creating or deleting requests.
    
    Args:
        db (Database): MongoDB database instance
        request_type (str): Type of request
        asset_details (Dict[str, Any]): Asset details from the request
        action (str): "create" or "delete"
    """
    # Implementation depends on specific business logic between collections
    pass 