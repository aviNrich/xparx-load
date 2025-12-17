from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database
from ..database import get_database
from ..schemas.execution import ExecutionRequest, ExecutionResponse
from ..services.execution_service import ExecutionService

router = APIRouter(prefix="/executions", tags=["executions"])


def get_execution_service(db: Database = Depends(get_database)) -> ExecutionService:
    """Dependency injection for ExecutionService"""
    return ExecutionService(db)


@router.post("/run", response_model=ExecutionResponse)
async def run_execution(
    request: ExecutionRequest,
    service: ExecutionService = Depends(get_execution_service)
):
    """
    Execute an ETL mapping by ID.

    This endpoint:
    1. Retrieves the mapping configuration from MongoDB
    2. Executes the source SQL query
    3. Applies transformations (direct, split, join)
    4. Writes the result to Delta Lake with schema validation
    5. Returns execution status and metadata

    If execution fails, the response will include an error_message and status="failed".
    Delta Lake's ACID properties ensure no partial writes occur on failure.
    """
    result = service.execute_mapping(
        mapping_id=request.mapping_id,
        trigger_type=request.trigger_type,
        schedule_id=request.schedule_id
    )
    return ExecutionResponse(**result)


@router.get("/health")
async def health_check():
    """Health check endpoint for the execution service"""
    return {
        "status": "healthy",
        "service": "ETL Execution Service"
    }
