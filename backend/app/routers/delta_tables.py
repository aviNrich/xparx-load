from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
import httpx
from ..config import get_settings

settings = get_settings()
router = APIRouter(prefix="/delta-tables", tags=["delta-tables"])


@router.post("/query")
async def query_delta_table(request: Dict[str, Any]):
    """
    Proxy request to execution service to query Delta table data with filters.

    Body parameters:
    - table_name: Name of the delta table
    - filters: Optional dictionary of field filters
    - limit: Maximum rows to return (default: 100)
    - offset: Number of rows to skip (default: 0)
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.execution_service_url}/delta-tables/query",
                json=request,
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
            status_code=503,
            detail=f"Could not connect to execution service: {str(e)}"
        )


@router.get("/{table_name}/schema")
async def get_delta_table_schema(table_name: str):
    """
    Proxy request to execution service to get Delta table schema information.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{settings.execution_service_url}/delta-tables/{table_name}/schema"
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
            status_code=503,
            detail=f"Could not connect to execution service: {str(e)}"
        )


@router.get("/{table_name}")
async def get_delta_table_data(
    table_name: str,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
):
    """
    Proxy request to execution service to get Delta table data with pagination.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{settings.execution_service_url}/delta-tables/{table_name}",
                params={"limit": limit, "offset": offset}
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
            status_code=503,
            detail=f"Could not connect to execution service: {str(e)}"
        )
