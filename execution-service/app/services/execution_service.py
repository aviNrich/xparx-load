from pymongo.database import Database
from bson import ObjectId
from sqlalchemy import create_engine, text
from typing import Dict, List, Any
import pandas as pd
from datetime import datetime
import uuid
from ..utils.exceptions import (
    MappingNotFoundError,
    ConnectionNotFoundError,
    ColumnMappingNotFoundError,
    SchemaNotFoundError,
    SourceConnectionError,
    SourceQueryError,
    TransformationError
)
from ..utils.encryption import decrypt_password
from .delta_writer import write_to_delta_lake


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

        try:
            # Step 1: Retrieve mapping configuration
            mapping_config = self._get_mapping_config(mapping_id)

            # Step 2: Extract source data
            source_data = self._extract_source_data(mapping_config)

            # Step 3: Transform data
            transformed_data = self._transform_data(source_data, mapping_config)

            # Step 4: Write to Delta Lake
            delta_table_path, row_count = write_to_delta_lake(
                data=transformed_data,
                schema_name=mapping_config["target_schema"]["name"],
                schema_fields=mapping_config["target_schema"]["fields"],
                mapping_id=mapping_id,
                execution_time=execution_time.isoformat()
            )

            return {
                "execution_id": execution_id,
                "mapping_id": mapping_id,
                "status": "success",
                "rows_written": row_count,
                "execution_time": execution_time,
                "delta_table_path": delta_table_path,
                "error_message": None
            }

        except Exception as e:
            return {
                "execution_id": execution_id,
                "mapping_id": mapping_id,
                "status": "failed",
                "rows_written": 0,
                "execution_time": execution_time,
                "delta_table_path": None,
                "error_message": str(e)
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
            "target_schema": target_schema
        }

    def _extract_source_data(self, config: Dict[str, Any]) -> pd.DataFrame:
        """Extract data from source database"""
        connection = config["connection"]
        mapping = config["mapping"]

        try:
            # Build connection string
            db_type = connection["db_type"]
            username = connection["username"]
            password = decrypt_password(connection["password"])
            host = connection["host"]
            port = connection["port"]
            database = connection["database"]

            if db_type == "mysql":
                connection_string = (
                    f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
                )
            elif db_type == "postgresql":
                connection_string = (
                    f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}"
                )
            else:
                raise SourceConnectionError(f"Unsupported database type: {db_type}")

            # Execute query
            engine = create_engine(connection_string)
            with engine.connect() as conn:
                result = conn.execute(text(mapping["sql_query"]))
                df = pd.DataFrame(result.fetchall(), columns=result.keys())

            return df

        except Exception as e:
            raise SourceQueryError(f"Failed to extract source data: {str(e)}")

    def _transform_data(
        self,
        source_df: pd.DataFrame,
        config: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Apply transformations to source data"""
        try:
            column_mappings = config["column_mappings"]
            target_schema_fields = config["target_schema"]["fields"]
            mapping = config["mapping"]

            # Initialize target DataFrame with expected columns
            target_columns = [field["name"] for field in target_schema_fields]
            result_df = pd.DataFrame(columns=target_columns)

            # Apply each column mapping
            for mapping_config in column_mappings:
                mapping_type = mapping_config["type"]

                if mapping_type == "direct":
                    self._apply_direct_mapping(source_df, result_df, mapping_config)
                elif mapping_type == "split":
                    self._apply_split_mapping(source_df, result_df, mapping_config)
                elif mapping_type == "join":
                    self._apply_join_mapping(source_df, result_df, mapping_config)
                else:
                    raise TransformationError(f"Unknown mapping type: {mapping_type}")

            # Add entity columns from source data if specified
            if mapping.get("entity_root_id_column") and mapping["entity_root_id_column"] in source_df.columns:
                result_df["entity_root_id"] = source_df[mapping["entity_root_id_column"]].values

            if mapping.get("entity_id_column") and mapping["entity_id_column"] in source_df.columns:
                result_df["entity_id"] = source_df[mapping["entity_id_column"]].values

            # Convert DataFrame to list of dictionaries
            return result_df.to_dict(orient="records")

        except Exception as e:
            raise TransformationError(f"Data transformation failed: {str(e)}")

    def _apply_direct_mapping(
        self,
        source_df: pd.DataFrame,
        target_df: pd.DataFrame,
        mapping: Dict[str, Any]
    ) -> None:
        """Apply direct column mapping (1:1)"""
        source_column = mapping["source_column"]
        target_field = mapping["target_field"]

        if source_column not in source_df.columns:
            raise TransformationError(
                f"Source column not found: {source_column}"
            )

        target_df[target_field] = source_df[source_column].values

    def _apply_split_mapping(
        self,
        source_df: pd.DataFrame,
        target_df: pd.DataFrame,
        mapping: Dict[str, Any]
    ) -> None:
        """Apply split column mapping (1:N)"""
        source_column = mapping["source_column"]
        delimiter = mapping["delimiter"]
        target_fields = mapping["target_fields"]

        if source_column not in source_df.columns:
            raise TransformationError(
                f"Source column not found: {source_column}"
            )

        # Split the column
        split_data = source_df[source_column].str.split(delimiter, expand=True)

        # Assign to target fields
        for idx, target_field in enumerate(target_fields):
            if idx < len(split_data.columns):
                target_df[target_field] = split_data[idx].values
            else:
                target_df[target_field] = None

    def _apply_join_mapping(
        self,
        source_df: pd.DataFrame,
        target_df: pd.DataFrame,
        mapping: Dict[str, Any]
    ) -> None:
        """Apply join column mapping (N:1)"""
        source_columns = mapping["source_columns"]
        separator = mapping["separator"]
        target_field = mapping["target_field"]

        # Validate source columns exist
        for col in source_columns:
            if col not in source_df.columns:
                raise TransformationError(
                    f"Source column not found: {col}"
                )

        # Join columns with separator
        target_df[target_field] = source_df[source_columns].apply(
            lambda row: separator.join(row.astype(str)), axis=1
        ).values
