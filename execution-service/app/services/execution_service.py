from pymongo.database import Database
from bson import ObjectId
from sqlalchemy import create_engine, text
from typing import Dict, List, Any, Optional
import pandas as pd
from datetime import datetime
import uuid
import traceback
from pyspark.sql import DataFrame, functions as F
from pyspark.sql.column import Column
from ..utils.exceptions import (
    MappingNotFoundError,
    ConnectionNotFoundError,
    ColumnMappingNotFoundError,
    SchemaNotFoundError,
    SourceConnectionError,
    SourceQueryError,
    TransformationError,
)
from ..utils.encryption import decrypt_password
from .delta_writer import write_to_delta_lake, get_spark_session
from .target_execution import execute_target_write


class ExecutionService:
    def __init__(self, db: Database):
        self.db = db
        self.mappings_collection = db["mappings"]
        self.connections_collection = db["connections"]
        self.column_mappings_collection = db["column_mappings"]
        self.schemas_collection = db["table_schemas"]
        self.mapping_runs_collection = db["mapping_runs"]

    def execute_mapping(
        self,
        mapping_id: str,
        trigger_type: str = "manual",
        schedule_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute ETL mapping by ID.

        Returns:
            Dictionary with execution results
        """
        run_id = str(uuid.uuid4())
        start_time = datetime.utcnow()

        # get source connection id for logging
        mapping = self.mappings_collection.find_one({"_id": ObjectId(mapping_id)})
        source_id = mapping["source_connection_id"] if mapping else None

        # Create initial run record in MongoDB
        run_record = {
            "run_id": run_id,
            "mapping_id": mapping_id,
            "source_id": source_id,
            "trigger_type": trigger_type,
            "schedule_id": schedule_id,
            "status": "running",
            "start_time": start_time,
            "end_time": None,
            "duration_seconds": None,
            "rows_written_to_delta": 0,
            "rows_written_to_target": 0,
            "delta_table_path": None,
            "error_stage": None,
            "error_message": None,
            "error_stack_trace": None,
            "target_write_status": None,
            "created_at": start_time,
            "updated_at": start_time,
        }
        self.mapping_runs_collection.insert_one(run_record)

        error_stage = None
        delta_table_path = None
        row_count = 0

        try:
            # Step 1: Retrieve mapping configuration
            mapping_config = self._get_mapping_config(mapping_id)

            # Step 2: Extract source data using Spark JDBC
            error_stage = "extraction"
            source_df = self._extract_source_data(mapping_config)

            # Step 3: Transform data using PySpark operations
            error_stage = "transformation"
            transformed_df = self._transform_data(source_df, mapping_config)

            # Step 4: Write to Delta Lake
            error_stage = "delta_write"
            delta_table_path, row_count = write_to_delta_lake(
                df=transformed_df,
                schema_name=mapping_config["target_schema"]["name"],
                schema_fields=mapping_config["target_schema"]["fields"],
                mapping_id=mapping_id,
                run_id=run_id,
                execution_time=start_time.isoformat(),
            )

            # Step 5: Write to target database
            error_stage = "target_write"
            target_result = execute_target_write(
                {
                    "run_id": run_id,
                    "mapping_id": mapping_id,
                    "status": "success",
                    "rows_written": row_count,
                    "execution_time": start_time.isoformat(),
                    "delta_table_path": delta_table_path,
                    "schema_handler": mapping_config["target_schema"]["schema_handler"],
                    "source_id": source_id,
                }
            )

            # Calculate duration
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            # Determine final status
            if target_result["status"] == "failed":
                final_status = "partial_success"
            else:
                final_status = "success"

            # Update run record in MongoDB
            self.mapping_runs_collection.update_one(
                {"run_id": run_id},
                {
                    "$set": {
                        "status": final_status,
                        "end_time": end_time,
                        "duration_seconds": duration,
                        "rows_written_to_delta": row_count,
                        "rows_written_to_target": target_result.get("rows_written_to_target", 0),
                        "delta_table_path": delta_table_path,
                        "target_write_status": target_result["status"],
                        "error_message": target_result.get("error_message"),
                        "updated_at": end_time,
                    }
                }
            )

            return {
                "run_id": run_id,
                "mapping_id": mapping_id,
                "source_id": source_id,
                "status": final_status,
                "rows_written": row_count,
                "execution_time": start_time,
                "delta_table_path": delta_table_path,
                "target_write_status": target_result["status"],
                "rows_written_to_target": target_result.get("rows_written_to_target", 0),
                "target_error_message": target_result.get("error_message"),
                "error_message": None,
            }

        except Exception as e:
            # Calculate duration
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            # Get stack trace
            stack_trace = traceback.format_exc()

            # Update run record in MongoDB
            self.mapping_runs_collection.update_one(
                {"run_id": run_id},
                {
                    "$set": {
                        "status": "failed",
                        "end_time": end_time,
                        "duration_seconds": duration,
                        "rows_written_to_delta": row_count,
                        "delta_table_path": delta_table_path,
                        "error_stage": error_stage,
                        "error_message": str(e),
                        "error_stack_trace": stack_trace,
                        "updated_at": end_time,
                    }
                }
            )

            return {
                "run_id": run_id,
                "mapping_id": mapping_id,
                "source_id": source_id,
                "status": "failed",
                "rows_written": row_count,
                "execution_time": start_time,
                "delta_table_path": delta_table_path,
                "error_message": str(e),
                "error_stage": error_stage,
            }

    def _get_mapping_config(self, mapping_id: str) -> Dict[str, Any]:
        """Retrieve complete mapping configuration from MongoDB"""
        # Get mapping
        mapping = self.mappings_collection.find_one({"_id": ObjectId(mapping_id)})
        if not mapping:
            raise MappingNotFoundError(f"Mapping not found: {mapping_id}")

        # Get connection
        connection = self.connections_collection.find_one(
            {"_id": ObjectId(mapping["source_connection_id"])}
        )
        if not connection:
            raise ConnectionNotFoundError(
                f"Connection not found: {mapping['source_connection_id']}"
            )

        # Get column mappings
        column_mapping = self.column_mappings_collection.find_one(
            {"mapping_id": mapping_id}
        )
        if not column_mapping:
            raise ColumnMappingNotFoundError(
                f"Column mapping not found for mapping: {mapping_id}"
            )

        # Get target schema
        target_schema = self.schemas_collection.find_one(
            {"_id": ObjectId(column_mapping["target_schema_id"])}
        )
        if not target_schema:
            raise SchemaNotFoundError(
                f"Target schema not found: {column_mapping['target_schema_id']}"
            )

        return {
            "mapping": mapping,
            "connection": connection,
            "column_mappings": column_mapping["column_mappings"],
            "target_schema": target_schema,
        }

    def _extract_source_data(self, config: Dict[str, Any]) -> DataFrame:
        """Extract data from source database using Spark JDBC for distributed loading"""
        connection = config["connection"]
        mapping = config["mapping"]

        try:
            # Build JDBC connection properties
            db_type = connection["db_type"]
            username = connection["username"]
            password = decrypt_password(connection["password"])
            host = connection["host"]
            port = connection["port"]
            database = connection["database"]

            if db_type == "mysql":
                jdbc_url = f"jdbc:mysql://{host}:{port}/{database}"
                driver = "com.mysql.cj.jdbc.Driver"
            elif db_type == "postgresql":
                jdbc_url = f"jdbc:postgresql://{host}:{port}/{database}"
                driver = "org.postgresql.Driver"
            else:
                raise SourceConnectionError(f"Unsupported database type: {db_type}")

            # Get Spark session
            spark = get_spark_session()

            # Read using Spark JDBC with query pushdown
            df = spark.read \
                .format("jdbc") \
                .option("url", jdbc_url) \
                .option("query", mapping["sql_query"]) \
                .option("user", username) \
                .option("password", password) \
                .option("driver", driver) \
                .option("fetchsize", "10000") \
                .option("numPartitions", "4") \
                .load()

            return df

        except Exception as e:
            raise SourceQueryError(f"Failed to extract source data: {str(e)}")

    def _transform_data(
        self, source_df: DataFrame, config: Dict[str, Any]
    ) -> DataFrame:
        """Apply transformations to source data using PySpark operations"""
        try:
            column_mappings = config["column_mappings"]
            mapping = config["mapping"]

            # Collect all column expressions to select
            columns_to_select = []

            # Apply each column mapping
            for mapping_config in column_mappings:
                mapping_type = mapping_config["type"]

                if mapping_type == "direct":
                    col_expr = self._apply_direct_mapping(source_df, mapping_config)
                    columns_to_select.append(col_expr)

                elif mapping_type == "split":
                    col_exprs = self._apply_split_mapping(source_df, mapping_config)
                    columns_to_select.extend(col_exprs)

                elif mapping_type == "join":
                    col_expr = self._apply_join_mapping(source_df, mapping_config)
                    columns_to_select.append(col_expr)

                else:
                    raise TransformationError(f"Unknown mapping type: {mapping_type}")

            # Add entity columns if specified
            if mapping.get("entity_root_id_column") and \
               mapping["entity_root_id_column"] in source_df.columns:
                columns_to_select.append(
                    F.col(mapping["entity_root_id_column"]).alias("entity_root_id")
                )

            if mapping.get("entity_id_column") and \
               mapping["entity_id_column"] in source_df.columns:
                columns_to_select.append(
                    F.col(mapping["entity_id_column"]).alias("entity_id")
                )

            # Apply all transformations in a single select statement
            result_df = source_df.select(*columns_to_select)

            return result_df

        except Exception as e:
            raise TransformationError(f"Data transformation failed: {str(e)}")

    def _apply_direct_mapping(
        self, source_df: DataFrame, mapping: Dict[str, Any]
    ) -> Column:
        """Return a Spark Column for direct mapping"""
        source_column = mapping["source_column"]
        target_field = mapping["target_field"]

        if source_column not in source_df.columns:
            raise TransformationError(f"Source column not found: {source_column}")

        return F.col(source_column).alias(target_field)

    def _apply_split_mapping(
        self, source_df: DataFrame, mapping: Dict[str, Any]
    ) -> List[Column]:
        """Return list of Spark Columns for split mapping"""
        source_column = mapping["source_column"]
        delimiter = mapping["delimiter"]
        target_fields = mapping["target_fields"]

        if source_column not in source_df.columns:
            raise TransformationError(f"Source column not found: {source_column}")

        # Use Spark split() function
        split_col = F.split(F.col(source_column), delimiter)

        # Create column expressions for each target field
        columns = []
        for idx, target_field in enumerate(target_fields):
            # getItem extracts array element (null if out of bounds)
            col_expr = split_col.getItem(idx).alias(target_field)
            columns.append(col_expr)

        return columns

    def _apply_join_mapping(
        self, source_df: DataFrame, mapping: Dict[str, Any]
    ) -> Column:
        """Return Spark Column for join mapping using concat_ws"""
        source_columns = mapping["source_columns"]
        separator = mapping["separator"]
        target_field = mapping["target_field"]

        # Validate source columns exist
        for col in source_columns:
            if col not in source_df.columns:
                raise TransformationError(f"Source column not found: {col}")

        # Use concat_ws (concat with separator) - handles nulls gracefully
        # Cast all columns to string first
        string_cols = [F.col(col).cast("string") for col in source_columns]

        return F.concat_ws(separator, *string_cols).alias(target_field)
