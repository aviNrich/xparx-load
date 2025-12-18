from pymongo.database import Database
from bson import ObjectId
from typing import List, Optional
from ..schemas.mapping_run import MappingRunResponse, MappingRunListResponse


class MappingRunService:
    def __init__(self, db: Database):
        self.db = db
        self.mapping_runs_collection = db["mapping_runs"]
        self.mappings_collection = db["mappings"]
        self.connections_collection = db["connections"]

    def list_runs(
        self,
        mapping_id: Optional[str] = None,
        source_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> MappingRunListResponse:
        """
        List mapping runs with optional filters and pagination

        Args:
            mapping_id: Filter by mapping ID
            source_id: Filter by source connection ID
            status: Filter by run status
            limit: Number of runs to return
            offset: Number of runs to skip

        Returns:
            MappingRunListResponse with runs and pagination info
        """
        # Build query filter
        query_filter = {}
        if mapping_id:
            query_filter["mapping_id"] = mapping_id
        if source_id:
            query_filter["source_id"] = source_id
        if status:
            query_filter["status"] = status

        # Get total count
        total_count = self.mapping_runs_collection.count_documents(query_filter)

        # Get paginated runs
        runs = list(
            self.mapping_runs_collection
            .find(query_filter)
            .sort("start_time", -1)  # Most recent first
            .skip(offset)
            .limit(limit)
        )

        # Populate mapping and source names
        for run in runs:
            run["_id"] = str(run["_id"])

            # Populate mapping name
            if run.get("mapping_id"):
                mapping = self.mappings_collection.find_one({"_id": ObjectId(run["mapping_id"])})
                if mapping:
                    run["mapping_name"] = mapping.get("name")

            # Populate source name and type
            if run.get("source_id"):
                connection = self.connections_collection.find_one({"_id": ObjectId(run["source_id"])})
                if connection:
                    run["source_name"] = connection.get("name")
                    run["source_type"] = connection.get("db_type")

        # Calculate has_more
        has_more = (offset + limit) < total_count

        return MappingRunListResponse(
            runs=[MappingRunResponse(**run) for run in runs],
            total_count=total_count,
            limit=limit,
            offset=offset,
            has_more=has_more
        )

    def get_run(self, run_id: str) -> MappingRunResponse:
        """
        Get a single mapping run by run_id

        Args:
            run_id: The unique run identifier

        Returns:
            MappingRunResponse with populated fields

        Raises:
            ValueError: If run not found
        """
        run = self.mapping_runs_collection.find_one({"run_id": run_id})
        if not run:
            raise ValueError(f"Mapping run not found: {run_id}")

        run["_id"] = str(run["_id"])

        # Populate mapping name
        if run.get("mapping_id"):
            mapping = self.mappings_collection.find_one({"_id": ObjectId(run["mapping_id"])})
            if mapping:
                run["mapping_name"] = mapping.get("name")

        # Populate source name and type
        if run.get("source_id"):
            connection = self.connections_collection.find_one({"_id": ObjectId(run["source_id"])})
            if connection:
                run["source_name"] = connection.get("name")
                run["source_type"] = connection.get("db_type")

        return MappingRunResponse(**run)
