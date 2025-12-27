from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Any, Union, Literal, Annotated, Dict
from datetime import datetime
from bson import ObjectId
import re


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


class UniqueValuesRequest(BaseModel):
    connection_id: str
    sql_query: str
    column_name: str


class UniqueValuesResponse(BaseModel):
    column_name: str
    unique_values: List[str]
    total_count: int


# Future use for Phase 2
class MappingBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    source_connection_id: str
    sql_query: str
    entity_root_id_column: Optional[str] = None  # Entity root ID column (e.g., "poi_id")
    entity_id_column: Optional[str] = None  # Row ID column (e.g., "id")


class MappingCreate(MappingBase):
    pass


class MappingUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    source_connection_id: Optional[str] = None
    sql_query: Optional[str] = None
    entity_root_id_column: Optional[str] = None
    entity_id_column: Optional[str] = None


class MappingResponse(MappingBase):
    id: str = Field(alias="_id")
    source_name: Optional[str] = None  # Populated from connection name
    source_type: Optional[str] = None  # Populated from connection db_type
    created_at: datetime
    updated_at: datetime
    archived: bool = False
    archived_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


# Column Mapping Models for Phase 2

class DirectMapping(BaseModel):
    type: Literal["direct"]
    source_column: str
    target_field: str
    enum_value_mappings: Optional[Dict[str, str]] = None  # For enum fields: source_value -> enum_key


class SplitMapping(BaseModel):
    type: Literal["split"]
    source_column: str
    delimiter: str
    target_fields: List[str]  # Ordered positions


class JoinMapping(BaseModel):
    type: Literal["join"]
    source_columns: List[str]  # Ordered
    separator: str
    target_field: str


# Discriminated union for all mapping types
ColumnMapping = Annotated[
    Union[DirectMapping, SplitMapping, JoinMapping],
    Field(discriminator="type")
]


# NEW: Schema configuration (multiple schemas support)
class SchemaConfiguration(BaseModel):
    schema_id: str
    column_mappings: List[ColumnMapping]


class ColumnMappingConfigurationBase(BaseModel):
    mapping_id: str
    # NEW: Support array of schema configurations
    target_schemas: List[SchemaConfiguration]


class ColumnMappingCreate(ColumnMappingConfigurationBase):
    pass


class ColumnMappingResponse(ColumnMappingConfigurationBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    archived: bool = False
    archived_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
