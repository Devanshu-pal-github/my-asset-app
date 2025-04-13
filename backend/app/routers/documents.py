from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import db
from app.models.document import Document, DocumentCreate
from app.services.document_service import create_document, get_documents
from typing import List

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/", response_model=List[Document])
def read_documents(asset_id: str):
    print(f"Fetching documents for asset_id: {asset_id}")
    docs = get_documents(db, asset_id)
    return docs

@router.post("/", response_model=Document)
def create_new_document(document: DocumentCreate):
    print(f"Creating document for asset: {document.asset_id}")
    return create_document(db, document)