# Model Refactoring Guide

This guide outlines the changes needed to improve our Pydantic models by:

1. Removing MongoDB's ObjectId dependency and implementing UUID-based identifiers
2. Eliminating nested `Config` classes from Pydantic models
3. Using a centralized configuration pattern with better ID generation

## Key Changes Required

### 1. Update Imports in Each Model File

Replace:
```python
from bson import ObjectId
```

With:
```python
import uuid
from .utils import (
    model_config, 
    generate_asset_id,  # or appropriate ID generator for the model
    generate_uuid, 
    get_current_datetime
)
```

### 2. Replace ObjectId Fields with UUID-based IDs

Replace:
```python
id: Optional[str] = Field(None, alias="_id", description="Unique ID")
```

With (using appropriate ID generator for each model type):
```python
id: str = Field(default_factory=generate_asset_id, description="Unique asset ID")
# Or for employees:
id: str = Field(default_factory=generate_employee_id, description="Unique employee ID")
# Or for generic UUIDs:
id: str = Field(default_factory=generate_uuid, description="Unique identifier")
```

### 3. Replace Nested Config Classes

Replace:
```python
class SomeModel(BaseModel):
    field1: str = Field(...)
    field2: int = Field(...)
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        populate_by_name = True
```

With:
```python
class SomeModel(BaseModel):
    field1: str = Field(...)
    field2: int = Field(...)
    
    model_config = model_config  # From utils.py
```

### 4. Update datetime Fields

Replace:
```python
created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
```

With:
```python
created_at: datetime = Field(default_factory=get_current_datetime, description="Creation timestamp")
```

## Changes Required by File

### 1. analytics.py
- Already updated with all required changes
- Uses model_config instead of nested Config classes
- Uses UUID-based ID generation instead of ObjectId

### 2. asset_category.py
- Replace imports to include utils.py
- Replace all nested `Config` classes with `model_config = model_config`
- Replace ObjectId with generate_category_id()
- Update all datetime fields to use get_current_datetime()

### 3. asset_item.py
- Replace imports to include utils.py
- Replace all nested `Config` classes with `model_config = model_config`
- Replace ObjectId with generate_asset_id()
- Update all datetime fields to use get_current_datetime()

### 4. assignment_history.py
- Replace imports to include utils.py
- Replace all nested `Config` classes with `model_config = model_config`
- Replace ObjectId with generate_assignment_id()
- Update all datetime fields to use get_current_datetime()

### 5. document.py
- Replace imports to include utils.py
- Replace all nested `Config` classes with `model_config = model_config`
- Replace ObjectId with generate_document_id()
- Update all datetime fields to use get_current_datetime()

### 6. employee.py
- Replace imports to include utils.py
- Replace all nested `Config` classes with `model_config = model_config`
- Replace ObjectId with generate_employee_id()
- Update all datetime fields to use get_current_datetime()

### 7. maintenance_history.py
- Replace imports to include utils.py
- Replace all nested `Config` classes with `model_config = model_config`
- Replace ObjectId with generate_maintenance_id()
- Update all datetime fields to use get_current_datetime()

### 8. request_approval.py
- Replace imports to include utils.py
- Replace all nested `Config` classes with `model_config = model_config`
- Replace ObjectId with generate_request_id()
- Update all datetime fields to use get_current_datetime()

## Step-by-Step Process

1. Update the imports section in each file
2. Find and replace all `class Config` with `model_config = model_config`
3. Replace all `id: Optional[str] = Field(None, alias="_id", ...)` with appropriate ID generators
4. Replace all `created_at: datetime = Field(default_factory=datetime.utcnow, ...)` with get_current_datetime()
5. Remove all remaining references to ObjectId, including in json_encoders

## Benefits of These Changes

1. **Decoupled from MongoDB**: Our models no longer depend on MongoDB's ObjectId
2. **Self-contained ID generation**: We can generate readable, prefixed IDs like AST-1234-5678
3. **Consistent configuration**: One place to update model configuration
4. **No nested classes**: Cleaner code structure avoiding nested class anti-pattern
5. **Better typing**: More explicit typing with UUID-based IDs
6. **Better serialization**: Handles UUID and datetime conversion automatically 