from pyspark.sql import SparkSession, DataFrame, functions as F
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DateType, BooleanType
from delta.tables import DeltaTable
from typing import List, Dict, Any, Optional
import os
import math
from ..utils.exceptions import SchemaValidationError, DeltaWriteError


class SilverWriter:
    """
    Handles writing transformed data to the Silver layer (medallion architecture).
    Silver layer stores cleaned, transformed data with schema enforcement.
    """

    def __init__(self, base_path: str, spark_session: Optional[SparkSession] = None):
        """
        Initialize SilverWriter.

        Args:
            base_path: Base path for silver layer storage (e.g., /path/to/delta-lake)
            spark_session: Optional existing Spark session (creates new if None)
        """
        self.base_path = base_path
        self._spark = spark_session

    @property
    def spark(self) -> SparkSession:
        """Get Spark session, creating if necessary."""
        if self._spark is None:
            from .delta_writer import get_spark_session
            self._spark = get_spark_session()
        return self._spark

    def write(
        self,
        df: DataFrame,
        schema_name: str,
        schema_fields: List[Dict[str, str]],
        mapping_id: str,
        run_id: str,
        execution_time: str,
        bronze_run_id: str,
    ) -> tuple[str, int]:
        """
        Write transformed DataFrame to silver layer with schema validation.

        Silver layer stores transformed data with column mappings applied.

        Args:
            df: Transformed Spark DataFrame
            schema_name: Target schema name (used as table name)
            schema_fields: Schema field definitions for validation
            mapping_id: Mapping ID for metadata
            run_id: Silver layer run ID
            execution_time: Execution timestamp
            bronze_run_id: Source bronze run ID for lineage

        Returns:
            Tuple of (silver_table_path, row_count)

        Raises:
            SchemaValidationError: If schema is incompatible
            DeltaWriteError: If write operation fails
        """
        try:
            # Add metadata columns using withColumn
            df = df.withColumn("mapping_id", F.lit(mapping_id))
            df = df.withColumn("run_id", F.lit(run_id))
            df = df.withColumn("execution_time", F.lit(execution_time))
            df = df.withColumn("_silver_bronze_run_id", F.lit(bronze_run_id))

            # Add source_id from entity_id if present
            if "entity_id" in df.columns:
                df = df.withColumn("source_id", F.col("entity_id"))
            else:
                df = df.withColumn("source_id", F.lit(None).cast("string"))

            # Clean data using Spark transformations
            cleaned_df = self._clean_data_for_schema(df, schema_fields)

            # Create expected schema for validation
            # Get first row as dict for schema creation
            if cleaned_df.count() > 0:
                sample_row = cleaned_df.first().asDict()
                expected_schema = self._create_spark_schema(schema_fields, [sample_row])
            else:
                expected_schema = self._create_spark_schema(schema_fields, [])

            # Reorder columns to match expected schema
            expected_columns = [field.name for field in expected_schema.fields]
            # Only select columns that exist in the DataFrame
            columns_to_select = [
                col for col in expected_columns if col in cleaned_df.columns
            ]
            cleaned_df = cleaned_df.select(*columns_to_select)

            # Construct silver table path: silver/{schema_name}/
            silver_table_path = os.path.join(
                self.base_path,
                "silver",
                schema_name
            )

            # Check if table exists and validate schema
            if DeltaTable.isDeltaTable(self.spark, silver_table_path):
                existing_table = DeltaTable.forPath(self.spark, silver_table_path)
                existing_schema = existing_table.toDF().schema

                # Validate schema compatibility
                self._validate_schema_compatibility(
                    existing_schema, cleaned_df.schema, allow_new_columns=True
                )

                # Write with schema merge and overwrite for entity columns
                # Use overwriteSchema to allow entity_root_id/entity_id type changes
                cleaned_df.write.format("delta").mode("append").option(
                    "mergeSchema", "true"
                ).option(
                    "overwriteSchema", "true"
                ).save(silver_table_path)
            else:
                # First write - create new table
                cleaned_df.write.format("delta").mode("append").save(silver_table_path)

            # Get row count (triggers computation)
            row_count = cleaned_df.count()

            return silver_table_path, row_count

        except SchemaValidationError:
            raise
        except Exception as e:
            raise DeltaWriteError(f"Failed to write to silver lake: {str(e)}")

    def get_table_path(self, schema_name: str) -> str:
        """
        Get silver table path for a schema.

        Args:
            schema_name: Schema name

        Returns:
            Silver table path
        """
        return os.path.join(
            self.base_path,
            "silver",
            schema_name
        )

    def table_exists(self, schema_name: str) -> bool:
        """
        Check if silver table exists for a schema.

        Args:
            schema_name: Schema name

        Returns:
            True if table exists, False otherwise
        """
        silver_path = self.get_table_path(schema_name)
        return DeltaTable.isDeltaTable(self.spark, silver_path)

    def _validate_schema_compatibility(
        self,
        existing_schema: StructType,
        new_schema: StructType,
        allow_new_columns: bool = True
    ) -> None:
        """
        Validate that new schema is compatible with existing schema.

        Rules:
        - No type changes allowed
        - New columns allowed if allow_new_columns=True
        - Column removal not allowed

        Raises:
            SchemaValidationError: If schemas are incompatible
        """
        existing_fields = {field.name: field.dataType for field in existing_schema.fields}
        new_fields = {field.name: field.dataType for field in new_schema.fields}

        # Check for type changes in existing columns
        # EXCEPTION: entity_root_id and entity_id can change types (they're arbitrary identifiers)
        type_change_allowed_columns = {"entity_root_id", "entity_id"}

        for col_name, existing_type in existing_fields.items():
            if col_name in new_fields:
                new_type = new_fields[col_name]
                if str(existing_type) != str(new_type):
                    # Allow type changes for entity ID columns
                    if col_name in type_change_allowed_columns:
                        continue

                    raise SchemaValidationError(
                        f"Type mismatch for column '{col_name}': "
                        f"expected {existing_type}, but got {new_type}. "
                        f"Type changes are not allowed."
                    )

        # Check for new columns
        new_columns = set(new_fields.keys()) - set(existing_fields.keys())
        if new_columns and not allow_new_columns:
            raise SchemaValidationError(f"New columns are not allowed: {new_columns}")

    def _create_spark_schema(
        self,
        schema_fields: List[Dict[str, str]],
        data: List[Dict[str, Any]]
    ) -> StructType:
        """Create Spark StructType from schema fields."""
        fields = []
        for field in schema_fields:
            spark_type = self._map_field_type_to_spark(field["field_type"])
            fields.append(StructField(field["name"], spark_type, nullable=True))

        # Add entity columns if present in data
        if data and len(data) > 0:
            sample_row = data[0]
            if "entity_root_id" in sample_row:
                fields.append(StructField("entity_root_id", StringType(), nullable=True))
            if "entity_id" in sample_row:
                fields.append(StructField("entity_id", StringType(), nullable=True))

        # Add metadata columns
        fields.append(StructField("mapping_id", StringType(), nullable=False))
        fields.append(StructField("run_id", StringType(), nullable=False))
        fields.append(StructField("execution_time", StringType(), nullable=False))

        return StructType(fields)

    def _map_field_type_to_spark(self, field_type: str):
        """Map schema field type to Spark SQL type."""
        type_mapping = {
            "string": StringType(),
            "integer": IntegerType(),
            "date": DateType(),
            "boolean": BooleanType(),
        }
        return type_mapping.get(field_type, StringType())

    def _clean_data_for_schema(
        self,
        df: DataFrame,
        schema_fields: List[Dict[str, str]]
    ) -> DataFrame:
        """
        Clean Spark DataFrame to match schema types using PySpark transformations.

        Handles:
        - Boolean conversions (numeric, string, NaN)
        - Integer NaN handling
        - General NaN → None conversion

        Args:
            df: Input Spark DataFrame
            schema_fields: Target schema field definitions

        Returns:
            Cleaned Spark DataFrame
        """
        # Create mapping of field names to types
        field_types = {field["name"]: field["field_type"] for field in schema_fields}

        # Metadata columns to preserve as-is
        metadata_columns = [
            "mapping_id",
            "run_id",
            "execution_time",
            "source_id",
            "entity_root_id",
            "entity_id",
        ]

        # Collect all column expressions
        cleaned_columns = []

        # Process each column in DataFrame
        for col_name in df.columns:
            # Skip metadata columns, keep as-is
            if col_name in metadata_columns:
                cleaned_columns.append(F.col(col_name))
                continue

            # Get field type from schema
            field_type = field_types.get(col_name)

            if field_type == "boolean":
                cleaned_columns.append(self._clean_boolean_column(col_name))
            elif field_type == "integer":
                cleaned_columns.append(self._clean_integer_column(col_name))
            elif field_type == "date":
                col = F.col(col_name)
                cleaned_col = (
                    F.when(col.isNull(), None).otherwise(col.cast("date")).alias(col_name)
                )
                cleaned_columns.append(cleaned_col)
            else:
                # Default: string or unknown type
                cleaned_columns.append(self._clean_general_column(col_name))

        # Apply all cleaning transformations in a single select
        return df.select(*cleaned_columns)

    def _clean_boolean_column(self, col_name: str):
        """Clean boolean column with comprehensive type handling."""
        from pyspark.sql.column import Column
        col = F.col(col_name)
        col_str = col.cast("string")

        return (
            F.when(col.isNull(), None)
            .when(
                col_str.isin(
                    "true", "True", "TRUE", "1", "yes", "Yes", "YES", "t", "T"
                ),
                True,
            )
            .when(
                col_str.isin(
                    "false", "False", "FALSE", "0", "no", "No", "NO", "f", "F"
                ),
                False,
            )
            .otherwise(col.cast("boolean"))
            .alias(col_name)
        )

    def _clean_integer_column(self, col_name: str):
        """Clean integer column, converting NaN to null."""
        col = F.col(col_name)

        return (
            F.when(col.isNull(), None)
            .otherwise(col.cast("integer"))
            .alias(col_name)
        )

    def _clean_general_column(self, col_name: str):
        """Clean general column (string, date) - convert NaN to null."""
        col = F.col(col_name)

        return F.when(col.isNull(), None).otherwise(col).alias(col_name)
