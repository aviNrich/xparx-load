from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
from ..schemas.delta_query import (
    DeltaQueryRequest,
    DeltaQueryResponse,
    TableSchemaResponse,
)
from ..services.delta_reader import read_delta_table, get_table_schema
from ..utils.exceptions import DeltaWriteError

router = APIRouter(prefix="/delta-tables", tags=["delta-tables"])


@router.post("/query", response_model=DeltaQueryResponse)
async def query_delta_table(request: DeltaQueryRequest):
    """
    Query data from a Delta Lake table with optional filtering and pagination.

    This endpoint:
    1. Reads data from the specified Delta table
    2. Applies field-based filters (partial string matching)
    3. Returns paginated results with column metadata

    Filters support partial string matching (case-insensitive).
    """
    try:
        result = read_delta_table(
            table_name=request.table_name,
            filters=request.filters,
            limit=request.limit,
            offset=request.offset,
        )
        return DeltaQueryResponse(**result)
    except DeltaWriteError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query table: {str(e)}")


@router.get("/{table_name}/schema", response_model=TableSchemaResponse)
async def get_delta_table_schema(table_name: str):
    """
    Get schema information for a Delta Lake table.

    Returns column names and types for the specified table.
    """
    try:
        result = get_table_schema(table_name)
        return TableSchemaResponse(**result)
    except DeltaWriteError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get table schema: {str(e)}"
        )


@router.get("/{table_name}", response_model=DeltaQueryResponse)
async def get_delta_table_data(
    table_name: str,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
):
    """
    Get data from a Delta Lake table with pagination (GET method).

    This is a simplified version of the POST /query endpoint for basic pagination.
    For filtering, use the POST /query endpoint.
    """
    try:
        result = read_delta_table(
            table_name=table_name, filters=None, limit=limit, offset=offset
        )
        return DeltaQueryResponse(**result)
    except DeltaWriteError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query table: {str(e)}")
