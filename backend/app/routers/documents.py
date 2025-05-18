from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pymongo.database import Database
from pymongo.errors import PyMongoError
from app.database import get_database
from app.models.document import (
    Document,
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentType,
    DocumentStatus
)
from app.services import document_service
import logging
from app.dependencies import get_documents_collection

router = APIRouter(
    prefix="/documents",
    tags=["documents"]
)

logger = logging.getLogger(__name__)

@router.get("/", response_model=List[DocumentResponse])
async def read_documents(
    asset_id: Optional[str] = None,
    employee_id: Optional[str] = None,
    document_type: Optional[str] = None,
    status: Optional[str] = None,
    tag: Optional[str] = None,
    is_confidential: Optional[bool] = None,
    collection: Database = Depends(get_documents_collection)
):
    """
    Get documents with optional filtering.
    
    Args:
        asset_id: Filter by asset ID
        employee_id: Filter by employee ID
        document_type: Filter by document type
        status: Filter by status
        tag: Filter by tag
        is_confidential: Filter by confidentiality
        collection: Documents collection
        
    Returns:
        List of DocumentResponse objects
    
    Raises:
        HTTPException: If there's an error processing the request
    """
    logger.info(f"GET /documents/ - asset_id: {asset_id}, employee_id: {employee_id}, document_type: {document_type}")
    try:
        filters = {}
        if asset_id:
            filters["asset_id"] = asset_id
        if employee_id:
            filters["employee_id"] = employee_id
        if document_type:
            filters["document_type"] = document_type
        if status:
            filters["status"] = status
        if tag:
            filters["tags"] = {"$in": [tag]}
        if is_confidential is not None:
            filters["is_confidential"] = is_confidential
            
        documents = document_service.get_documents(collection, filters)
        return documents
    except Exception as e:
        logger.error(f"Error in read_documents: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{document_id}", response_model=Document)
async def read_document(
    document_id: str,
    collection: Database = Depends(get_documents_collection)
):
    """
    Get a specific document by ID.
    
    Args:
        document_id: The document ID
        collection: Documents collection
        
    Returns:
        Document object
    
    Raises:
        HTTPException: If document not found or there's an error processing the request
    """
    logger.info(f"GET /documents/{document_id}")
    try:
        document = document_service.get_document_by_id(collection, document_id)
        if not document:
            logger.warning(f"Document not found: {document_id}")
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in read_document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Document, status_code=201)
async def create_new_document(
    document: DocumentCreate,
    collection: Database = Depends(get_documents_collection)
):
    """
    Create a new document.
    
    Args:
        document: Document creation data
        collection: Documents collection
        
    Returns:
        Created Document object
    
    Raises:
        HTTPException: If there's an error processing the request or validation fails
    """
    logger.info("POST /documents/")
    try:
        result = document_service.create_document(collection, document)
        return result
    except ValueError as e:
        logger.warning(f"Validation error in create_new_document: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except PyMongoError as e:
        logger.error(f"Database error in create_new_document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error in create_new_document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{document_id}", response_model=Document)
async def update_existing_document(
    document_id: str,
    update: DocumentUpdate,
    collection: Database = Depends(get_documents_collection)
):
    """
    Update an existing document.
    
    Args:
        document_id: The document ID to update
        update: Document update data
        collection: Documents collection
        
    Returns:
        Updated Document object
    
    Raises:
        HTTPException: If document not found or there's an error processing the request
    """
    logger.info(f"PUT /documents/{document_id}")
    try:
        result = document_service.update_document(collection, document_id, update)
        if not result:
            logger.warning(f"Document not found: {document_id}")
            raise HTTPException(status_code=404, detail="Document not found")
        return result
    except ValueError as e:
        logger.warning(f"Validation error in update_existing_document: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except PyMongoError as e:
        logger.error(f"Database error in update_existing_document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error in update_existing_document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{document_id}", status_code=204)
async def delete_existing_document(
    document_id: str,
    collection: Database = Depends(get_documents_collection)
):
    """
    Delete a document.
    
    Args:
        document_id: The document ID to delete
        collection: Documents collection
    
    Raises:
        HTTPException: If document not found or there's an error processing the request
    """
    logger.info(f"DELETE /documents/{document_id}")
    try:
        result = document_service.delete_document(collection, document_id)
        if not result:
            logger.warning(f"Document not found: {document_id}")
            raise HTTPException(status_code=404, detail="Document not found")
    except PyMongoError as e:
        logger.error(f"Database error in delete_existing_document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error in delete_existing_document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))