from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime


class MappingRunCreate(BaseModel):
    """Schema for creating a new mapping run record"""
    run_id: str = Field(..., description="Unique identifier for this run")
    mapping_id: str = Field(..., description="ID of the mapping being executed")
    source_id: str = Field(..., description="ID of the source connection")
    trigger_type: Literal["manual", "scheduled"] = Field(..., description="How the run was triggered")
    schedule_id: Optional[str] = Field(None, description="Schedule ID if triggered by scheduler")
    status: Literal["running", "success", "failed", "partial_success"] = Field(..., description="Current status of the run")
    start_time: datetime = Field(..., description="When the run started")
    end_time: Optional[datetime] = Field(None, description="When the run completed")
    duration_seconds: Optional[float] = Field(None, description="Duration of the run in seconds")

    # Data metrics
    rows_written_to_delta: int = Field(0, description="Number of rows written to Delta Lake")
    rows_written_to_target: int = Field(0, description="Number of rows written to target database")

    # Paths and references
    delta_table_path: Optional[str] = Field(None, description="Path to Delta Lake table")

    # Error tracking
    error_stage: Optional[Literal["extraction", "transformation", "delta_write", "target_write"]] = Field(None, description="Stage where error occurred")
    error_message: Optional[str] = Field(None, description="Error message if run failed")
    error_stack_trace: Optional[str] = Field(None, description="Full stack trace if run failed")

    # Additional metadata
    target_write_status: Optional[str] = Field(None, description="Status of target write operation")


class MappingRunResponse(MappingRunCreate):
    """Schema for mapping run response from MongoDB"""
    id: str = Field(alias='_id')
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class MappingRunUpdate(BaseModel):
    """Schema for updating a mapping run record"""
    status: Optional[Literal["running", "success", "failed", "partial_success"]] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    rows_written_to_delta: Optional[int] = None
    rows_written_to_target: Optional[int] = None
    delta_table_path: Optional[str] = None
    error_stage: Optional[Literal["extraction", "transformation", "delta_write", "target_write"]] = None
    error_message: Optional[str] = None
    error_stack_trace: Optional[str] = None
    target_write_status: Optional[str] = None
