# Asset Management System Backend

This is the FastAPI backend for the Asset Management System.

## Architecture

The backend is built with FastAPI and MongoDB. It provides RESTful APIs for the frontend React application to interact with.

## Key Components

- **Models**: Pydantic models for data validation and serialization
- **Routers**: API endpoints organized by resource type
- **Services**: Business logic layer
- **Dependencies**: Shared dependencies like database connections

## Enum Handling

This application uses string enums for various status fields. All enum values are stored and returned with proper casing for consistency with the frontend.

### Status Enums:

- **AssetStatus**: 
  - `Available`
  - `Assigned`  
  - `Under Maintenance`
  - `Maintenance Requested`
  - `Maintenance Completed`
  - `Retired`
  - `Pending`
  - `Lost`
  - `Damaged`

- **AssetCondition**:
  - `New`
  - `Good`
  - `Fair`
  - `Poor`
  - `Excellent`
  - `Damaged`
  - `Non-functional`

- **MaintenanceStatus**:
  - `Requested`
  - `In Progress`
  - `Completed`
  - `Cancelled`

- **DocumentStatus**:
  - `Active`
  - `Expired`
  - `Pending`
  - `Rejected`
  - `Archived`

## Field Naming Consistency

Field names in the backend models are consistent with the frontend component props. For example:

- `asset_tag` in backend API responses maps to `assetTag` in frontend components
- `first_name` and `last_name` in employee models match frontend naming

## Frontend-Backend Synchronization

The backend is designed to work seamlessly with the frontend React application. Key integration points:

1. **API Response Format**: All API endpoints return responses that match the expected format in the Redux slices.
2. **Enum Values**: Status enums use the same string values as displayed in the frontend.
3. **Field Names**: Field names are consistent between frontend and backend for easy mapping.
4. **Error Handling**: Error responses include detailed information that can be displayed in the frontend.

## Running the Application

1. Install dependencies: `pip install -r requirements.txt`
2. Set up environment variables in `.env`
3. Run the application: `uvicorn app.main:app --reload`

## API Documentation

When the server is running, API documentation is available at:
- Swagger UI: `/docs`
- ReDoc: `/redoc`

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