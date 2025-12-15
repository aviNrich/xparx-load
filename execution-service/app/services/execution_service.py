from pymongo.database import Database
from bson import ObjectId
from sqlalchemy import create_engine, text
from typing import Dict, List, Any
import pandas as pd
from datetime import datetime
import uuid
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

    def execute_mapping(self, mapping_id: str) -> Dict[str, Any]:
        """
        Execute ETL mapping by ID.

        Returns:
            Dictionary with execution results
        """
        execution_id = str(uuid.uuid4())
        execution_time = datetime.utcnow()
        # get source connection id for logging
        mapping = self.mappings_collection.find_one({"_id": ObjectId(mapping_id)})

        try:
            # Step 1: Retrieve mapping configuration
            mapping_config = self._get_mapping_config(mapping_id)

            # Step 2: Extract source data using Spark JDBC
            source_df = self._extract_source_data(mapping_config)

            # Step 3: Transform data using PySpark operations
            transformed_df = self._transform_data(source_df, mapping_config)

            # Step 4: Write to Delta Lake
            delta_table_path, row_count = write_to_delta_lake(
                df=transformed_df,
                schema_name=mapping_config["target_schema"]["name"],
                schema_fields=mapping_config["target_schema"]["fields"],
                mapping_id=mapping_id,
                execution_time=execution_time.isoformat(),
            )

            # Step 5: Write to target database
            target_result = execute_target_write(
                {
                    "execution_id": execution_id,
                    "mapping_id": mapping_id,
                    "status": "success",
                    "rows_written": row_count,
                    "execution_time": execution_time.isoformat(),
                    "delta_table_path": delta_table_path,
                    "schema_handler": mapping_config["target_schema"]["schema_handler"],
                    "source_id": mapping["source_connection_id"],
                }
            )

            return {
                "execution_id": execution_id,
                "mapping_id": mapping_id,
                "source_id": mapping["source_connection_id"],
                "status": "success",
                "rows_written": row_count,
                "execution_time": execution_time,
                "delta_table_path": delta_table_path,
                "target_write_status": target_result["status"],
                "rows_written_to_target": target_result.get(
                    "rows_written_to_target", 0
                ),
                "target_error_message": target_result.get("error_message"),
                "error_message": None,
            }

        except Exception as e:
            return {
                "execution_id": execution_id,
                "mapping_id": mapping_id,
                "status": "failed",
                "rows_written": 0,
                "execution_time": execution_time,
                "delta_table_path": None,
                "error_message": str(e),
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
