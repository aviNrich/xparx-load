from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from typing import List
from ..database import get_database
from ..schemas.mapping import (
    TableInfoResponse,
    SqlPreviewRequest,
    SqlPreviewResponse
)
from ..services.mapping_service import MappingService

router = APIRouter(prefix="/mappings", tags=["mappings"])


def get_mapping_service(db: Database = Depends(get_database)) -> MappingService:
    return MappingService(db)


@router.get("/connections/{connection_id}/tables", response_model=List[TableInfoResponse])
def list_connection_tables(
    connection_id: str,
    service: MappingService = Depends(get_mapping_service)
):
    """List all tables from a connection with row count estimates"""
    try:
        return service.list_tables(connection_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/preview", response_model=SqlPreviewResponse)
def preview_sql_query(
    request: SqlPreviewRequest,
    service: MappingService = Depends(get_mapping_service)
):
    """Preview SQL query results (top 100 rows)"""
    try:
        return service.preview_sql_query(request, limit=100)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
