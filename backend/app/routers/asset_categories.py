from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import db
from app.models.asset_category import AssetCategory, AssetCategoryCreate, AssetCategoryBase
from typing import List
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/asset-categories", tags=["Asset Categories"])

@router.get("/", response_model=List[AssetCategory])
def read_asset_categories():
    print("Fetching all asset categories")
    categories = list(db.asset_categories.find())
    return [AssetCategory(**{**cat, "id": str(cat["_id"])}) for cat in categories]

@router.get("/{id}", response_model=AssetCategory)
def read_asset_category(id: str):
    print(f"Fetching asset category with ID: {id}")
    category = db.asset_categories.find_one({"_id": ObjectId(id)})
    if not category:
        raise HTTPException(status_code=404, detail="Asset category not found")
    return AssetCategory(**{**category, "id": str(category["_id"])})

@router.post("/", response_model=AssetCategory)
def create_asset_category(category: AssetCategoryCreate):
    print(f"Creating asset category: {category.name}")
    category_dict = category.dict()
    category_dict["created_at"] = datetime.utcnow()
    category_dict["updated_at"] = datetime.utcnow()
    result = db.asset_categories.insert_one(category_dict)
    return AssetCategory(**{**category_dict, "id": str(result.inserted_id)})

@router.put("/{id}", response_model=AssetCategory)
def update_asset_category(id: str, category: AssetCategoryBase):
    print(f"Updating asset category with ID: {id}")
    update_data = category.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    result = db.asset_categories.update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Asset category not found")
    updated_category = db.asset_categories.find_one({"_id": ObjectId(id)})
    return AssetCategory(**{**updated_category, "id": str(updated_category["_id"])})

@router.delete("/{id}", response_model=dict)
def delete_asset_category(id: str):
    print(f"Deleting asset category with ID: {id}")
    category = db.asset_categories.find_one({"_id": ObjectId(id)})
    if not category:
        raise HTTPException(status_code=404, detail="Asset category not found")
    if db.asset_items.find_one({"category_id": id}):
        raise HTTPException(status_code=400, detail="Cannot delete category with assigned assets")
    result = db.asset_categories.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset category not found")
    return {"message": "Asset category deleted successfully"}