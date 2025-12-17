from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.database import Database
from typing import List, Optional
from datetime import datetime
from ..database import get_database
from ..schemas.mapping_run import MappingRunResponse

router = APIRouter(prefix="/mapping-runs", tags=["mapping-runs"])


@router.get("/{run_id}", response_model=MappingRunResponse)
async def get_mapping_run(
    run_id: str,
    db: Database = Depends(get_database)
):
    """
    Get a specific mapping run by run_id
    """
    runs_collection = db["mapping_runs"]
    run = runs_collection.find_one({"run_id": run_id})

    if not run:
        raise HTTPException(status_code=404, detail=f"Run not found: {run_id}")

    # Convert ObjectId to string for response
    run["_id"] = str(run["_id"])

    return MappingRunResponse(**run)


@router.get("/mapping/{mapping_id}", response_model=List[MappingRunResponse])
async def get_mapping_runs_by_mapping(
    mapping_id: str,
    limit: int = Query(50, description="Maximum number of runs to return"),
    skip: int = Query(0, description="Number of runs to skip"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Database = Depends(get_database)
):
    """
    Get all runs for a specific mapping, sorted by start time (most recent first)
    """
    runs_collection = db["mapping_runs"]

    # Build query filter
    query_filter = {"mapping_id": mapping_id}
    if status:
        query_filter["status"] = status

    # Query with pagination
    cursor = runs_collection.find(query_filter).sort("start_time", -1).skip(skip).limit(limit)
    runs = list(cursor)

    # Convert ObjectId to string for response
    for run in runs:
        run["_id"] = str(run["_id"])

    return [MappingRunResponse(**run) for run in runs]


@router.get("/source/{source_id}", response_model=List[MappingRunResponse])
async def get_mapping_runs_by_source(
    source_id: str,
    limit: int = Query(50, description="Maximum number of runs to return"),
    skip: int = Query(0, description="Number of runs to skip"),
    db: Database = Depends(get_database)
):
    """
    Get all runs for a specific source connection
    """
    runs_collection = db["mapping_runs"]

    cursor = runs_collection.find({"source_id": source_id}).sort("start_time", -1).skip(skip).limit(limit)
    runs = list(cursor)

    # Convert ObjectId to string for response
    for run in runs:
        run["_id"] = str(run["_id"])

    return [MappingRunResponse(**run) for run in runs]


@router.get("/", response_model=List[MappingRunResponse])
async def get_all_mapping_runs(
    limit: int = Query(100, description="Maximum number of runs to return"),
    skip: int = Query(0, description="Number of runs to skip"),
    status: Optional[str] = Query(None, description="Filter by status"),
    trigger_type: Optional[str] = Query(None, description="Filter by trigger type"),
    start_date: Optional[datetime] = Query(None, description="Filter runs after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter runs before this date"),
    db: Database = Depends(get_database)
):
    """
    Get all mapping runs with optional filtering
    """
    runs_collection = db["mapping_runs"]

    # Build query filter
    query_filter = {}
    if status:
        query_filter["status"] = status
    if trigger_type:
        query_filter["trigger_type"] = trigger_type
    if start_date or end_date:
        query_filter["start_time"] = {}
        if start_date:
            query_filter["start_time"]["$gte"] = start_date
        if end_date:
            query_filter["start_time"]["$lte"] = end_date

    # Query with pagination
    cursor = runs_collection.find(query_filter).sort("start_time", -1).skip(skip).limit(limit)
    runs = list(cursor)

    # Convert ObjectId to string for response
    for run in runs:
        run["_id"] = str(run["_id"])

    return [MappingRunResponse(**run) for run in runs]


@router.get("/stats/summary")
async def get_runs_summary(
    mapping_id: Optional[str] = Query(None, description="Filter by mapping_id"),
    db: Database = Depends(get_database)
):
    """
    Get summary statistics for mapping runs
    """
    runs_collection = db["mapping_runs"]

    # Build match filter
    match_filter = {}
    if mapping_id:
        match_filter["mapping_id"] = mapping_id

    # Aggregate statistics
    pipeline = [
        {"$match": match_filter} if match_filter else {"$match": {}},
        {
            "$group": {
                "_id": None,
                "total_runs": {"$sum": 1},
                "success_count": {
                    "$sum": {"$cond": [{"$eq": ["$status", "success"]}, 1, 0]}
                },
                "failed_count": {
                    "$sum": {"$cond": [{"$eq": ["$status", "failed"]}, 1, 0]}
                },
                "partial_success_count": {
                    "$sum": {"$cond": [{"$eq": ["$status", "partial_success"]}, 1, 0]}
                },
                "running_count": {
                    "$sum": {"$cond": [{"$eq": ["$status", "running"]}, 1, 0]}
                },
                "total_rows_to_delta": {"$sum": "$rows_written_to_delta"},
                "total_rows_to_target": {"$sum": "$rows_written_to_target"},
                "avg_duration": {"$avg": "$duration_seconds"},
            }
        }
    ]

    result = list(runs_collection.aggregate(pipeline))

    if not result:
        return {
            "total_runs": 0,
            "success_count": 0,
            "failed_count": 0,
            "partial_success_count": 0,
            "running_count": 0,
            "total_rows_to_delta": 0,
            "total_rows_to_target": 0,
            "avg_duration": 0,
        }

    summary = result[0]
    summary.pop("_id", None)

    return summary
