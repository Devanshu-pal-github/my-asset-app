from pymongo.collection import Collection
from app.models.document import DocumentCreate, Document
from datetime import datetime
from bson import ObjectId
from typing import List, Dict

def get_documents(db: Collection, query: Dict) -> List[Document]:
    docs = list(db.documents.find(query))
    return [Document(**{**doc, "id": str(doc["_id"])}) for doc in docs]

def create_document(db: Collection, document: DocumentCreate) -> Document:
    doc_dict = document.dict(exclude_unset=True)
    doc_dict["created_at"] = datetime.utcnow()
    doc_dict["updated_at"] = datetime.utcnow()
    # Validate references
    try:
        if doc_dict.get("asset_id") and not db.asset_items.find_one({"_id": ObjectId(doc_dict["asset_id"])}):
            raise ValueError("Invalid asset_id")
        if doc_dict.get("employee_id") and not db.employees.find_one({"_id": ObjectId(doc_dict["employee_id"])}):
            raise ValueError("Invalid employee_id")
        if doc_dict.get("uploaded_by") and not db.employees.find_one({"email": doc_dict["uploaded_by"]}):
            raise ValueError("Invalid uploaded_by: No employee found with this email")
    except ValueError as e:
        if "ObjectId" in str(e):
            raise HTTPException(status_code=400, detail=f"Invalid ID format: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    result = db.documents.insert_one(doc_dict)
    return Document(**{**doc_dict, "id": str(result.inserted_id)})