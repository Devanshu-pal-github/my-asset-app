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
    RequestComment,
    CommentCreate,
    ApprovalUpdate
)
from app.models.utils import get_current_datetime, serialize_model, generate_uuid

logger = logging.getLogger(__name__)

# Explicitly define collection name to avoid confusion
REQUESTS_COLLECTION = "requests"

def get_requests(db: Union[Database, Collection], filters: Optional[Dict[str, Any]] = None) -> List[RequestResponse]:
    """
    Retrieve requests with optional filtering.
    
    Args:
        db (Union[Database, Collection]): MongoDB database instance or collection
        filters (Optional[Dict[str, Any]]): Filter criteria
        
    Returns:
        List[RequestResponse]: List of requests matching filters
    """
    query = {}
    # Check if db is a Database or Collection
    if isinstance(db, Database):
        collection = db.get_collection(REQUESTS_COLLECTION)
    else:
        collection = db  # db is already the collection
    
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
            sample_doc = collection.find_one()
            if sample_doc and "asset_details" in sample_doc and "asset_id" in sample_doc.get("asset_details", {}):
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

def get_request_by_id(db: Union[Database, Collection], request_id: str) -> Optional[RequestResponse]:
    """
    Retrieve a request by ID.
    
    Args:
        db (Union[Database, Collection]): MongoDB database instance or collection
        request_id (str): ID of the request to retrieve
        
    Returns:
        Optional[RequestResponse]: Request if found, None otherwise
    """
    # Check if db is a Database or Collection
    if isinstance(db, Database):
        collection = db.get_collection(REQUESTS_COLLECTION)
    else:
        collection = db  # db is already the collection
    
    query = {"id": request_id}
    doc = collection.find_one(query)
    
    if not doc:
        logger.warning(f"Request not found: {request_id}")
        return None
    
    return RequestResponse(**doc)

def create_request(db: Union[Database, Collection], request_data: RequestCreate) -> RequestResponse:
    """
    Create a new request.
    
    Args:
        db (Union[Database, Collection]): MongoDB database instance or collection
        request_data (RequestCreate): Request data
        
    Returns:
        RequestResponse: Created request
    """
    # Check if db is a Database or Collection
    if isinstance(db, Database):
        collection = db.get_collection(REQUESTS_COLLECTION)
    else:
        collection = db  # db is already the collection
    
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

def update_request(db: Union[Database, Collection], request_id: str, request_data: RequestUpdate) -> Optional[RequestResponse]:
    """
    Update an existing request.
    
    Args:
        db (Union[Database, Collection]): MongoDB database instance or collection
        request_id (str): ID of the request to update
        request_data (RequestUpdate): Updated request data
        
    Returns:
        Optional[RequestResponse]: Updated request if found, None otherwise
    """
    # Check if db is a Database or Collection
    if isinstance(db, Database):
        collection = db.get_collection(REQUESTS_COLLECTION)
    else:
        collection = db  # db is already the collection
    
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
    
    # Update in MongoDB
    try:
        collection.update_one({"id": request_id}, {"$set": update_data})
        
        # Handle status change side effects if needed
        if status_changed:
            request_type = current_request.get("type")
            asset_details = current_request.get("asset_details", {})
            _handle_status_change(db, request_id, request_type, old_status, new_status, asset_details)
        
        # Get updated document
        updated_request = collection.find_one({"id": request_id})
        
        return RequestResponse(**updated_request)
    except Exception as e:
        logger.error(f"Failed to update request {request_id}: {str(e)}")
        raise

def delete_request(db: Union[Database, Collection], request_id: str) -> bool:
    """
    Delete a request.
    
    Args:
        db (Union[Database, Collection]): MongoDB database instance or collection
        request_id (str): ID of the request to delete
        
    Returns:
        bool: True if successful, False if request not found
    """
    # Check if db is a Database or Collection
    if isinstance(db, Database):
        collection = db.get_collection(REQUESTS_COLLECTION)
    else:
        collection = db  # db is already the collection
    
    # Get request to determine type for side effects
    request = collection.find_one({"id": request_id})
    if not request:
        logger.warning(f"Request not found for deletion: {request_id}")
        return False
    
    # Update linked collections if necessary
    request_type = request.get("type")
    asset_details = request.get("asset_details", {})
    _update_linked_collections(db, request_type, asset_details, "delete")
    
    # Delete the request
    result = collection.delete_one({"id": request_id})
    
    if result.deleted_count == 0:
        logger.warning(f"Request {request_id} was not deleted")
        return False
    
    logger.info(f"Request {request_id} deleted successfully")
    return True

def add_comment(db: Union[Database, Collection], request_id: str, comment_data: RequestComment) -> Optional[RequestResponse]:
    """
    Add a comment to a request.
    
    Args:
        db (Union[Database, Collection]): MongoDB database instance or collection
        request_id (str): ID of the request to add comment to
        comment_data (RequestComment): Comment data
        
    Returns:
        Optional[RequestResponse]: Updated request if found, None otherwise
    """
    # Check if db is a Database or Collection
    if isinstance(db, Database):
        collection = db.get_collection(REQUESTS_COLLECTION)
    else:
        collection = db  # db is already the collection
    
    # Check if request exists
    if not collection.find_one({"id": request_id}):
        logger.warning(f"Request not found for comment: {request_id}")
        return None
    
    # Prepare comment
    comment = {
        "id": generate_uuid(),
        "user_id": comment_data.user_id,
        "user_name": comment_data.user_name,
        "content": comment_data.content,
        "timestamp": get_current_datetime()
    }
    
    # Update the request
    update_result = collection.update_one(
        {"id": request_id},
        {
            "$push": {"comments": comment},
            "$set": {
                "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": get_current_datetime()
            }
        }
    )
    
    if update_result.modified_count == 0:
        logger.warning(f"Failed to add comment to request {request_id}")
        return None
    
    # Get updated request
    updated_request = collection.find_one({"id": request_id})
    return RequestResponse(**updated_request)

def update_approval(db: Union[Database, Collection], request_id: str, approver_id: str, approve: bool, approver_name: Optional[str] = None, notes: Optional[str] = None) -> Optional[RequestResponse]:
    """
    Update approval status for a request.
    
    Args:
        db (Union[Database, Collection]): MongoDB database instance or collection
        request_id (str): ID of the request
        approver_id (str): ID of the approver
        approve (bool): Whether to approve or reject
        approver_name (Optional[str]): Name of the approver (optional)
        notes (Optional[str]): Notes for the approval/rejection (optional)
        
    Returns:
        Optional[RequestResponse]: Updated request if found, None otherwise
    """
    # Check if db is a Database or Collection
    if isinstance(db, Database):
        collection = db.get_collection(REQUESTS_COLLECTION)
    else:
        collection = db  # db is already the collection
    
    # Get current request
    current_request = collection.find_one({"id": request_id})
    if not current_request:
        logger.warning(f"Request not found for approval update: {request_id}")
        return None
    
    # Set the approval status
    status = RequestStatus.APPROVED if approve else RequestStatus.REJECTED
    
    # Find the approver
    approver_found = False
    for i, approver in enumerate(current_request.get("approvers", [])):
        if approver.get("id") == approver_id:
            approver_found = True
            # Update approver status, date and notes
            update_field = f"approvers.{i}.status"
            date_field = f"approvers.{i}.date"
            notes_field = f"approvers.{i}.notes"
            
            update_dict = {
                update_field: status.value,
                date_field: datetime.now().strftime("%Y-%m-%d"),
                "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": get_current_datetime()
            }
            
            if notes:
                update_dict[notes_field] = notes
            
            # Update the document
            try:
                collection.update_one(
                    {"id": request_id},
                    {"$set": update_dict}
                )
                break
            except Exception as e:
                logger.error(f"Failed to update approval status: {str(e)}")
                raise
    
    if not approver_found:
        logger.warning(f"Approver not found in request: {approver_id}")
        return None
    
    # Check if all approvers have approved and update request status if needed
    updated_request = collection.find_one({"id": request_id})
    
    # Update the overall request status based on approvers
    _update_request_status_from_approvers(db, updated_request)
    
    # Get the final updated request
    final_request = collection.find_one({"id": request_id})
    
    return RequestResponse(**final_request)

def _update_request_status_from_approvers(db: Union[Database, Collection], request_doc: Dict[str, Any]) -> None:
    """
    Update the overall request status based on approver statuses.
    
    Args:
        db (Union[Database, Collection]): MongoDB database instance or collection
        request_doc (Dict[str, Any]): Request document
    """
    # Check if db is a Database or Collection
    if isinstance(db, Database):
        collection = db.get_collection(REQUESTS_COLLECTION)
    else:
        collection = db  # db is already the collection
        
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
    db: Union[Database, Collection], 
    request_id: str, 
    request_type: str, 
    old_status: str, 
    new_status: str, 
    asset_details: Dict[str, Any]
) -> None:
    """
    Handle actions needed when a request status changes.
    
    Args:
        db (Union[Database, Collection]): MongoDB database instance or collection
        request_id (str): Request ID
        request_type (str): Type of request
        old_status (str): Previous status
        new_status (str): New status
        asset_details (Dict[str, Any]): Asset details from the request
    """
    # Only handle transitions to APPROVED or REJECTED
    if new_status not in [RequestStatus.APPROVED.value, RequestStatus.REJECTED.value]:
        return
    
    # For asset items collection operations, we need the full database
    from app.dependencies import get_db
    full_db = get_db() if isinstance(db, Collection) else db
    
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
                full_db.asset_items.update_one(
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
                full_db.asset_items.update_one(
                    {"id": asset_id},
                    {"$set": {"status": "available", "assigned_to": None, "assigned_to_name": None}}
                )
            except Exception as e:
                logger.error(f"Failed to update asset status for return: {str(e)}")
                raise

def _update_linked_collections(
    db: Union[Database, Collection], 
    request_type: str, 
    asset_details: Dict[str, Any], 
    action: str
) -> None:
    """
    Update linked collections when creating or deleting requests.
    
    Args:
        db (Union[Database, Collection]): MongoDB database instance or collection
        request_type (str): Type of request
        asset_details (Dict[str, Any]): Asset details from the request
        action (str): "create" or "delete"
    """
    # Implementation depends on specific business logic between collections
    pass 