from fastapi import APIRouter, HTTPException, Depends
from app.database import get_database
from app.schemas.system_settings import (
    SystemSettingsResponse,
    TargetDatabaseUpdate,
    TestConnectionResult
)
from app.services.system_settings_service import SystemSettingsService
from pymongo.database import Database

router = APIRouter(prefix="/system-settings", tags=["System Settings"])


def get_settings_service(db: Database = Depends(get_database)) -> SystemSettingsService:
    """Dependency to get settings service"""
    return SystemSettingsService(db)


@router.get("/", response_model=dict)
async def get_settings(service: SystemSettingsService = Depends(get_settings_service)):
    """Get system settings"""
    settings = service.get_settings()
    if not settings:
        # Return empty settings structure
        return {
            "target_db": None,
            "created_at": None,
            "updated_at": None
        }
    return settings


@router.put("/target-db", response_model=dict)
async def update_target_db(
    config: TargetDatabaseUpdate,
    service: SystemSettingsService = Depends(get_settings_service)
):
    """Update target database configuration"""
    try:
        result = service.update_target_db(config)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/target-db/test", response_model=TestConnectionResult)
async def test_target_db(
    config: TargetDatabaseUpdate,
    service: SystemSettingsService = Depends(get_settings_service)
):
    """Test target database connection"""
    result = service.test_target_db_connection(config)
    return result


@router.get("/target-db-decrypted")
async def get_target_db_decrypted(
    service: SystemSettingsService = Depends(get_settings_service)
):
    """Get target database configuration with decrypted password (internal use only)"""
    target_db = service.get_decrypted_target_db()
    if not target_db:
        raise HTTPException(status_code=404, detail="Target database not configured")
    return {"target_db": target_db}