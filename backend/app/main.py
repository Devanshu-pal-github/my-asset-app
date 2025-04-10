from fastapi import FastAPI
from app.dependencies import db
from app.routers import asset_categories, asset_items, assignment_history, maintenance_history, documents

app = FastAPI(title="Asset Management API")

# Include routers
app.include_router(asset_categories.router, prefix="/api/v1")
app.include_router(asset_items.router, prefix="/api/v1")
app.include_router(assignment_history.router, prefix="/api/v1")
app.include_router(maintenance_history.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")

@app.get("/")
def read_root():
    print("Root endpoint hit")
    try:
        db.asset_categories.find_one()  # Test connection
        return {"message": "Connected to MongoDB Atlas successfully!"}
    except Exception as e:
        return {"error": f"Failed to connect: {str(e)}"}