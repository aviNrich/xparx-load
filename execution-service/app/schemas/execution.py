from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class ExecutionRequest(BaseModel):
    """Request to execute an ETL mapping"""
    mapping_id: str = Field(..., description="ID of the mapping to execute")


class ExecutionResponse(BaseModel):
    """Response after ETL execution"""
    execution_id: str = Field(..., description="Unique identifier for this execution")
    mapping_id: str = Field(..., description="ID of the mapping that was executed")
    status: Literal["success", "failed"] = Field(..., description="Execution status")
    rows_written: int = Field(..., description="Number of rows written to Delta Lake")
    execution_time: datetime = Field(..., description="Timestamp of execution")
    delta_table_path: Optional[str] = Field(None, description="Path to Delta Lake table")
    error_message: Optional[str] = Field(None, description="Error message if execution failed")
