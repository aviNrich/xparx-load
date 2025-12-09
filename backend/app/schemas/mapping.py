from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from bson import ObjectId


class TableInfoResponse(BaseModel):
    table_name: str
    table_schema: Optional[str] = None
    table_type: Optional[str] = None
    row_count: Optional[int] = None  # Estimated row count


class SqlPreviewRequest(BaseModel):
    connection_id: str
    sql_query: str


class SqlPreviewResponse(BaseModel):
    columns: List[str]
    rows: List[List[Any]]
    row_count: int


# Future use for Phase 2
class MappingBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    source_connection_id: str
    source_table: str
    sql_query: str


class MappingCreate(MappingBase):
    pass


class MappingUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    source_connection_id: Optional[str] = None
    source_table: Optional[str] = None
    sql_query: Optional[str] = None


class MappingResponse(MappingBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
