from pyspark.sql import SparkSession, DataFrame, functions as F
from delta.tables import DeltaTable
from typing import Optional
import os
from ..utils.exceptions import DeltaWriteError


class BronzeWriter:
    """
    Handles writing raw source data to the Bronze layer (medallion architecture).
    Bronze layer stores immutable, raw data with minimal metadata.
    """

    def __init__(self, base_path: str, spark_session: Optional[SparkSession] = None):
        """
        Initialize BronzeWriter.

        Args:
            base_path: Base path for bronze layer storage (e.g., /path/to/delta-lake)
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
        mapping_id: str,
        run_id: str,
        ingestion_time: str,
    ) -> tuple[str, int]:
        """
        Write raw DataFrame to bronze layer.

        Bronze layer stores the raw SQL query result with minimal metadata:
        - No transformations applied
        - No column mappings
        - Append-only (immutable)
        - Schema evolution enabled

        Args:
            df: Raw source Spark DataFrame
            mapping_id: Unique mapping identifier
            run_id: Bronze run ID for tracking
            ingestion_time: ISO format timestamp

        Returns:
            Tuple of (bronze_table_path, row_count)

        Raises:
            DeltaWriteError: If write operation fails
        """
        try:
            # Add bronze metadata columns
            bronze_df = df.withColumn("_bronze_run_id", F.lit(run_id))
            bronze_df = bronze_df.withColumn("_bronze_ingestion_time", F.lit(ingestion_time))
            bronze_df = bronze_df.withColumn("_bronze_mapping_id", F.lit(mapping_id))

            # Construct bronze table path: bronze/mapping_{mapping_id}/
            bronze_table_path = os.path.join(
                self.base_path,
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

    def read(
        self,
        mapping_id: str,
        run_id: Optional[str] = None,
    ) -> DataFrame:
        """
        Read data from bronze layer.

        Args:
            mapping_id: Mapping ID to read data for
            run_id: Optional bronze run ID to filter by (for incremental processing)
                   If None, reads all data (full refresh)

        Returns:
            Spark DataFrame containing bronze data

        Raises:
            DeltaWriteError: If read operation fails
        """
        try:
            bronze_path = self.get_table_path(mapping_id)

            # Check if bronze table exists
            if not DeltaTable.isDeltaTable(self.spark, bronze_path):
                raise DeltaWriteError(f"Bronze table does not exist at path: {bronze_path}")

            # Read bronze data
            bronze_df = self.spark.read.format("delta").load(bronze_path)

            # Filter by run_id if provided (for idempotency or incremental)
            if run_id:
                bronze_df = bronze_df.filter(F.col("_bronze_run_id") == run_id)

            return bronze_df

        except Exception as e:
            raise DeltaWriteError(f"Failed to read from bronze lake: {str(e)}")

    def get_table_path(self, mapping_id: str) -> str:
        """
        Get bronze table path for a given mapping ID.

        Args:
            mapping_id: Mapping ID

        Returns:
            Bronze table path
        """
        return os.path.join(
            self.base_path,
            "bronze",
            f"mapping_{mapping_id}"
        )

    def table_exists(self, mapping_id: str) -> bool:
        """
        Check if bronze table exists for a mapping.

        Args:
            mapping_id: Mapping ID

        Returns:
            True if table exists, False otherwise
        """
        bronze_path = self.get_table_path(mapping_id)
        return DeltaTable.isDeltaTable(self.spark, bronze_path)
