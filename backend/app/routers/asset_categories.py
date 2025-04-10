from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import db
from app.models.asset_category import AssetCategory, AssetCategoryCreate
from app.services.asset_category_service import create_asset_category, get_asset_categories
from typing import List

router = APIRouter(prefix="/asset-categories", tags=["Asset Categories"])

@router.get("/", response_model=List[AssetCategory])
def read_asset_categories():
    print("Fetching all asset categories")
    categories = get_asset_categories(db)
    return categories

@router.post("/", response_model=AssetCategory)
def create_new_asset_category(category: AssetCategoryCreate):
    print(f"Creating asset category: {category.name}")
    return create_asset_category(db, category)