from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class DeltaQueryRequest(BaseModel):
    """Request to query data from a Delta table"""
    table_name: str = Field(..., description="Name of the delta table to query")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="Field filters (field_name: value)")
    limit: int = Field(default=100, ge=1, le=1000, description="Maximum number of rows to return")
    offset: int = Field(default=0, ge=0, description="Number of rows to skip")


class ColumnInfo(BaseModel):
    """Information about a table column"""
    name: str = Field(..., description="Column name")
    type: str = Field(..., description="Column data type")


class DeltaQueryResponse(BaseModel):
    """Response containing queried Delta table data"""
    data: List[Dict[str, Any]] = Field(..., description="Array of row data")
    total_count: int = Field(..., description="Total number of rows matching filters")
    columns: List[ColumnInfo] = Field(..., description="Column information")
    limit: int = Field(..., description="Limit applied to query")
    offset: int = Field(..., description="Offset applied to query")


class TableSchemaResponse(BaseModel):
    """Response containing Delta table schema information"""
    table_name: str = Field(..., description="Name of the table")
    table_path: str = Field(..., description="Path to the Delta table")
    columns: List[ColumnInfo] = Field(..., description="Column information")
