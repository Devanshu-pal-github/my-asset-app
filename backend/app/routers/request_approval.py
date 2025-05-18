from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pymongo.database import Database
from pymongo.errors import PyMongoError
from app.database import get_database
from app.models.request_approval import (
    Request,
    RequestCreate,
    RequestUpdate,
    RequestResponse,
    RequestType,
    RequestStatus,
    RequestPriority,
    RequestComment
)
from app.services import request_service
import logging
from datetime import datetime
from app.dependencies import get_requests_collection

router = APIRouter(
    prefix="/requests",
    tags=["requests"]
)

logger = logging.getLogger(__name__)

@router.get("/", response_model=List[RequestResponse])
async def read_requests(
    request_type: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    requester_id: Optional[str] = None,
    asset_id: Optional[str] = None,
    created_after: Optional[str] = None,
    created_before: Optional[str] = None,
    collection: Database = Depends(get_requests_collection)
):
    """
    Get requests with optional filtering.
    
    Args:
        request_type: Filter by request type
        status: Filter by status
        priority: Filter by priority
        requester_id: Filter by requester ID
        asset_id: Filter by associated asset ID
        created_after: Filter by creation date (after this date)
        created_before: Filter by creation date (before this date)
        collection: Requests collection
        
    Returns:
        List of RequestResponse objects
    
    Raises:
        HTTPException: If there's an error processing the request
    """
    logger.info(f"GET /requests/ - type: {request_type}, status: {status}, priority: {priority}")
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
            
        # Date range filters
        date_filter = {}
        if created_after:
            date_filter["$gte"] = created_after
        if created_before:
            date_filter["$lte"] = created_before
        if date_filter:
            filters["created_at"] = date_filter
            
        requests = request_service.get_requests(collection, filters)
        return requests
    except Exception as e:
        logger.error(f"Error in read_requests: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{request_id}", response_model=Request)
async def read_request(
    request_id: str,
    collection: Database = Depends(get_requests_collection)
):
    """
    Get a specific request by ID.
    
    Args:
        request_id: The request ID
        collection: Requests collection
        
    Returns:
        Request object
    
    Raises:
        HTTPException: If request not found or there's an error processing the request
    """
    logger.info(f"GET /requests/{request_id}")
    try:
        request = request_service.get_request_by_id(collection, request_id)
        if not request:
            logger.warning(f"Request not found: {request_id}")
            raise HTTPException(status_code=404, detail="Request not found")
        return request
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in read_request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Request, status_code=201)
async def create_new_request(
    request: RequestCreate,
    collection: Database = Depends(get_requests_collection)
):
    """
    Create a new request.
    
    Args:
        request: Request creation data
        collection: Requests collection
        
    Returns:
        Created Request object
    
    Raises:
        HTTPException: If there's an error processing the request or validation fails
    """
    logger.info(f"POST /requests/ - type: {request.request_type}, asset_id: {request.asset_id}")
    try:
        result = request_service.create_request(collection, request)
        return result
    except ValueError as e:
        logger.warning(f"Validation error in create_new_request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except PyMongoError as e:
        logger.error(f"Database error in create_new_request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error in create_new_request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{request_id}", response_model=Request)
async def update_existing_request(
    request_id: str,
    update: RequestUpdate,
    collection: Database = Depends(get_requests_collection)
):
    """
    Update an existing request.
    
    Args:
        request_id: The request ID to update
        update: Request update data
        collection: Requests collection
        
    Returns:
        Updated Request object
    
    Raises:
        HTTPException: If request not found or there's an error processing the request
    """
    logger.info(f"PUT /requests/{request_id}")
    try:
        result = request_service.update_request(collection, request_id, update)
        if not result:
            logger.warning(f"Request not found: {request_id}")
            raise HTTPException(status_code=404, detail="Request not found")
        return result
    except ValueError as e:
        logger.warning(f"Validation error in update_existing_request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except PyMongoError as e:
        logger.error(f"Database error in update_existing_request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error in update_existing_request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{request_id}", status_code=204)
async def delete_existing_request(
    request_id: str,
    collection: Database = Depends(get_requests_collection)
):
    """
    Delete a request.
    
    Args:
        request_id: The request ID to delete
        collection: Requests collection
    
    Raises:
        HTTPException: If request not found or there's an error processing the request
    """
    logger.info(f"DELETE /requests/{request_id}")
    try:
        result = request_service.delete_request(collection, request_id)
        if not result:
            logger.warning(f"Request not found: {request_id}")
            raise HTTPException(status_code=404, detail="Request not found")
    except PyMongoError as e:
        logger.error(f"Database error in delete_existing_request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error in delete_existing_request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{request_id}/comments", response_model=Request)
async def add_comment_to_request(
    request_id: str,
    comment: RequestComment,
    collection: Database = Depends(get_requests_collection)
):
    """
    Add a comment to a request.
    
    Args:
        request_id: The request ID
        comment: Comment data
        collection: Requests collection
        
    Returns:
        Updated Request object
    
    Raises:
        HTTPException: If request not found or there's an error processing the request
    """
    logger.info(f"POST /requests/{request_id}/comments")
    try:
        result = request_service.add_comment(collection, request_id, comment)
        if not result:
            logger.warning(f"Request not found: {request_id}")
            raise HTTPException(status_code=404, detail="Request not found")
        return result
    except ValueError as e:
        logger.warning(f"Validation error in add_comment_to_request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except PyMongoError as e:
        logger.error(f"Database error in add_comment_to_request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error in add_comment_to_request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{request_id}/approval", response_model=Request)
async def update_request_approval(
    request_id: str,
    approve: bool,
    approver_id: str,
    approver_name: Optional[str] = None,
    comment: Optional[str] = None,
    collection: Database = Depends(get_requests_collection)
):
    """
    Update approval status for a request.
    
    Args:
        request_id: The request ID
        approve: Whether to approve the request
        approver_id: ID of the approver
        approver_name: Name of the approver
        comment: Optional comment for the approval/rejection
        collection: Requests collection
        
    Returns:
        Updated Request object
    
    Raises:
        HTTPException: If request not found or there's an error processing the request
    """
    logger.info(f"PUT /requests/{request_id}/approval - approve: {approve}, approver: {approver_id}")
    try:
        result = request_service.update_approval(
            collection, 
            request_id, 
            approver_id, 
            approve, 
            approver_name, 
            comment
        )
        if not result:
            logger.warning(f"Request not found: {request_id}")
            raise HTTPException(status_code=404, detail="Request not found")
        return result
    except ValueError as e:
        logger.warning(f"Validation error in update_request_approval: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except PyMongoError as e:
        logger.error(f"Database error in update_request_approval: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error in update_request_approval: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) 