from pymongo.database import Database
from bson import ObjectId
from sqlalchemy import create_engine, text
from typing import Dict, List, Any, Optional
import pandas as pd
from datetime import datetime
import uuid
import traceback
import sys
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
from .delta_writer import get_spark_session
from .bronze_writer_class import BronzeWriter
from .silver_writer_class import SilverWriter
from .target_execution import execute_target_write
from ..config import get_settings


class ExecutionService:
    def __init__(self, db: Database):
        self.db = db
        self.mappings_collection = db["mappings"]
        self.connections_collection = db["connections"]
        self.column_mappings_collection = db["column_mappings"]
        self.schemas_collection = db["table_schemas"]
        self.mapping_runs_collection = db["mapping_runs"]

        # Initialize writer classes
        settings = get_settings()
        self.bronze_writer = BronzeWriter(base_path=settings.delta_lake_base_path)
        self.silver_writer = SilverWriter(base_path=settings.delta_lake_base_path)

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
            # Bronze layer tracking
            "bronze_table_path": None,
            "rows_written_to_bronze": 0,
            "bronze_run_id": run_id,
            # Silver layer tracking (renamed from delta)
            "rows_written_to_delta": 0,  # Keep old name for compatibility
            "rows_written_to_silver": 0,
            "rows_written_to_target": 0,
            "delta_table_path": None,
            "silver_table_paths": None,
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
        total_rows_written = 0  # For exception handler

        try:
            # Step 1: Retrieve mapping configuration
            mapping_config = self._get_mapping_config(mapping_id)

            # Step 2: Extract source data using Spark JDBC (done once for all schemas)
            error_stage = "extraction"
            source_df = self._extract_source_data(mapping_config)

            # Step 3: Write to bronze layer (raw SQL query result)
            error_stage = "bronze_write"
            bronze_table_path, bronze_row_count = self.bronze_writer.write(
                df=source_df,
                mapping_id=mapping_id,
                run_id=run_id,
                ingestion_time=start_time.isoformat(),
            )
            print(f"✓ Bronze layer: {bronze_row_count} rows written to {bronze_table_path}", file=sys.stderr)

            # Step 4: Read from bronze layer (for idempotency)
            error_stage = "bronze_read"
            bronze_df = self.bronze_writer.read(mapping_id=mapping_id, run_id=run_id)

            # Step 5-7: Loop through all target schemas (silver layer)
            total_rows_written = 0
            total_rows_to_target = 0
            all_silver_paths = []
            all_target_results = []

            print(f"\n{'='*80}", file=sys.stderr)
            print(f"Starting multi-schema execution for mapping_id={mapping_id}", file=sys.stderr)
            print(f"Total schemas to process: {len(mapping_config['target_schema_configs'])}", file=sys.stderr)
            print(f"{'='*80}\n", file=sys.stderr)

            for idx, schema_config in enumerate(mapping_config["target_schema_configs"]):
                schema_name = schema_config["target_schema"]["name"]
                print(f"\n[{idx + 1}/{len(mapping_config['target_schema_configs'])}] Processing schema: {schema_name}", file=sys.stderr)

                # Step 5: Transform data from bronze for this schema
                error_stage = f"transformation_{schema_name}"
                transformed_df = self._transform_data(bronze_df, {
                    "mapping": mapping_config["mapping"],
                    "connection": mapping_config["connection"],
                    "column_mappings": schema_config["column_mappings"],
                    "target_schema": schema_config["target_schema"],
                })

                # Step 6: Write to silver layer for this schema
                error_stage = f"silver_write_{schema_name}"
                silver_run_id = f"{run_id}_silver_{schema_name}"
                silver_table_path, row_count = self.silver_writer.write(
                    df=transformed_df,
                    schema_name=schema_config["target_schema"]["name"],
                    schema_fields=schema_config["target_schema"]["fields"],
                    mapping_id=mapping_id,
                    run_id=silver_run_id,
                    execution_time=start_time.isoformat(),
                    bronze_run_id=run_id,
                )

                all_silver_paths.append(silver_table_path)
                total_rows_written += row_count

                # Step 7: Write to target database for this schema
                error_stage = f"target_write_{schema_name}"
                target_result = execute_target_write(
                    {
                        "run_id": run_id,
                        "mapping_id": mapping_id,
                        "status": "success",
                        "rows_written": row_count,
                        "execution_time": start_time.isoformat(),
                        "delta_table_path": silver_table_path,  # Use silver path
                        "schema_handler": schema_config["target_schema"]["schema_handler"],
                        "source_id": source_id,
                    }
                )

                all_target_results.append(target_result)
                total_rows_to_target += target_result.get("rows_written_to_target", 0)

                print(f"✓ Completed schema {schema_name}: {row_count} rows written to Silver, {target_result.get('rows_written_to_target', 0)} to target", file=sys.stderr)

            # Calculate duration
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            # Determine final status based on all target writes
            any_failed = any(r["status"] == "failed" for r in all_target_results)
            all_success = all(r["status"] == "success" for r in all_target_results)

            if any_failed:
                final_status = "partial_success" if all_success else "partial_success"
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
                        # Bronze layer
                        "bronze_table_path": bronze_table_path,
                        "rows_written_to_bronze": bronze_row_count,
                        # Silver layer
                        "rows_written_to_delta": total_rows_written,  # Keep old field for compatibility
                        "rows_written_to_silver": total_rows_written,
                        "rows_written_to_target": total_rows_to_target,
                        "delta_table_path": ", ".join(all_silver_paths),  # Keep old field
                        "silver_table_paths": ", ".join(all_silver_paths),
                        "target_write_status": "success" if all_success else "partial_success",
                        "error_message": None,
                        "updated_at": end_time,
                    }
                }
            )

            return {
                "run_id": run_id,
                "mapping_id": mapping_id,
                "source_id": source_id,
                "status": final_status,
                # Bronze layer
                "bronze_table_path": bronze_table_path,
                "rows_written_to_bronze": bronze_row_count,
                # Silver layer
                "rows_written": total_rows_written,
                "rows_written_to_silver": total_rows_written,
                "execution_time": start_time,
                "delta_table_path": ", ".join(all_silver_paths),  # Keep old field
                "silver_table_paths": ", ".join(all_silver_paths),
                "target_write_status": "success" if all_success else "partial_success",
                "rows_written_to_target": total_rows_to_target,
                "target_error_message": None,
                "error_message": None,
            }

        except Exception as e:
            # Calculate duration
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            # Get stack trace
            stack_trace = traceback.format_exc()

            # LOG TO STDOUT with full stack trace
            print(f"\n{'='*80}", file=sys.stderr)
            print(f"ERROR in execution for mapping_id={mapping_id}, run_id={run_id}", file=sys.stderr)
            print(f"Error Stage: {error_stage}", file=sys.stderr)
            print(f"Error Message: {str(e)}", file=sys.stderr)
            print(f"Full Stack Trace:", file=sys.stderr)
            print(stack_trace, file=sys.stderr)
            print(f"{'='*80}\n", file=sys.stderr)

            # Update run record in MongoDB with error_message AND stack trace
            self.mapping_runs_collection.update_one(
                {"run_id": run_id},
                {
                    "$set": {
                        "status": "failed",
                        "end_time": end_time,
                        "duration_seconds": duration,
                        "rows_written_to_delta": total_rows_written,  # Use total for multi-schema
                        "delta_table_path": delta_table_path,
                        "error_stage": error_stage,
                        "error_message": str(e),
                        "error_stack_trace": stack_trace,  # Already saving to MongoDB
                        "updated_at": end_time,
                    }
                }
            )

            # Return response with error_message AND stack_trace
            return {
                "run_id": run_id,
                "mapping_id": mapping_id,
                "source_id": source_id,
                "status": "failed",
                "rows_written": total_rows_written,  # Use total for multi-schema
                "execution_time": start_time,
                "delta_table_path": delta_table_path,
                "error_message": str(e),
                "error_stack_trace": stack_trace,  # Include in response
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

        # Load all target schemas
        if "target_schemas" not in column_mapping or not column_mapping["target_schemas"]:
            raise ColumnMappingNotFoundError(
                f"No target schemas configured for mapping: {mapping_id}"
            )

        target_schema_configs = []
        for schema_config in column_mapping["target_schemas"]:
            target_schema_id = schema_config["schema_id"]
            column_mappings_list = schema_config["column_mappings"]

            # Get target schema from DB
            target_schema = self.schemas_collection.find_one(
                {"_id": ObjectId(target_schema_id)}
            )
            if not target_schema:
                raise SchemaNotFoundError(
                    f"Target schema not found: {target_schema_id}"
                )

            target_schema_configs.append({
                "column_mappings": column_mappings_list,
                "target_schema": target_schema,
            })

        return {
            "mapping": mapping,
            "connection": connection,
            "target_schema_configs": target_schema_configs,
        }

    def _extract_source_data(self, config: Dict[str, Any]) -> DataFrame:
        """Extract data from source (database or file) using Spark for distributed loading"""
        connection = config["connection"]
        mapping = config["mapping"]
        db_type = connection["db_type"]

        try:
            # Get Spark session
            spark = get_spark_session()

            if db_type in ["mysql", "postgresql"]:
                # Database source - use JDBC
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

            elif db_type == "file":
                # File source - load files and execute SQL
                file_type = connection.get("file_type", "csv")
                file_paths = connection.get("file_paths", [])

                if not file_paths:
                    raise SourceConnectionError("No files found in connection")

                # Read all files based on file type
                from functools import reduce
                if file_type == "csv":
                    dfs = [spark.read.csv(fp, header=True, inferSchema=True) for fp in file_paths]
                elif file_type == "json":
                    dfs = [spark.read.json(fp) for fp in file_paths]
                elif file_type == "excel":
                    dfs = [spark.read.format("com.crealytics.spark.excel")
                          .option("header", "true")
                          .option("inferSchema", "true")
                          .load(fp) for fp in file_paths]
                else:
                    raise SourceConnectionError(f"Unsupported file type: {file_type}")

                # Union all dataframes if multiple files
                df = dfs[0] if len(dfs) == 1 else reduce(lambda a, b: a.union(b), dfs)

                # Create temp view named "file"
                df.createOrReplaceTempView("file")

                # Execute SQL query
                df = spark.sql(mapping["sql_query"])

            else:
                raise SourceConnectionError(f"Unsupported connection type: {db_type}")

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

            # Add entity columns if specified (always cast to string for consistency)
            if mapping.get("entity_root_id_column") and \
               mapping["entity_root_id_column"] in source_df.columns:
                columns_to_select.append(
                    F.col(mapping["entity_root_id_column"]).cast("string").alias("entity_root_id")
                )

            if mapping.get("entity_id_column") and \
               mapping["entity_id_column"] in source_df.columns:
                columns_to_select.append(
                    F.col(mapping["entity_id_column"]).cast("string").alias("entity_id")
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
