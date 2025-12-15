from pyspark.sql import SparkSession, DataFrame, functions as F
from pyspark.sql.column import Column
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
                "io.delta:delta-spark_2.12:3.0.0,"
                "org.postgresql:postgresql:42.7.1,"
                "mysql:mysql-connector-java:8.0.33",
            )
            .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
            .config(
                "spark.sql.catalog.spark_catalog",
                "org.apache.spark.sql.delta.catalog.DeltaCatalog",
            )
            .config("spark.sql.warehouse.dir", settings.delta_lake_base_path)
            # Memory and performance optimizations
            .config("spark.driver.memory", "4g")
            .config("spark.sql.shuffle.partitions", "200")
            .config("spark.sql.adaptive.enabled", "true")
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
            .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
            .config("spark.sql.jdbc.fetchsize", "10000")
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
            if key in [
                "mapping_id",
                "execution_time",
                "source_id",
                "entity_root_id",
                "entity_id",
            ]:
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


def clean_boolean_column(col_name: str) -> Column:
    """Clean boolean column with comprehensive type handling"""
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


def clean_integer_column(col_name: str) -> Column:
    """Clean integer column, converting NaN to null"""
    col = F.col(col_name)

    return (
        F.when(col.isNull(), None)
        .otherwise(col.cast("integer"))
        .alias(col_name)
    )


def clean_general_column(col_name: str) -> Column:
    """Clean general column (string, date) - convert NaN to null"""
    col = F.col(col_name)

    return F.when(col.isNull(), None).otherwise(col).alias(col_name)


def clean_data_for_schema_spark(
    df: DataFrame, schema_fields: List[Dict[str, str]]
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
            cleaned_columns.append(clean_boolean_column(col_name))
        elif field_type == "integer":
            cleaned_columns.append(clean_integer_column(col_name))
        elif field_type == "date":
            col = F.col(col_name)
            cleaned_col = (
                F.when(col.isNull(), None).otherwise(col.cast("date")).alias(col_name)
            )
            cleaned_columns.append(cleaned_col)
        else:
            # Default: string or unknown type
            cleaned_columns.append(clean_general_column(col_name))

    # Apply all cleaning transformations in a single select
    return df.select(*cleaned_columns)


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
    df: DataFrame,
    schema_name: str,
    schema_fields: List[Dict[str, str]],
    mapping_id: str,
    execution_time: str,
) -> tuple[str, int]:
    """
    Write Spark DataFrame to Delta Lake table with schema validation.

    Args:
        df: Spark DataFrame containing transformed data
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

        # Add metadata columns using withColumn
        df = df.withColumn("mapping_id", F.lit(mapping_id))
        df = df.withColumn("execution_time", F.lit(execution_time))

        # Add source_id from entity_id if present
        if "entity_id" in df.columns:
            df = df.withColumn("source_id", F.col("entity_id"))
        else:
            df = df.withColumn("source_id", F.lit(None).cast("string"))

        # Clean data using Spark transformations
        cleaned_df = clean_data_for_schema_spark(df, schema_fields)

        # Create expected schema for validation
        # Note: We need to pass a sample for entity column detection
        # Get first row as dict for schema creation
        if cleaned_df.count() > 0:
            sample_row = cleaned_df.first().asDict()
            expected_schema = create_spark_schema(schema_fields, [sample_row])
        else:
            expected_schema = create_spark_schema(schema_fields, [])

        # Reorder columns to match expected schema
        expected_columns = [field.name for field in expected_schema.fields]
        # Only select columns that exist in the DataFrame
        columns_to_select = [
            col for col in expected_columns if col in cleaned_df.columns
        ]
        cleaned_df = cleaned_df.select(*columns_to_select)

        # Construct Delta Lake table path
        delta_table_path = os.path.join(settings.delta_lake_base_path, schema_name)

        # Check if table exists and validate schema
        if DeltaTable.isDeltaTable(spark, delta_table_path):
            existing_table = DeltaTable.forPath(spark, delta_table_path)
            existing_schema = existing_table.toDF().schema

            # Validate schema compatibility
            validate_schema_compatibility(
                existing_schema, cleaned_df.schema, allow_new_columns=True
            )

            # Write with schema merge
            cleaned_df.write.format("delta").mode("append").option(
                "mergeSchema", "true"
            ).save(delta_table_path)
        else:
            # First write - create new table
            cleaned_df.write.format("delta").mode("append").save(delta_table_path)

        # Get row count (triggers computation)
        row_count = cleaned_df.count()

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
