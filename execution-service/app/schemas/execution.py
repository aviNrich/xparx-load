from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class ExecutionRequest(BaseModel):
    """Request to execute an ETL mapping"""
    mapping_id: str = Field(..., description="ID of the mapping to execute")
    trigger_type: Literal["manual", "scheduled"] = Field("manual", description="How the run was triggered")
    schedule_id: Optional[str] = Field(None, description="Schedule ID if triggered by scheduler")


class ExecutionResponse(BaseModel):
    """Response after ETL execution"""
    run_id: str = Field(..., description="Unique identifier for this run")
    mapping_id: str = Field(..., description="ID of the mapping that was executed")
    source_id: Optional[str] = Field(None, description="ID of the source connection")
    status: Literal["success", "failed", "partial_success"] = Field(..., description="Execution status")
    rows_written: int = Field(..., description="Number of rows written to Delta Lake")
    execution_time: datetime = Field(..., description="Timestamp of execution")
    delta_table_path: Optional[str] = Field(None, description="Path to Delta Lake table")
    error_message: Optional[str] = Field(None, description="Error message if execution failed")
    error_stack_trace: Optional[str] = Field(None, description="Full error stack trace if execution failed")
    error_stage: Optional[str] = Field(None, description="Stage where error occurred if execution failed")
    target_write_status: Optional[str] = Field(None, description="Status of target write operation")
    rows_written_to_target: Optional[int] = Field(None, description="Number of rows written to target database")
