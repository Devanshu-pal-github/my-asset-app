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
from app.models.utils import get_current_datetime, serialize_model, generate_document_id
import logging
from app.dependencies import get_db
import time

logger = logging.getLogger(__name__)

# Explicitly define collection name to avoid confusion
DOCUMENTS_COLLECTION = "documents"

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
        
        # Use the collection directly
        # collection = db.get_collection(DOCUMENTS_COLLECTION)
        collection = db
        documents = list(collection.find(query).sort("created_at", -1))
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
        # Use the collection directly
        # collection = db.get_collection(DOCUMENTS_COLLECTION)
        collection = db
        document = collection.find_one({"id": document_id})
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

def create_document(db: Database, document: DocumentCreate, skip_validation: bool = False) -> Document:
    """
    Create a new document with validation.
    
    Args:
        db (Database): MongoDB database instance
        document (DocumentCreate): Document to create
        skip_validation (bool): If True, skip validation of asset and employee existence
        
    Returns:
        Document: The created document
        
    Raises:
        ValueError: If the document data is invalid
    """
    logger.info(f"Creating document - asset_id: {document.asset_id}, employee_id: {document.employee_id}, type: {document.document_type}")
    try:
        # Basic validation
        if not document.asset_id and not document.employee_id:
            logger.warning("At least one of asset_id or employee_id required")
            raise ValueError("At least one of asset_id or employee_id must be provided")
        
        # Ensure file_type is set if not provided
        if not document.file_type and document.file_name and '.' in document.file_name:
            document.file_type = document.file_name.split('.')[-1].lower()
            logger.debug(f"Extracted file_type from filename: {document.file_type}")
        
        # If still no file_type, set a default
        if not document.file_type:
            document.file_type = "unknown"
            logger.debug("Set default file_type to 'unknown'")
        
        # Skip validation checks for simplicity
        # ===== SIMPLIFIED APPROACH START =====
        # Generate a document ID explicitly
        doc_id = generate_document_id()
        
        # Add timestamp to file URL to avoid collisions
        timestamp = int(time.time() * 1000)
        if "." in document.file_url:
            base, ext = document.file_url.rsplit(".", 1)
            document.file_url = f"{base}_{timestamp}.{ext}"
        else:
            document.file_url = f"{document.file_url}_{timestamp}"
        
        logger.info(f"Made URL unique by adding timestamp: {document.file_url}")
        
        # Create document dictionary directly
        doc_dict = {
            "_id": doc_id,
            "id": doc_id,
            "name": document.name,
            "description": document.description,
            "document_type": document.document_type.value if document.document_type else None,
            "status": document.status.value if document.status else "active",
            "file_name": document.file_name,
            "file_type": document.file_type,
            "file_size": document.file_size,
            "file_url": document.file_url,
            "thumbnail_url": document.thumbnail_url,
            "asset_id": document.asset_id,
            "asset_name": document.asset_name,
            "asset_tag": document.asset_tag,
            "category_id": document.category_id,
            "category_name": document.category_name,
            "employee_id": document.employee_id,
            "employee_name": document.employee_name,
            "upload_date": document.upload_date,
            "issue_date": document.issue_date,
            "expiry_date": document.expiry_date,
            "tags": document.tags or [],
            "metadata": document.metadata or {},
            "notes": document.notes,
            "approval_status": document.approval_status.value if document.approval_status else "not_required",
            "uploaded_by": document.uploaded_by,
            "uploaded_by_name": document.uploaded_by_name,
            "document_number": document.document_number,
            "is_confidential": document.is_confidential or False,
            "created_at": get_current_datetime(),
            "updated_at": get_current_datetime()
        }
        
        # Add any missing fields that might be in DocumentCreate but not explicitly listed above
        for key, value in document.model_dump(exclude_unset=True).items():
            if key not in doc_dict and value is not None:
                doc_dict[key] = value
        
        # Insert document directly
        collection = db
        result = collection.insert_one(doc_dict)
        logger.debug(f"Inserted document with ID: {doc_id}")
        
        # Create a proper document response
        doc = Document(**doc_dict)
        
        # ===== SIMPLIFIED APPROACH END =====
        
        # Update related collections if needed
        try:
            if document.asset_id:
                # Get the database from dependencies
                asset_db = get_db()
                asset_db.asset_items.update_one(
                    {"id": document.asset_id},
                    {"$push": {"documents": {"id": doc_id, "name": document.name, "document_type": document.document_type.value if document.document_type else "other"}}}
                )
            
            if document.employee_id:
                # Get the database from dependencies
                employee_db = get_db()
                employee_db.employees.update_one(
                    {"id": document.employee_id},
                    {"$push": {"documents": {"id": doc_id, "name": document.name, "document_type": document.document_type.value if document.document_type else "other"}}}
                )
        except Exception as e:
            # Log but don't fail if related collection updates fail
            logger.warning(f"Failed to update related collections: {str(e)}")
            
        logger.info(f"Created document with ID: {doc_id}")
        return doc
    except PyMongoError as e:
        logger.error(f"Database error creating document: {str(e)}", exc_info=True)
        raise ValueError(f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating document: {str(e)}", exc_info=True)
        raise ValueError(f"Error creating document: {str(e)}")

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
        # Get the documents collection
        # IMPORTANT FIX: The collection is already passed from router dependency
        # collection = db.get_collection(DOCUMENTS_COLLECTION)
        collection = db  # db is already the documents collection
        
        # Check if document exists - use explicit collection
        document = collection.find_one({"id": document_id})
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
        
        # Update document - use explicit collection
        collection.update_one(
            {"id": document_id},
            {"$set": update_dict}
        )
        
        # Get updated document - use explicit collection
        updated_document = collection.find_one({"id": document_id})
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
        # Get the documents collection
        # IMPORTANT FIX: The collection is already passed from router dependency
        # collection = db.get_collection(DOCUMENTS_COLLECTION)
        collection = db  # db is already the documents collection
        
        # Get document to find its associations - use explicit collection
        document = collection.find_one({"id": document_id})
        if not document:
            logger.warning(f"Document not found: {document_id}")
            return False
        
        # Remove document references from associated collections
        if document.get("asset_id"):
            # Get the database from dependencies since 'db' is now a collection
            asset_db = get_db()
            asset_db.asset_items.update_one(
                {"id": document["asset_id"]},
                {"$pull": {"documents": {"id": document_id}}}
            )
        
        if document.get("employee_id"):
            # Get the database from dependencies since 'db' is now a collection
            employee_db = get_db()
            employee_db.employees.update_one(
                {"id": document["employee_id"]},
                {"$pull": {"documents": {"id": document_id}}}
            )
        
        # Delete the document - use explicit collection
        result = collection.delete_one({"id": document_id})
        
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