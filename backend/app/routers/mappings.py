from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from typing import List, Dict, Any
import httpx
from ..database import get_database
from ..config import get_settings
from ..schemas.mapping import (
    TableInfoResponse,
    SqlPreviewRequest,
    SqlPreviewResponse,
    MappingCreate,
    MappingResponse,
    MappingUpdate,
    ColumnMappingCreate,
    ColumnMappingResponse
)
from ..services.mapping_service import MappingService

router = APIRouter(prefix="/mappings", tags=["mappings"])
settings = get_settings()


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


@router.post("/", response_model=MappingResponse, status_code=status.HTTP_201_CREATED)
def create_mapping(
    mapping: MappingCreate,
    service: MappingService = Depends(get_mapping_service)
):
    """Create a new mapping"""
    try:
        return service.create_mapping(mapping)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/", response_model=List[MappingResponse])
def list_mappings(
    service: MappingService = Depends(get_mapping_service)
):
    """List all mappings"""
    return service.list_mappings()


@router.get("/{mapping_id}", response_model=MappingResponse)
def get_mapping(
    mapping_id: str,
    service: MappingService = Depends(get_mapping_service)
):
    """Get a specific mapping by ID"""
    try:
        return service.get_mapping(mapping_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/{mapping_id}", response_model=MappingResponse)
def update_mapping(
    mapping_id: str,
    update: MappingUpdate,
    service: MappingService = Depends(get_mapping_service)
):
    """Update an existing mapping"""
    try:
        return service.update_mapping(mapping_id, update)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mapping(
    mapping_id: str,
    service: MappingService = Depends(get_mapping_service)
):
    """Delete a mapping"""
    try:
        service.delete_mapping(mapping_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# Column Mapping endpoints

@router.post("/{mapping_id}/column-mappings", response_model=ColumnMappingResponse, status_code=status.HTTP_201_CREATED)
def create_column_mapping(
    mapping_id: str,
    config: ColumnMappingCreate,
    service: MappingService = Depends(get_mapping_service)
):
    """Save column mapping configuration for a mapping"""
    try:
        # Ensure mapping_id in path matches config
        if config.mapping_id != mapping_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mapping ID in path and body must match"
            )
        return service.create_column_mapping(config)
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


@router.get("/{mapping_id}/column-mappings", response_model=ColumnMappingResponse)
def get_column_mapping(
    mapping_id: str,
    service: MappingService = Depends(get_mapping_service)
):
    """Get column mapping configuration for a mapping"""
    try:
        result = service.get_column_mapping(mapping_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Column mapping not found for mapping: {mapping_id}"
            )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{mapping_id}/column-mappings", response_model=ColumnMappingResponse)
def update_column_mapping(
    mapping_id: str,
    config: ColumnMappingCreate,
    service: MappingService = Depends(get_mapping_service)
):
    """Update column mapping configuration (upsert)"""
    try:
        # Ensure mapping_id in path matches config
        if config.mapping_id != mapping_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mapping ID in path and body must match"
            )
        return service.update_column_mapping(mapping_id, config)
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


@router.delete("/{mapping_id}/column-mappings", status_code=status.HTTP_204_NO_CONTENT)
def delete_column_mapping(
    mapping_id: str,
    service: MappingService = Depends(get_mapping_service)
):
    """Delete column mapping configuration"""
    try:
        deleted = service.delete_column_mapping(mapping_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Column mapping not found for mapping: {mapping_id}"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Execution endpoint

@router.post("/{mapping_id}/run")
async def run_mapping(mapping_id: str) -> Dict[str, Any]:
    """
    Execute an ETL mapping by proxying request to execution service.

    Returns execution status, rows written, Delta Lake path, and any errors.
    """
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{settings.execution_service_url}/executions/run",
                json={"mapping_id": mapping_id}
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Execution service error: {response.text}"
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not connect to execution service: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Execution failed: {str(e)}"
        )
