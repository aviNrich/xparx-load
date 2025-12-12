from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TargetDatabaseConfig(BaseModel):
    """PostgreSQL target database configuration"""
    host: str = Field(..., min_length=1, description="Database host")
    port: int = Field(default=5432, ge=1, le=65535, description="Database port")
    database: str = Field(..., min_length=1, description="Database name")
    username: str = Field(..., min_length=1, description="Username")
    password: str = Field(..., min_length=1, description="Password")


class SystemSettings(BaseModel):
    """System settings document"""
    target_db: Optional[TargetDatabaseConfig] = Field(None, description="Target PostgreSQL database configuration")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SystemSettingsResponse(SystemSettings):
    """Response model with password masked"""
    pass

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TargetDatabaseUpdate(BaseModel):
    """Update target database configuration"""
    host: str = Field(..., min_length=1)
    port: int = Field(default=5432, ge=1, le=65535)
    database: str = Field(..., min_length=1)
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class TestConnectionResult(BaseModel):
    """Test connection result"""
    success: bool
    message: str
    details: Optional[dict] = None