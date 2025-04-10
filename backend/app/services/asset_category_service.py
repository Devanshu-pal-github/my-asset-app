from pymongo.collection import Collection
from app.models.asset_category import AssetCategoryCreate, AssetCategory
from datetime import datetime
from bson import ObjectId

def get_asset_categories(db: Collection) -> List[AssetCategory]:
    categories = list(db.asset_categories.find())
    return [AssetCategory(**{**cat, "id": str(cat["_id"])}) for cat in categories]

def create_asset_category(db: Collection, category: AssetCategoryCreate) -> AssetCategory:
    category_dict = category.dict()
    category_dict["created_at"] = datetime.utcnow()
    category_dict["updated_at"] = datetime.utcnow()
    result = db.asset_categories.insert_one(category_dict)
    return AssetCategory(**{**category_dict, "id": str(result.inserted_id)})