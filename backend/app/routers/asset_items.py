from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import db
from app.models.asset_item import AssetItem, AssetItemCreate, AssetItemBase
from app.services.asset_item_service import (
    create_asset_item,
    get_asset_items,
    get_asset_item_by_id,
    update_asset_item,
    delete_asset_item,
)
from typing import List, Optional

router = APIRouter(prefix="/asset-items", tags=["Asset Items"])

@router.get("/", response_model=List[AssetItem])
def read_asset_items(category_id: str = None, status: Optional[str] = None):
    print(f"Fetching asset items - category_id: {category_id}, status: {status}")
    items = get_asset_items(db, category_id, status)
    return items

@router.get("/{id}", response_model=AssetItem)
def read_asset_item(id: str):
    print(f"Fetching asset item with ID: {id}")
    item = get_asset_item_by_id(db, id)
    if not item:
        raise HTTPException(status_code=404, detail="Asset item not found")
    return item

@router.post("/", response_model=AssetItem)
def create_new_asset_item(item: AssetItemCreate):
    print(f"Creating asset item: {item.name}")
    return create_asset_item(db, item)

@router.put("/{id}", response_model=AssetItem)
def update_asset_item_route(id: str, item: AssetItemBase):
    print(f"Updating asset item with ID: {id}")
    updated_item = update_asset_item(db, id, item)
    if not updated_item:
        raise HTTPException(status_code=404, detail="Asset item not found")
    return updated_item

@router.delete("/{id}", response_model=dict)
def delete_asset_item_route(id: str):
    print(f"Deleting asset item with ID: {id}")
    deleted = delete_asset_item(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Asset item not found")
    return {"message": "Asset item deleted successfully"}