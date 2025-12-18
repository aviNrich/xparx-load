from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal, List
from datetime import datetime


class MappingRunResponse(BaseModel):
    """Schema for mapping run response with populated fields"""
    id: str = Field(alias='_id')
    run_id: str = Field(..., description="Unique identifier for this run")
    mapping_id: str = Field(..., description="ID of the mapping being executed")
    mapping_name: Optional[str] = Field(None, description="Name of the mapping (populated)")
    source_id: str = Field(..., description="ID of the source connection")
    source_name: Optional[str] = Field(None, description="Name of the source (populated)")
    source_type: Optional[str] = Field(None, description="Type of the source database (populated)")
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
    error_stage: Optional[str] = Field(None, description="Stage where error occurred")
    error_message: Optional[str] = Field(None, description="Error message if run failed")
    error_stack_trace: Optional[str] = Field(None, description="Full stack trace if run failed")

    # Additional metadata
    target_write_status: Optional[str] = Field(None, description="Status of target write operation")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class MappingRunListResponse(BaseModel):
    """Schema for paginated list of mapping runs"""
    runs: List[MappingRunResponse]
    total_count: int
    limit: int
    offset: int
    has_more: bool
