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

## Environment Setup

1. Install dependencies: 
   ```
   pip install -r requirements.txt
   ```

2. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URL=mongodb://localhost:27017/asset_management
   PORT=8000
   ENVIRONMENT=development
   ```

3. Run the application using one of the methods described in the "Running the Application" section.

All API endpoints will run on port 8000 by default. If you need to change the port, update both the `.env` file and the command used to start the server.

## Running the Application

Run the application using one of the following methods:

**Method 1: Using the provided scripts**
- Windows (PowerShell): `.\start_server.ps1`
- Windows (Command Prompt): `start_server.bat`
- Linux/Mac: `./start_server.sh` (make it executable first with `chmod +x start_server.sh`)

**Method 2: Using Python directly**
- `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

The server will run on port 8000 by default. All API endpoints will be available at `http://localhost:8000/api/...`.

## CORS Configuration

The API server is configured to allow cross-origin requests from the following origins:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Create React App dev server)
- `http://localhost:8000` (Same-origin requests)
- `http://localhost` (Production deployments)

If you need to allow requests from additional origins, modify the CORS configuration in `app/main.py`.

## API Documentation

When the server is running, API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

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