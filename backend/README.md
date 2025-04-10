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