from fastapi import APIRouter, HTTPException, Depends
from pymongo.database import Database
from typing import List, Optional
from app.dependencies import get_db
from app.models.document import Document, DocumentCreate, DocumentUpdate, DocumentResponse
from app.services.document_service import create_document, get_documents, delete_document, update_document
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/", response_model=List[DocumentResponse])
async def read_documents(
    asset_id: Optional[str] = None,
    employee_id: Optional[str] = None,
    document_type: Optional[str] = None,
    db: Database = Depends(get_db)
):
    """
    Retrieve documents by asset ID, employee ID, or document type.
    
    Args:
        asset_id (Optional[str]): Filter by asset ID
        employee_id (Optional[str]): Filter by employee ID
        document_type (Optional[str]): Filter by document type
        db (Database): MongoDB database instance, injected via dependency
        
    Returns:
        List[DocumentResponse]: List of documents matching the filters
        
    Raises:
        HTTPException: 400 if no valid filter provided, 500 for server errors
    """
    logger.info(f"Fetching documents - asset_id: {asset_id}, employee_id: {employee_id}, document_type: {document_type}")
    try:
        if not asset_id and not employee_id:
            logger.warning("No asset_id or employee_id provided")
            raise HTTPException(status_code=400, detail="At least one of asset_id or employee_id must be provided")
        
        filters = {}
        if asset_id:
            filters["asset_id"] = asset_id
        if employee_id:
            filters["employee_id"] = employee_id
        if document_type:
            filters["document_type"] = document_type
            
        documents = get_documents(db, filters)
        logger.debug(f"Fetched {len(documents)} documents")
        return documents
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch documents: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")

@router.get("/{document_id}", response_model=DocumentResponse)
async def read_document(document_id: str, db: Database = Depends(get_db)):
    """
    Retrieve a specific document by ID.
    
    Args:
        document_id (str): Document ID
        db (Database): MongoDB database instance, injected via dependency
        
    Returns:
        DocumentResponse: Document details
        
    Raises:
        HTTPException: 404 if document not found, 500 for server errors
    """
    logger.info(f"Fetching document with ID: {document_id}")
    try:
        document = get_documents(db, {"id": document_id})
        if not document or len(document) == 0:
            logger.warning(f"Document not found: {document_id}")
            raise HTTPException(status_code=404, detail="Document not found")
        
        logger.debug(f"Found document: {document[0].name}")
        return document[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch document: {str(e)}")

@router.post("/", response_model=DocumentResponse)
async def create_new_document(document: DocumentCreate, db: Database = Depends(get_db)):
    """
    Create a new document linked to an asset or employee.
    
    Args:
        document (DocumentCreate): Document details
        db (Database): MongoDB database instance, injected via dependency
        
    Returns:
        DocumentResponse: Created document details
        
    Raises:
        HTTPException: 400 for validation errors, 500 for server errors
    """
    logger.info(f"Creating document - asset_id: {document.asset_id}, employee_id: {document.employee_id}, type: {document.document_type}")
    try:
        created_document = create_document(db, document)
        logger.debug(f"Created document with ID: {created_document.id}")
        return created_document
    except ValueError as ve:
        logger.warning(f"Failed to create document: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to create document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create document: {str(e)}")

@router.put("/{document_id}", response_model=DocumentResponse)
async def update_existing_document(document_id: str, document: DocumentUpdate, db: Database = Depends(get_db)):
    """
    Update an existing document.
    
    Args:
        document_id (str): Document ID to update
        document (DocumentUpdate): Updated document details
        db (Database): MongoDB database instance, injected via dependency
        
    Returns:
        DocumentResponse: Updated document details
        
    Raises:
        HTTPException: 404 if document not found, 400 for validation errors, 500 for server errors
    """
    logger.info(f"Updating document: {document_id}")
    try:
        updated_document = update_document(db, document_id, document)
        if not updated_document:
            logger.warning(f"Document not found: {document_id}")
            raise HTTPException(status_code=404, detail="Document not found")
            
        logger.debug(f"Updated document: {updated_document.id}")
        return updated_document
    except ValueError as ve:
        logger.warning(f"Failed to update document: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to update document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update document: {str(e)}")

@router.delete("/{document_id}", response_model=dict)
async def delete_existing_document(document_id: str, db: Database = Depends(get_db)):
    """
    Delete a document by ID.
    
    Args:
        document_id (str): Document ID to delete
        db (Database): MongoDB database instance, injected via dependency
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 404 if document not found, 500 for server errors
    """
    logger.info(f"Deleting document with ID: {document_id}")
    try:
        result = delete_document(db, document_id)
        if not result:
            logger.warning(f"Document not found: {document_id}")
            raise HTTPException(status_code=404, detail="Document not found")
        
        logger.debug(f"Deleted document ID: {document_id}")
        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")