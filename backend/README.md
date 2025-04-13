# Asset Management API
A FastAPI-based API for managing assets with MongoDB Atlas.

## Setup
1. Install dependencies: `pip install fastapi pymongo python-dotenv`
2. Set `MONGODB_URL` in `.env`
3. Run: `uvicorn app.main:app --reload`

## Endpoints
- GET /api/v1/asset-categories: List all asset categories
- POST /api/v1/asset-categories: Create a new category
- GET /api/v1/asset-items: List asset items with filters

# File structure:

app/
├── __init__.py
├── main.py
├── dependencies.py
├── models/
│   ├── __init__.py
│   ├── asset_category.py
│   ├── asset_item.py
│   ├── assignment_history.py
│   ├── maintenance_history.py
│   └── document.py
├── routers/
│   ├── __init__.py
│   ├── asset_categories.py
│   ├── asset_items.py
│   ├── assignment_history.py
│   ├── maintenance_history.py
│   └── documents.py
├── services/
│   ├── __init__.py
│   ├── asset_category_service.py
│   ├── asset_item_service.py
│   ├── assignment_history_service.py
│   ├── maintenance_history_service.py
│   └── document_service.py
├── .env
└── README.md 