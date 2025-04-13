from pymongo.collection import Collection
from app.models.document import DocumentCreate, Document
from datetime import datetime
from bson import ObjectId
from typing import List

def get_documents(db: Collection, asset_id: str) -> List[Document]:
    docs = list(db.documents.find({"asset_id": asset_id}))
    return [Document(**{**doc, "id": str(doc["_id"])}) for doc in docs]

def create_document(db: Collection, document: DocumentCreate) -> Document:
    doc_dict = document.dict()
    doc_dict["created_at"] = datetime.utcnow()
    # Validate references
    if not db.asset_items.find_one({"_id": ObjectId(document.asset_id)}):
        raise ValueError("Invalid asset_id")
    if document.uploaded_by and not db.employees.find_one({"_id": ObjectId(document.uploaded_by)}):
        raise ValueError("Invalid uploaded_by")
    result = db.documents.insert_one(doc_dict)
    return Document(**{**doc_dict, "id": str(result.inserted_id)})