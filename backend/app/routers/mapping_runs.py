from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from pymongo.database import Database
from typing import Optional
from ..database import get_database
from ..schemas.mapping_run import MappingRunResponse, MappingRunListResponse
from ..services.mapping_run_service import MappingRunService

router = APIRouter(prefix="/mapping-runs", tags=["mapping-runs"])


def get_mapping_run_service(db: Database = Depends(get_database)) -> MappingRunService:
    return MappingRunService(db)


@router.get("/", response_model=MappingRunListResponse)
def list_mapping_runs(
    mapping_id: Optional[str] = Query(None, description="Filter by mapping ID"),
    source_id: Optional[str] = Query(None, description="Filter by source connection ID"),
    run_status: Optional[str] = Query(None, alias="status", description="Filter by run status (running, success, failed, partial_success)"),
    limit: int = Query(50, ge=1, le=100, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    service: MappingRunService = Depends(get_mapping_run_service)
):
    """
    List mapping run history with optional filters and pagination

    Supports filtering by:
    - mapping_id: Show runs for a specific mapping
    - source_id: Show runs for a specific source connection
    - status: Show runs with a specific status

    Results are sorted by start_time (most recent first) and paginated.
    """
    try:
        return service.list_runs(
            mapping_id=mapping_id,
            source_id=source_id,
            status=run_status,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{run_id}", response_model=MappingRunResponse)
def get_mapping_run(
    run_id: str,
    service: MappingRunService = Depends(get_mapping_run_service)
):
    """
    Get detailed information for a specific mapping run

    Returns complete run information including:
    - Run status and timing
    - Data metrics (rows written)
    - Error information if applicable
    - Populated mapping and source names
    """
    try:
        return service.get_run(run_id)
    except ValueError as e:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
