from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import db
from app.models.document import Document, DocumentCreate
from app.services.document_service import create_document, get_documents
from typing import List, Optional

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/", response_model=List[Document])
def read_documents(asset_id: Optional[str] = None, employee_id: Optional[str] = None):
    print(f"Fetching documents for asset_id: {asset_id}, employee_id: {employee_id}")
    query = {}
    if asset_id:
        query["asset_id"] = asset_id
    if employee_id:
        query["employee_id"] = employee_id
    if not query:
        raise HTTPException(status_code=400, detail="At least one of asset_id or employee_id must be provided")
    docs = get_documents(db, query)
    return docs

@router.post("/", response_model=Document)
def create_new_document(document: DocumentCreate):
    print(f"Creating document for asset: {document.asset_id}, employee: {document.employee_id}")
    return create_document(db, document)