from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, List
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


class SchemaField(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    field_type: Literal["string", "integer", "date", "boolean"]
    description: Optional[str] = None

    @field_validator('name')
    @classmethod
    def validate_field_name(cls, v):
        # Remove leading/trailing whitespace
        v = v.strip()
        if not v:
            raise ValueError("Field name cannot be empty")
        return v


class TableSchemaBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    schema_handler: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    fields: List[SchemaField] = Field(..., min_length=1)

    @field_validator('name')
    @classmethod
    def validate_table_name(cls, v):
        # Remove leading/trailing whitespace
        v = v.strip()
        if not v:
            raise ValueError("Table name cannot be empty")
        return v

    @field_validator('schema_handler')
    @classmethod
    def validate_schema_handler(cls, v):
        import re
        # Remove leading/trailing whitespace
        v = v.strip()
        if not v:
            raise ValueError("Schema handler cannot be empty")
        # Validate snake_case format
        if not re.match(r'^[a-z_][a-z0-9_]*$', v):
            raise ValueError("Schema handler must be in snake_case (lowercase letters, numbers, and underscores only)")
        return v

    @field_validator('fields')
    @classmethod
    def validate_unique_field_names(cls, v):
        if not v:
            raise ValueError("At least one field is required")

        field_names = [field.name.lower() for field in v]
        if len(field_names) != len(set(field_names)):
            raise ValueError("Field names must be unique")

        return v


class TableSchemaCreate(TableSchemaBase):
    pass


class TableSchemaUpdate(BaseModel):
    name: Optional[str] = None
    schema_handler: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[List[SchemaField]] = None

    @field_validator('schema_handler')
    @classmethod
    def validate_schema_handler(cls, v):
        if v is not None:
            import re
            # Remove leading/trailing whitespace
            v = v.strip()
            if not v:
                raise ValueError("Schema handler cannot be empty")
            # Validate snake_case format
            if not re.match(r'^[a-z_][a-z0-9_]*$', v):
                raise ValueError("Schema handler must be in snake_case (lowercase letters, numbers, and underscores only)")
        return v

    @field_validator('fields')
    @classmethod
    def validate_unique_field_names(cls, v):
        if v is not None:
            if not v:
                raise ValueError("At least one field is required")

            field_names = [field.name.lower() for field in v]
            if len(field_names) != len(set(field_names)):
                raise ValueError("Field names must be unique")

        return v


class TableSchemaResponse(TableSchemaBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    archived: bool = False
    archived_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
