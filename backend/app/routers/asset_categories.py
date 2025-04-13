from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import db
from app.models.asset_category import AssetCategory, AssetCategoryCreate, AssetCategoryBase
from app.services.asset_category_service import create_asset_category, get_asset_categories, update_asset_category, delete_asset_category
from typing import List

router = APIRouter(prefix="/asset-categories", tags=["Asset Categories"], redirect_slashes=False)

@router.get("/", response_model=List[AssetCategory])
def read_asset_categories():
    print("Fetching all asset categories")
    categories = get_asset_categories(db)
    return categories

@router.post("/", response_model=AssetCategory)
def create_new_asset_category(category: AssetCategoryCreate):
    print(f"Creating asset category: {category.name}")
    return create_asset_category(db, category)

@router.put("/{id}", response_model=AssetCategory)
def update_asset_category_route(id: str, category: AssetCategoryBase):
    print(f"Updating asset category with ID: {id}")
    updated_category = update_asset_category(db, id, category)
    if not updated_category:
        raise HTTPException(status_code=404, detail="Asset category not found")
    return updated_category

@router.delete("/{id}", response_model=dict)
def delete_asset_category_route(id: str):
    print(f"Deleting asset category with ID: {id}")
    deleted = delete_asset_category(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Asset category not found")
    return {"message": "Asset category deleted successfully"}