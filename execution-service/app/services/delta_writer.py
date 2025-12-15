from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.types import (
    StructType,
    StructField,
    StringType,
    IntegerType,
    DateType,
    BooleanType,
)
from delta.tables import DeltaTable
from typing import List, Dict, Any
import os
from ..config import get_settings
from ..utils.exceptions import SchemaValidationError, DeltaWriteError
import sys
import math

settings = get_settings()

# Singleton Spark session
_spark = None


def get_spark_session() -> SparkSession:
    os.environ["PYSPARK_PYTHON"] = sys.executable
    os.environ["PYSPARK_DRIVER_PYTHON"] = sys.executable
    """Get or create singleton Spark session with Delta Lake configuration"""
    global _spark
    if _spark is None:
        # Configure Spark with Delta Lake and PostgreSQL JDBC packages
        _spark = (
            SparkSession.builder.appName(settings.spark_app_name)
            .master(settings.spark_master)
            .config("spark.ui.enabled", "false")
            .config("spark.sql.catalogImplementation", "in-memory")
            .config(
                "spark.jars.packages",
                "io.delta:delta-spark_2.12:3.0.0,org.postgresql:postgresql:42.7.1",
            )
            .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
            .config(
                "spark.sql.catalog.spark_catalog",
                "org.apache.spark.sql.delta.catalog.DeltaCatalog",
            )
            .config("spark.sql.warehouse.dir", settings.delta_lake_base_path)
            .getOrCreate()
        )

        _spark.sparkContext.setLogLevel("ERROR")

    return _spark


def map_field_type_to_spark(field_type: str):
    """Map schema field type to Spark SQL type"""
    type_mapping = {
        "string": StringType(),
        "integer": IntegerType(),
        "date": DateType(),
        "boolean": BooleanType(),
    }
    return type_mapping.get(field_type, StringType())


def create_spark_schema(
    schema_fields: List[Dict[str, str]], data: List[Dict[str, Any]]
) -> StructType:
    """Create Spark StructType from schema fields"""
    fields = []
    for field in schema_fields:
        spark_type = map_field_type_to_spark(field["field_type"])
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
    fields.append(StructField("execution_time", StringType(), nullable=False))

    return StructType(fields)


def clean_data_for_schema(
    data: List[Dict[str, Any]], schema_fields: List[Dict[str, str]]
) -> List[Dict[str, Any]]:
    """
    Clean data to match schema types, handling special cases like NaN values.

    Args:
        data: List of dictionaries containing raw data
        schema_fields: Target schema field definitions

    Returns:
        Cleaned data ready for Spark DataFrame creation
    """
    # Create a mapping of field names to their types
    field_types = {field["name"]: field["field_type"] for field in schema_fields}

    cleaned_data = []
    for row in data:
        cleaned_row = {}
        for key, value in row.items():
            # Skip metadata fields, they'll be handled separately
            if key in ["mapping_id", "execution_time", "source_id", "entity_root_id", "entity_id"]:
                cleaned_row[key] = value
                continue

            field_type = field_types.get(key)

            if field_type == "boolean":
                # Handle NaN/None values
                if value is None or (isinstance(value, float) and math.isnan(value)):
                    cleaned_row[key] = None
                # Handle numeric boolean values (0, 1)
                elif isinstance(value, (int, float)):
                    cleaned_row[key] = bool(value)
                # Handle string boolean values
                elif isinstance(value, str):
                    cleaned_row[key] = value.lower() in ("true", "1", "yes", "t")
                else:
                    cleaned_row[key] = bool(value)
            elif field_type == "integer":
                # Handle NaN/None values
                if value is None or (isinstance(value, float) and math.isnan(value)):
                    cleaned_row[key] = None
                else:
                    cleaned_row[key] = value
            else:
                # For other types, just handle NaN
                if isinstance(value, float) and math.isnan(value):
                    cleaned_row[key] = None
                else:
                    cleaned_row[key] = value

        cleaned_data.append(cleaned_row)

    return cleaned_data


def validate_schema_compatibility(
    existing_schema: StructType, new_schema: StructType, allow_new_columns: bool = True
) -> None:
    """
    Validate that new schema is compatible with existing schema.

    Rules:
    - No type changes allowed
    - New columns allowed if allow_new_columns=True
    - Column removal not allowed
    """
    existing_fields = {field.name: field.dataType for field in existing_schema.fields}
    new_fields = {field.name: field.dataType for field in new_schema.fields}

    # Check for type changes in existing columns
    for col_name, existing_type in existing_fields.items():
        if col_name in new_fields:
            new_type = new_fields[col_name]
            if str(existing_type) != str(new_type):
                raise SchemaValidationError(
                    f"Type mismatch for column '{col_name}': "
                    f"expected {existing_type}, but got {new_type}. "
                    f"Type changes are not allowed."
                )

    # Check for new columns
    new_columns = set(new_fields.keys()) - set(existing_fields.keys())
    if new_columns and not allow_new_columns:
        raise SchemaValidationError(f"New columns are not allowed: {new_columns}")


def write_to_delta_lake(
    data: List[Dict[str, Any]],
    schema_name: str,
    schema_fields: List[Dict[str, str]],
    mapping_id: str,
    execution_time: str,
) -> tuple[str, int]:
    """
    Write data to Delta Lake table with schema validation.

    Args:
        data: List of dictionaries containing the data
        schema_name: Name of the target schema (used as table name)
        schema_fields: Target schema field definitions
        mapping_id: Mapping ID for metadata
        execution_time: Execution timestamp for metadata

    Returns:
        Tuple of (delta_table_path, row_count)

    Raises:
        SchemaValidationError: If schema is incompatible
        DeltaWriteError: If write operation fails
    """
    try:
        spark = get_spark_session()

        # Add metadata columns to each row
        for row in data:
            row["mapping_id"] = mapping_id
            row["execution_time"] = execution_time
            row["source_id"] = row.get("entity_id", None)

        # Clean data to handle NaN values and type conversions
        cleaned_data = clean_data_for_schema(data, schema_fields)

        # Create expected schema
        expected_schema = create_spark_schema(schema_fields, cleaned_data)

        # Create Spark DataFrame from cleaned data
        spark_df = spark.createDataFrame(cleaned_data, schema=expected_schema)

        # Construct Delta Lake table path
        delta_table_path = os.path.join(settings.delta_lake_base_path, schema_name)

        # Check if table exists and validate schema
        if DeltaTable.isDeltaTable(spark, delta_table_path):
            existing_table = DeltaTable.forPath(spark, delta_table_path)
            existing_schema = existing_table.toDF().schema

            # Validate schema compatibility (no type changes allowed)
            validate_schema_compatibility(
                existing_schema, spark_df.schema, allow_new_columns=True
            )

            # Write with schema merge (only adds new columns)
            spark_df.write.format("delta").mode("append").option(
                "mergeSchema", "true"
            ).save(delta_table_path)
        else:
            # First write - create new table
            spark_df.write.format("delta").mode("append").save(delta_table_path)

        row_count = len(data)
        return delta_table_path, row_count

    except SchemaValidationError:
        raise
    except Exception as e:
        raise DeltaWriteError(f"Failed to write to Delta Lake: {str(e)}")


def stop_spark_session():
    """Stop Spark session (for cleanup)"""
    global _spark
    if _spark:
        _spark.stop()
        _spark = None
