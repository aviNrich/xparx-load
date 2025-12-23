from pyspark.sql import DataFrame, functions as F
from delta.tables import DeltaTable
from typing import Optional
import os
from ..config import get_settings
from ..utils.exceptions import DeltaWriteError
from .delta_writer import get_spark_session

settings = get_settings()


def write_to_bronze_lake(
    df: DataFrame,
    mapping_id: str,
    run_id: str,
    ingestion_time: str,
) -> tuple[str, int]:
    """
    Write raw source DataFrame to bronze layer (medallion architecture).

    Bronze layer stores the raw SQL query result with minimal metadata:
    - No transformations applied
    - No column mappings
    - Append-only (immutable)
    - Schema evolution enabled

    Args:
        df: Spark DataFrame containing raw source data (SQL query result)
        mapping_id: Mapping ID (each mapping has unique SQL query)
        run_id: Bronze ingestion run ID for tracking
        ingestion_time: Timestamp when data was ingested

    Returns:
        Tuple of (bronze_table_path, row_count)

    Raises:
        DeltaWriteError: If write operation fails
    """
    try:
        spark = get_spark_session()

        # Add bronze metadata columns
        bronze_df = df.withColumn("_bronze_run_id", F.lit(run_id))
        bronze_df = bronze_df.withColumn("_bronze_ingestion_time", F.lit(ingestion_time))
        bronze_df = bronze_df.withColumn("_bronze_mapping_id", F.lit(mapping_id))

        # Construct bronze table path: bronze/mapping_{mapping_id}/
        bronze_table_path = os.path.join(
            settings.delta_lake_base_path,
            "bronze",
            f"mapping_{mapping_id}"
        )

        # Write to bronze layer
        # Always append mode - bronze is immutable
        # Enable mergeSchema for schema evolution (source schema can change)
        bronze_df.write \
            .format("delta") \
            .mode("append") \
            .option("mergeSchema", "true") \
            .save(bronze_table_path)

        # Get row count
        row_count = bronze_df.count()

        return bronze_table_path, row_count

    except Exception as e:
        raise DeltaWriteError(f"Failed to write to bronze lake: {str(e)}")


def read_from_bronze_lake(
    bronze_path: str,
    run_id: Optional[str] = None,
) -> DataFrame:
    """
    Read data from bronze layer.

    Args:
        bronze_path: Path to bronze Delta table
        run_id: Optional bronze run ID to filter by (for incremental processing)
                If None, reads all data (full refresh)

    Returns:
        Spark DataFrame containing bronze data

    Raises:
        DeltaWriteError: If read operation fails
    """
    try:
        spark = get_spark_session()

        # Check if bronze table exists
        if not DeltaTable.isDeltaTable(spark, bronze_path):
            raise DeltaWriteError(f"Bronze table does not exist at path: {bronze_path}")

        # Read bronze data
        bronze_df = spark.read.format("delta").load(bronze_path)

        # Filter by run_id if provided (for idempotency or incremental)
        if run_id:
            bronze_df = bronze_df.filter(F.col("_bronze_run_id") == run_id)

        return bronze_df

    except Exception as e:
        raise DeltaWriteError(f"Failed to read from bronze lake: {str(e)}")


def get_bronze_table_path(mapping_id: str) -> str:
    """
    Get bronze table path for a given mapping ID.

    Args:
        mapping_id: Mapping ID

    Returns:
        Bronze table path
    """
    return os.path.join(
        settings.delta_lake_base_path,
        "bronze",
        f"mapping_{mapping_id}"
    )
