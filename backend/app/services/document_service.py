from pymongo.database import Database
from pymongo.errors import DuplicateKeyError, PyMongoError
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.document import (
    Document, 
    DocumentCreate, 
    DocumentUpdate, 
    DocumentResponse,
    DocumentType,
    DocumentStatus
)
from app.models.utils import get_current_datetime, serialize_model
import logging

logger = logging.getLogger(__name__)

def get_documents(db: Database, filters: Dict[str, Any]) -> List[DocumentResponse]:
    """
    Retrieve documents based on filters.
    
    Args:
        db (Database): MongoDB database instance
        filters (Dict[str, Any]): Filters for documents such as asset_id, employee_id, document_type
        
    Returns:
        List[DocumentResponse]: List of documents matching the filter criteria
    """
    logger.info(f"Fetching documents with filters: {filters}")
    try:
        # Build query from filters
        query = {}
        if filters:
            for key, value in filters.items():
                if value is not None:
                    query[key] = value
        
        documents = list(db.documents.find(query).sort("created_at", -1))
        result = []
        for doc in documents:
            # Ensure id is properly formatted
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            result.append(DocumentResponse(**doc))
        
        logger.debug(f"Fetched {len(result)} documents")
        return result
    except Exception as e:
        logger.error(f"Error fetching documents: {str(e)}", exc_info=True)
        raise

def get_document_by_id(db: Database, document_id: str) -> Optional[Document]:
    """
    Retrieve a specific document by ID.
    
    Args:
        db (Database): MongoDB database instance
        document_id (str): The document ID to retrieve
        
    Returns:
        Optional[Document]: The document if found, None otherwise
    """
    logger.info(f"Fetching document with ID: {document_id}")
    try:
        document = db.documents.find_one({"id": document_id})
        if not document:
            logger.warning(f"Document not found: {document_id}")
            return None
        
        # Ensure id is properly formatted
        document["id"] = str(document["_id"])
        del document["_id"]
        return Document(**document)
    except Exception as e:
        logger.error(f"Error fetching document {document_id}: {str(e)}", exc_info=True)
        raise

def create_document(db: Database, document: DocumentCreate) -> Document:
    """
    Create a new document with validation.
    
    Args:
        db (Database): MongoDB database instance
        document (DocumentCreate): Document to create
        
    Returns:
        Document: The created document
        
    Raises:
        ValueError: If the document data is invalid or a document with the same file URL already exists
    """
    logger.info(f"Creating document - asset_id: {document.asset_id}, employee_id: {document.employee_id}, type: {document.document_type}")
    try:
        # Basic validation
        if not document.asset_id and not document.employee_id:
            logger.warning("At least one of asset_id or employee_id required")
            raise ValueError("At least one of asset_id or employee_id must be provided")
        
        # Validate associations
        if document.asset_id:
            asset = db.asset_items.find_one({"id": document.asset_id})
            if not asset:
                logger.warning(f"Asset not found: {document.asset_id}")
                raise ValueError("Asset not found")
        
        if document.employee_id:
            emp = db.employees.find_one({"id": document.employee_id})
            if not emp:
                logger.warning(f"Employee not found: {document.employee_id}")
                raise ValueError("Employee not found")
        
        if document.uploaded_by:
            uploader = db.employees.find_one({"id": document.uploaded_by})
            if not uploader:
                logger.warning(f"Uploader not found: {document.uploaded_by}")
                raise ValueError("Uploader not found")
        
        # Check for duplicate file_url
        existing = db.documents.find_one({"file_url": document.file_url})
        if existing:
            logger.warning(f"Document with file_url {document.file_url} already exists")
            raise ValueError(f"Document with file_url {document.file_url} already exists")
        
        # Create a full Document from DocumentCreate
        doc = Document(
            **document.model_dump(exclude_unset=True),
            created_at=get_current_datetime(),
            updated_at=get_current_datetime()
        )
        
        # Prepare for MongoDB
        doc_dict = serialize_model(doc)
        _id = doc_dict.pop("id")  # Remove id temporarily for MongoDB _id
        doc_dict["_id"] = _id  # Use as MongoDB _id
        
        # Insert document
        result = db.documents.insert_one(doc_dict)
        logger.debug(f"Inserted document with ID: {result.inserted_id}")
        
        # Update related collections
        if document.asset_id:
            db.asset_items.update_one(
                {"id": document.asset_id},
                {"$push": {"documents": {"id": doc.id, "name": doc.name, "document_type": doc.document_type.value}}}
            )
        
        if document.employee_id:
            db.employees.update_one(
                {"id": document.employee_id},
                {"$push": {"documents": {"id": doc.id, "name": doc.name, "document_type": doc.document_type.value}}}
            )
        
        logger.info(f"Created document with ID: {doc.id}")
        return doc
    except DuplicateKeyError:
        logger.warning(f"Duplicate file_url: {document.file_url}")
        raise ValueError(f"Document with file_url {document.file_url} already exists")
    except PyMongoError as e:
        logger.error(f"Database error creating document: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error creating document: {str(e)}", exc_info=True)
        raise ValueError(str(e))

def update_document(db: Database, document_id: str, update: DocumentUpdate) -> Optional[Document]:
    """
    Update an existing document.
    
    Args:
        db (Database): MongoDB database instance
        document_id (str): ID of the document to update
        update (DocumentUpdate): Update data
        
    Returns:
        Optional[Document]: Updated document if successful, None if document not found
        
    Raises:
        ValueError: If the update data is invalid
    """
    logger.info(f"Updating document {document_id}")
    try:
        # Check if document exists
        document = db.documents.find_one({"id": document_id})
        if not document:
            logger.warning(f"Document not found: {document_id}")
            return None
        
        # Prepare update dictionary
        update_dict = {}
        for key, value in update.model_dump(exclude_unset=True).items():
            if value is not None:
                update_dict[key] = value
        
        # Always update the updated_at field
        update_dict["updated_at"] = get_current_datetime()
        
        # Update document
        db.documents.update_one(
            {"id": document_id},
            {"$set": update_dict}
        )
        
        # Get updated document
        updated_document = db.documents.find_one({"id": document_id})
        updated_document["id"] = str(updated_document["_id"])
        del updated_document["_id"]
        
        logger.info(f"Updated document {document_id}")
        return Document(**updated_document)
    except PyMongoError as e:
        logger.error(f"Database error updating document {document_id}: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error updating document {document_id}: {str(e)}", exc_info=True)
        raise ValueError(str(e))

def delete_document(db: Database, document_id: str) -> bool:
    """
    Delete a document and update related collections.
    
    Args:
        db (Database): MongoDB database instance
        document_id (str): ID of the document to delete
        
    Returns:
        bool: True if document was deleted, False if document not found
    """
    logger.info(f"Deleting document {document_id}")
    try:
        # Get document to find its associations
        document = db.documents.find_one({"id": document_id})
        if not document:
            logger.warning(f"Document not found: {document_id}")
            return False
        
        # Remove document references from associated collections
        if document.get("asset_id"):
            db.asset_items.update_one(
                {"id": document["asset_id"]},
                {"$pull": {"documents": {"id": document_id}}}
            )
        
        if document.get("employee_id"):
            db.employees.update_one(
                {"id": document["employee_id"]},
                {"$pull": {"documents": {"id": document_id}}}
            )
        
        # Delete the document
        result = db.documents.delete_one({"id": document_id})
        
        if result.deleted_count == 0:
            logger.warning(f"Failed to delete document {document_id}")
            return False
        
        logger.info(f"Deleted document {document_id}")
        return True
    except PyMongoError as e:
        logger.error(f"Database error deleting document {document_id}: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {str(e)}", exc_info=True)
        raise ValueError(str(e))