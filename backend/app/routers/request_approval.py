from fastapi import APIRouter, HTTPException, Depends, Query
from pymongo.database import Database
from typing import List, Optional
from app.dependencies import get_db
from app.models.request_approval import (
    RequestApproval, 
    RequestCreate, 
    RequestUpdate,
    RequestResponse,
    RequestStatus,
    RequestType,
    RequestPriority
)
from app.services.request_service import (
    get_requests,
    get_request_by_id,
    create_request,
    update_request,
    delete_request
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/requests", tags=["Requests"])

@router.get("/", response_model=List[RequestResponse])
async def read_requests(
    request_type: Optional[RequestType] = None,
    status: Optional[RequestStatus] = None,
    priority: Optional[RequestPriority] = None,
    requester_id: Optional[str] = None,
    asset_id: Optional[str] = None,
    created_after: Optional[str] = None,
    created_before: Optional[str] = None,
    db: Database = Depends(get_db)
):
    """
    Retrieve all requests with optional filters.
    
    Args:
        request_type (Optional[RequestType]): Filter by request type
        status (Optional[RequestStatus]): Filter by request status
        priority (Optional[RequestPriority]): Filter by priority
        requester_id (Optional[str]): Filter by requester ID
        asset_id (Optional[str]): Filter by asset ID
        created_after (Optional[str]): Filter by created date (after)
        created_before (Optional[str]): Filter by created date (before)
        db (Database): MongoDB database instance, injected via dependency
        
    Returns:
        List[RequestResponse]: List of requests matching the filters
        
    Raises:
        HTTPException: 500 for server errors
    """
    logger.info(f"Fetching requests - type: {request_type}, status: {status}, priority: {priority}")
    try:
        filters = {}
        if request_type:
            filters["request_type"] = request_type
        if status:
            filters["status"] = status
        if priority:
            filters["priority"] = priority
        if requester_id:
            filters["requester_id"] = requester_id
        if asset_id:
            filters["asset_id"] = asset_id
        if created_after:
            filters["created_after"] = created_after
        if created_before:
            filters["created_before"] = created_before
            
        requests = get_requests(db, filters)
        logger.debug(f"Fetched {len(requests)} requests")
        return requests
    except Exception as e:
        logger.error(f"Failed to fetch requests: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch requests: {str(e)}")

@router.get("/{request_id}", response_model=RequestResponse)
async def read_request(request_id: str, db: Database = Depends(get_db)):
    """
    Retrieve a specific request by ID.
    
    Args:
        request_id (str): Request ID
        db (Database): MongoDB database instance, injected via dependency
        
    Returns:
        RequestResponse: Request details
        
    Raises:
        HTTPException: 404 if request not found, 400 for invalid ID, 500 for server errors
    """
    logger.info(f"Fetching request with ID: {request_id}")
    try:
        request = get_request_by_id(db, request_id)
        if not request:
            logger.warning(f"Request not found: {request_id}")
            raise HTTPException(status_code=404, detail="Request not found")
            
        logger.debug(f"Found request: {request.request_id}")
        return request
    except ValueError as ve:
        logger.warning(f"Invalid request ID: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to fetch request {request_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch request: {str(e)}")

@router.post("/", response_model=RequestResponse)
async def create_new_request(request: RequestCreate, db: Database = Depends(get_db)):
    """
    Create a new request.
    
    Args:
        request (RequestCreate): Request details
        db (Database): MongoDB database instance, injected via dependency
        
    Returns:
        RequestResponse: Created request details
        
    Raises:
        HTTPException: 400 for validation errors, 500 for server errors
    """
    logger.info(f"Creating request for asset: {request.asset_id}")
    try:
        created_request = create_request(db, request)
        logger.debug(f"Created request with ID: {created_request.request_id}")
        return created_request
    except ValueError as ve:
        logger.warning(f"Failed to create request: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to create request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create request: {str(e)}")

@router.put("/{request_id}", response_model=RequestResponse)
async def update_existing_request(request_id: str, request: RequestUpdate, db: Database = Depends(get_db)):
    """
    Update an existing request.
    
    Args:
        request_id (str): Request ID to update
        request (RequestUpdate): Updated request details
        db (Database): MongoDB database instance, injected via dependency
        
    Returns:
        RequestResponse: Updated request details
        
    Raises:
        HTTPException: 404 if request not found, 400 for validation errors, 500 for server errors
    """
    logger.info(f"Updating request with ID: {request_id}")
    try:
        updated_request = update_request(db, request_id, request)
        if not updated_request:
            logger.warning(f"Request not found: {request_id}")
            raise HTTPException(status_code=404, detail="Request not found")
            
        logger.debug(f"Updated request: {updated_request.request_id}")
        return updated_request
    except ValueError as ve:
        logger.warning(f"Failed to update request: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to update request {request_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update request: {str(e)}")

@router.delete("/{request_id}", response_model=dict)
async def delete_existing_request(request_id: str, db: Database = Depends(get_db)):
    """
    Delete a request.
    
    Args:
        request_id (str): Request ID to delete
        db (Database): MongoDB database instance, injected via dependency
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 404 if request not found, 400 for validation errors, 500 for server errors
    """
    logger.info(f"Deleting request with ID: {request_id}")
    try:
        deleted = delete_request(db, request_id)
        if not deleted:
            logger.warning(f"Request not found: {request_id}")
            raise HTTPException(status_code=404, detail="Request not found")
            
        logger.debug(f"Deleted request ID: {request_id}")
        return {"message": "Request deleted successfully"}
    except ValueError as ve:
        logger.warning(f"Cannot delete request: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to delete request {request_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete request: {str(e)}") 