from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from typing import List
from ..database import get_database
from ..schemas.schema import (
    TableSchemaCreate, TableSchemaUpdate, TableSchemaResponse
)
from ..services.schema_service import SchemaService
from ..utils.exceptions import ConnectionNotFoundError, DuplicateConnectionError

router = APIRouter(prefix="/schemas", tags=["schemas"])


def get_schema_service(db: Database = Depends(get_database)) -> SchemaService:
    return SchemaService(db)


@router.post("/", response_model=TableSchemaResponse, status_code=status.HTTP_201_CREATED)
def create_schema(
    schema: TableSchemaCreate,
    service: SchemaService = Depends(get_schema_service)
):
    """Create a new table schema"""
    try:
        return service.create_schema(schema)
    except DuplicateConnectionError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/", response_model=List[TableSchemaResponse])
def list_schemas(
    include_archived: bool = False,
    service: SchemaService = Depends(get_schema_service)
):
    """List all table schemas"""
    return service.list_schemas(include_archived=include_archived)


@router.get("/{schema_id}", response_model=TableSchemaResponse)
def get_schema(
    schema_id: str,
    service: SchemaService = Depends(get_schema_service)
):
    """Get a specific schema by ID"""
    try:
        return service.get_schema(schema_id)
    except ConnectionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{schema_id}", response_model=TableSchemaResponse)
def update_schema(
    schema_id: str,
    update: TableSchemaUpdate,
    service: SchemaService = Depends(get_schema_service)
):
    """Update an existing schema"""
    try:
        return service.update_schema(schema_id, update)
    except ConnectionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DuplicateConnectionError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/{schema_id}/archive", response_model=TableSchemaResponse)
def archive_schema(
    schema_id: str,
    service: SchemaService = Depends(get_schema_service)
):
    """Archive a schema (soft delete)"""
    try:
        return service.archive_schema(schema_id)
    except ConnectionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{schema_id}/restore", response_model=TableSchemaResponse)
def restore_schema(
    schema_id: str,
    service: SchemaService = Depends(get_schema_service)
):
    """Restore an archived schema"""
    try:
        return service.restore_schema(schema_id)
    except ConnectionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
