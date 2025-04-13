from pymongo.collection import Collection
from app.models.asset_category import AssetCategoryCreate, AssetCategory, AssetCategoryBase
from datetime import datetime
from bson import ObjectId
from typing import List, Optional

def get_asset_categories(db: Collection) -> List[AssetCategory]:
    categories = list(db.asset_categories.find())
    return [AssetCategory(**{**cat, "id": str(cat["_id"])}) for cat in categories]

def create_asset_category(db: Collection, category: AssetCategoryCreate) -> AssetCategory:
    category_dict = category.dict()
    category_dict["created_at"] = datetime.utcnow()
    category_dict["updated_at"] = datetime.utcnow()
    result = db.asset_categories.insert_one(category_dict)
    return AssetCategory(**{**category_dict, "id": str(result.inserted_id)})

def update_asset_category(db: Collection, id: str, category: AssetCategoryBase) -> Optional[AssetCategory]:
    try:
        update_data = category.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        result = db.asset_categories.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )
        if result.modified_count == 0:
            return None
        updated_category = db.asset_categories.find_one({"_id": ObjectId(id)})
        return AssetCategory(**{**updated_category, "id": str(updated_category["_id"])})
    except:
        return None

def delete_asset_category(db: Collection, id: str) -> bool:
    try:
        item_count = db.asset_items.count_documents({"category_id": id})
        if item_count > 0:
            raise ValueError("Cannot delete category with associated items")
        result = db.asset_categories.delete_one({"_id": ObjectId(id)})
        return result.deleted_count > 0
    except:
        return False