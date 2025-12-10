from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from ..database import get_database
from ..schemas.schedule import ScheduleCreate, ScheduleResponse
from ..services.schedule_service import ScheduleService

router = APIRouter(prefix="/schedules", tags=["schedules"])


def get_schedule_service(db: Database = Depends(get_database)) -> ScheduleService:
    return ScheduleService(db)


@router.post("/", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(
    config: ScheduleCreate,
    service: ScheduleService = Depends(get_schedule_service)
):
    """Create or update schedule configuration"""
    try:
        return service.create_or_update_schedule(config)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{mapping_id}", response_model=ScheduleResponse)
def get_schedule(
    mapping_id: str,
    service: ScheduleService = Depends(get_schedule_service)
):
    """Get schedule configuration for a mapping"""
    schedule = service.get_schedule(mapping_id)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return schedule
