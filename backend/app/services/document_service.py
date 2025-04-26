from pymongo.database import Database
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from typing import List
from datetime import datetime
from app.models.document import DocumentEntry, DocumentCreate
import logging

logger = logging.getLogger(__name__)

def get_documents(db: Database, query: dict) -> List[DocumentEntry]:
    """
    Retrieve documents based on query (asset_id or employee_id).
    """
    logger.info(f"Fetching documents with query: {query}")
    try:
        documents = list(db.documents.find(query))
        result = []
        for doc in documents:
            doc_dict = {**doc, "id": str(doc["_id"])}
            doc_dict.pop("_id", None)
            result.append(DocumentEntry(**doc_dict))
        
        logger.debug(f"Fetched {len(result)} documents")
        return result
    except Exception as e:
        logger.error(f"Error fetching documents: {str(e)}", exc_info=True)
        raise

def create_document(db: Database, document: DocumentCreate) -> DocumentEntry:
    """
    Create a new document with validation.
    """
    logger.info(f"Creating document - asset_id: {document.asset_id}, employee_id: {document.employee_id}, type: {document.document_type}")
    try:
        if document.asset_id and not ObjectId.is_valid(document.asset_id):
            logger.warning(f"Invalid asset ID: {document.asset_id}")
            raise ValueError("Invalid asset ID")
        if document.employee_id and not ObjectId.is_valid(document.employee_id):
            logger.warning(f"Invalid employee ID: {document.employee_id}")
            raise ValueError("Invalid employee ID")
        if not ObjectId.is_valid(document.uploaded_by):
            logger.warning(f"Invalid uploaded_by ID: {document.uploaded_by}")
            raise ValueError("Invalid uploaded_by ID")
        
        if not document.asset_id and not document.employee_id:
            logger.warning("At least one of asset_id or employee_id required")
            raise ValueError("At least one of asset_id or employee_id must be provided")
        
        if document.asset_id:
            asset = db.asset_items.find_one({"_id": ObjectId(document.asset_id)})
            if not asset:
                logger.warning(f"Asset not found: {document.asset_id}")
                raise ValueError("Asset not found")
        if document.employee_id:
            emp = db.employees.find_one({"_id": ObjectId(document.employee_id)})
            if not emp:
                logger.warning(f"Employee not found: {document.employee_id}")
                raise ValueError("Employee not found")
        uploader = db.employees.find_one({"_id": ObjectId(document.uploaded_by)})
        if not uploader:
            logger.warning(f"Uploader not found: {document.uploaded_by}")
            raise ValueError("Uploader not found")
        
        existing = db.documents.find_one({"file_url": document.file_url})
        if existing:
            logger.warning(f"Document with file_url {document.file_url} already exists")
            raise ValueError(f"Document with file_url {document.file_url} already exists")
        
        doc_dict = document.dict(exclude_none=True)
        doc_dict["created_at"] = datetime.utcnow()
        result = db.documents.insert_one(doc_dict)
        logger.debug(f"Inserted document with ID: {result.inserted_id}")
        
        response_dict = {**doc_dict, "id": str(result.inserted_id)}
        response_dict.pop("_id", None)  # Remove raw _id to prevent ObjectId type conflict
        if document.asset_id:
            db.asset_items.update_one(
                {"_id": ObjectId(document.asset_id)},
                {"$push": {"documents": response_dict}}
            )
        if document.employee_id:
            db.employees.update_one(
                {"_id": ObjectId(document.employee_id)},
                {"$push": {"documents": response_dict}}
            )
        
        created_doc = DocumentEntry(**response_dict)
        logger.info(f"Created document with ID: {created_doc.id}")
        return created_doc
    except DuplicateKeyError:
        logger.warning(f"Duplicate file_url: {document.file_url}")
        raise ValueError(f"Document with file_url {document.file_url} already exists")
    except Exception as e:
        logger.error(f"Error creating document: {str(e)}", exc_info=True)
        raise