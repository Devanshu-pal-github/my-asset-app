from fastapi import APIRouter, HTTPException, Depends
from pymongo.database import Database
from bson import ObjectId
from typing import List, Optional
from app.dependencies import get_db
from app.models.document import DocumentEntry, DocumentCreate
from app.services.document_service import create_document, get_documents
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/", response_model=List[DocumentEntry])
async def read_documents(
    asset_id: Optional[str] = None,
    employee_id: Optional[str] = None,
    document_type: Optional[str] = None,
    db: Database = Depends(get_db)
):
    """
    Retrieve documents by asset ID, employee ID, or document type.
    """
    logger.info(f"Fetching documents - asset_id: {asset_id}, employee_id: {employee_id}, document_type: {document_type}")
    try:
        if not asset_id and not employee_id:
            logger.warning("No asset_id or employee_id provided")
            raise HTTPException(status_code=400, detail="At least one of asset_id or employee_id must be provided")
        query = {}
        if asset_id:
            query["asset_id"] = asset_id
        if employee_id:
            query["employee_id"] = employee_id
        if document_type:
            query["document_type"] = document_type
        documents = get_documents(db, query)
        logger.debug(f"Fetched {len(documents)} documents")
        return documents
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch documents: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")

@router.post("/", response_model=DocumentEntry)
async def create_new_document(document: DocumentCreate, db: Database = Depends(get_db)):
    """
    Create a new document linked to an asset or employee.
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

@router.delete("/{id}", response_model=dict)
async def delete_document(id: str, db: Database = Depends(get_db)):
    """
    Delete a document by ID.
    """
    logger.info(f"Deleting document with ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid document ID: {id}")
            raise HTTPException(status_code=400, detail="Invalid document ID")
        
        document = db.documents.find_one({"_id": ObjectId(id)})
        if not document:
            logger.warning(f"Document not found: {id}")
            raise HTTPException(status_code=404, detail="Document not found")
        
        result = db.documents.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            logger.warning(f"Document not found: {id}")
            raise HTTPException(status_code=404, detail="Document not found")
        
        if document.get("asset_id"):
            db.asset_items.update_one(
                {"_id": ObjectId(document["asset_id"])},
                {"$pull": {"documents": {"id": id}}}
            )
        if document.get("employee_id"):
            db.employees.update_one(
                {"_id": ObjectId(document["employee_id"])},
                {"$pull": {"documents": {"id": id}}}
            )
        
        logger.debug(f"Deleted document ID: {id}")
        return {"message": "Document deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete document {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")