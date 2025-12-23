from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId
import re


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


class ConnectionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    db_type: Literal["mysql", "postgresql", "file"]
    # Database connection fields (optional for file type)
    host: Optional[str] = None
    port: Optional[int] = None
    database: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    # File connection fields
    file_type: Optional[Literal["csv", "json", "excel"]] = None
    file_paths: Optional[list[str]] = None

    @field_validator('port')
    @classmethod
    def validate_port(cls, v, info):
        # Set default port if not provided
        if v == 0:
            db_type = info.data.get('db_type')
            if db_type == 'mysql':
                return 3306
            elif db_type == 'postgresql':
                return 5432
        return v


class ConnectionCreate(ConnectionBase):
    pass


class ConnectionUpdate(BaseModel):
    name: Optional[str] = None
    db_type: Optional[Literal["mysql", "postgresql", "file"]] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    file_type: Optional[Literal["csv", "json", "excel"]] = None
    file_paths: Optional[list[str]] = None


class ConnectionResponse(ConnectionBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    last_tested_at: Optional[datetime] = None
    last_test_status: Optional[Literal["success", "failed"]] = None
    archived: bool = False
    archived_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class TestConnectionRequest(ConnectionBase):
    pass


class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    details: Optional[dict] = None
