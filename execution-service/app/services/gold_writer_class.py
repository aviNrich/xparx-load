from pyspark.sql import SparkSession, DataFrame, functions as F
from delta.tables import DeltaTable
from typing import Dict, Any, Optional
import os
import sys
from ..utils.exceptions import DeltaWriteError
from .target_handlers import TargetHandlers


class GoldWriter:
    """
    Handles writing business-ready data to the Gold layer (medallion architecture).
    Gold layer stores data with relationships and calculated IDs, ready for consumption.
    """

    def __init__(self, base_path: str, spark_session: Optional[SparkSession] = None):
        """
        Initialize GoldWriter.

        Args:
            base_path: Base path for gold layer storage (e.g., /path/to/delta-lake)
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
        schema_handler: str,
        context: Dict[str, Any],
        mapping_id: str,
        run_id: str,
        execution_time: str,
        silver_run_id: str,
    ) -> Dict[str, Any]:
        """
        Write DataFrame to gold layer with handler transformations applied.

        The handler prepares data for business consumption by:
        - Calculating UUIDs for relationships
        - Creating dimension/lookup tables
        - Structuring data for specific business domains

        Args:
            df: Silver layer DataFrame
            schema_handler: Handler name (e.g., "emails_handler", "interests_handler")
            context: Context dict with source_id and other metadata
            mapping_id: Mapping ID for lineage
            run_id: Gold layer run ID
            execution_time: Execution timestamp
            silver_run_id: Source silver run ID for lineage

        Returns:
            Dict with main and related table info:
            {
                "main": {
                    "table_name": "email_address_to_entities",
                    "table_path": "gold/email_address_to_entities/",
                    "row_count": 1000
                },
                "related": {
                    "table_name": "email",
                    "table_path": "gold/email/",
                    "row_count": 500
                } or None if no related table
            }

        Raises:
            DeltaWriteError: If write operation fails
            ValueError: If handler not found
        """
        try:
            # Get the handler function
            handler = TargetHandlers.get_handler(schema_handler)

            # Apply handler transformation
            handler_result = handler(df, context)

            # Extract components from handler result
            main_df = handler_result["df"]
            main_table_name = handler_result["table_name"]
            related_df = handler_result.get("related_df")
            related_table_name = handler_result.get("related_table")

            # Write main table
            main_result = self._write_table(
                df=main_df,
                table_name=main_table_name,
                mapping_id=mapping_id,
                run_id=run_id,
                execution_time=execution_time,
                silver_run_id=silver_run_id,
            )

            print(
                f"✓ Gold layer (main): {main_result['row_count']} rows written to {main_result['table_name']}",
                file=sys.stderr
            )

            # Write related table if present
            related_result = None
            if related_df is not None and related_table_name:
                related_result = self._write_table(
                    df=related_df,
                    table_name=related_table_name,
                    mapping_id=mapping_id,
                    run_id=run_id,
                    execution_time=execution_time,
                    silver_run_id=silver_run_id,
                )
                print(
                    f"✓ Gold layer (related): {related_result['row_count']} rows written to {related_result['table_name']}",
                    file=sys.stderr
                )

            return {
                "main": main_result,
                "related": related_result,
                "handler_metadata": {
                    "primary_col": handler_result.get("primary_col"),
                    "related_poi_col": handler_result.get("related_poi_col"),
                },
                "handler_result": handler_result,  # Include full handler result for reuse
            }

        except ValueError as e:
            # Handler not found or invalid
            raise ValueError(f"Gold layer handler error: {str(e)}")
        except Exception as e:
            raise DeltaWriteError(f"Failed to write to gold lake: {str(e)}")

    def _write_table(
        self,
        df: DataFrame,
        table_name: str,
        mapping_id: str,
        run_id: str,
        execution_time: str,
        silver_run_id: str,
    ) -> Dict[str, Any]:
        """
        Write a single DataFrame to gold layer.

        Args:
            df: DataFrame to write
            table_name: Table name (e.g., "email_address_to_entities")
            mapping_id: Mapping ID for lineage
            run_id: Gold layer run ID
            execution_time: Execution timestamp
            silver_run_id: Source silver run ID

        Returns:
            Dict with table info: {"table_name": str, "table_path": str, "row_count": int}
        """
        # Add gold layer metadata columns
        gold_df = df.withColumn("_gold_mapping_id", F.lit(mapping_id))
        gold_df = gold_df.withColumn("_gold_run_id", F.lit(run_id))
        gold_df = gold_df.withColumn("_gold_execution_time", F.lit(execution_time))
        gold_df = gold_df.withColumn("_gold_silver_run_id", F.lit(silver_run_id))

        # Construct gold table path: gold/{table_name}/
        gold_table_path = os.path.join(self.base_path, "gold", table_name)

        # Write to gold layer (append mode with schema evolution)
        gold_df.write \
            .format("delta") \
            .mode("append") \
            .option("mergeSchema", "true") \
            .save(gold_table_path)

        # Get row count
        row_count = gold_df.count()

        return {
            "table_name": table_name,
            "table_path": gold_table_path,
            "row_count": row_count,
        }

    def get_table_path(self, table_name: str) -> str:
        """
        Get gold table path for a table name.

        Args:
            table_name: Table name

        Returns:
            Gold table path
        """
        return os.path.join(self.base_path, "gold", table_name)

    def table_exists(self, table_name: str) -> bool:
        """
        Check if gold table exists.

        Args:
            table_name: Table name

        Returns:
            True if table exists, False otherwise
        """
        gold_path = self.get_table_path(table_name)
        return DeltaTable.isDeltaTable(self.spark, gold_path)

    def read(
        self,
        table_name: str,
        run_id: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None,
    ) -> DataFrame:
        """
        Read data from gold layer.

        Args:
            table_name: Table name to read
            run_id: Optional run ID to filter by
            filters: Optional additional filters (e.g., {"mapping_id": "123"})

        Returns:
            Spark DataFrame with gold data

        Raises:
            DeltaWriteError: If read operation fails
        """
        try:
            gold_path = self.get_table_path(table_name)

            # Check if table exists
            if not DeltaTable.isDeltaTable(self.spark, gold_path):
                raise DeltaWriteError(f"Gold table does not exist at path: {gold_path}")

            # Read gold data
            gold_df = self.spark.read.format("delta").load(gold_path)

            # Filter by run_id if provided
            if run_id:
                gold_df = gold_df.filter(F.col("_gold_run_id") == run_id)

            # Apply additional filters if provided
            if filters:
                for col_name, value in filters.items():
                    gold_df = gold_df.filter(F.col(col_name) == value)

            return gold_df

        except Exception as e:
            raise DeltaWriteError(f"Failed to read from gold lake: {str(e)}")

    def write_poi(
        self,
        df: DataFrame,
        mapping_id: str,
        run_id: str,
        execution_time: str,
        silver_run_id: str,
    ) -> Dict[str, Any]:
        """
        Write Person of Interest (PoI) data to gold layer.

        This method writes the consolidated PoI records that contain primary fields
        (primary_name, primary_gender, primary_interest, primary_email, primary_device).

        Args:
            df: DataFrame containing PoI data with columns:
                - id: PoI ID
                - primary_* columns (e.g., primary_name, primary_gender, etc.)
                - source_id
                - source_item_id
            mapping_id: Mapping ID for lineage
            run_id: Gold layer run ID
            execution_time: Execution timestamp
            silver_run_id: Source silver run ID

        Returns:
            Dict with table info: {"table_name": str, "table_path": str, "row_count": int}

        Raises:
            DeltaWriteError: If write operation fails
        """
        try:
            # Check if DataFrame is empty
            if df.count() == 0:
                raise DeltaWriteError("Cannot write empty DataFrame to PoI table")

            # Use the _write_table method with upsert logic
            # For PoI, we want to merge/upsert based on ID instead of just appending
            result = self._write_poi_with_merge(
                df=df,
                table_name="person_of_interest",
                mapping_id=mapping_id,
                run_id=run_id,
                execution_time=execution_time,
                silver_run_id=silver_run_id,
            )

            print(
                f"✓ Gold layer (PoI): {result['row_count']} rows written/updated to {result['table_name']}",
                file=sys.stderr
            )

            return result

        except Exception as e:
            raise DeltaWriteError(f"Failed to write PoI to gold lake: {str(e)}")

    def _write_poi_with_merge(
        self,
        df: DataFrame,
        table_name: str,
        mapping_id: str,
        run_id: str,
        execution_time: str,
        silver_run_id: str,
    ) -> Dict[str, Any]:
        """
        Write PoI data with merge/upsert logic to maintain primary fields.

        Uses Delta Lake MERGE operation to:
        - Insert new PoI records
        - Update existing records with COALESCE logic (only update if existing value is NULL)

        Args:
            df: DataFrame to write
            table_name: Table name (person_of_interest)
            mapping_id: Mapping ID
            run_id: Gold run ID
            execution_time: Execution timestamp
            silver_run_id: Silver run ID

        Returns:
            Dict with table info
        """
        # Add gold layer metadata columns
        gold_df = df.withColumn("_gold_mapping_id", F.lit(mapping_id))
        gold_df = gold_df.withColumn("_gold_run_id", F.lit(run_id))
        gold_df = gold_df.withColumn("_gold_execution_time", F.lit(execution_time))
        gold_df = gold_df.withColumn("_gold_silver_run_id", F.lit(silver_run_id))

        # Construct gold table path
        gold_table_path = os.path.join(self.base_path, "gold", table_name)

        # Check if table exists
        if DeltaTable.isDeltaTable(self.spark, gold_table_path):
            # Table exists - perform MERGE operation
            delta_table = DeltaTable.forPath(self.spark, gold_table_path)
            existing_df = delta_table.toDF()
            existing_columns = set(existing_df.columns)

            # Get all columns from the incoming DataFrame
            source_columns = set(gold_df.columns)

            # Find new columns that need to be added to the target table
            new_columns = source_columns - existing_columns

            if new_columns:
                # Add missing columns to target table with NULL values
                # This is done by writing a dummy row with the new schema, then removing it
                # Delta Lake will merge the schemas
                print(f"  Adding new columns to PoI table: {', '.join(new_columns)}", file=sys.stderr)

                # Create a DataFrame with just one dummy row containing all columns
                dummy_row = {col: None for col in gold_df.columns}
                dummy_row["id"] = "__DUMMY_ROW_FOR_SCHEMA__"  # Unique ID that won't conflict

                from pyspark.sql import Row
                dummy_df = self.spark.createDataFrame([Row(**dummy_row)], schema=gold_df.schema)

                # Append with schema merge to add new columns
                dummy_df.write.format("delta").mode("append").option("mergeSchema", "true").save(gold_table_path)

                # Delete the dummy row
                delta_table = DeltaTable.forPath(self.spark, gold_table_path)
                delta_table.delete("id = '__DUMMY_ROW_FOR_SCHEMA__'")

                # Refresh the table reference
                delta_table = DeltaTable.forPath(self.spark, gold_table_path)
                existing_columns = set(delta_table.toDF().columns)

            # Get all columns from the DataFrame (excluding metadata for matching)
            data_columns = [col for col in gold_df.columns if not col.startswith("_gold_")]

            # Build COALESCE update expressions for primary columns
            # This ensures we only update if the existing value is NULL
            update_expressions = {}
            for col_name in data_columns:
                if col_name.startswith("primary_") or col_name in ["source_id", "source_item_id"]:
                    # For primary columns: COALESCE(existing, new) - keep existing if not null
                    update_expressions[col_name] = F.coalesce(F.col(f"target.{col_name}"), F.col(f"source.{col_name}"))
                else:
                    # For other columns: just update with new value
                    update_expressions[col_name] = F.col(f"source.{col_name}")

            # Add metadata columns to update expressions
            for col_name in gold_df.columns:
                if col_name.startswith("_gold_"):
                    update_expressions[col_name] = F.col(f"source.{col_name}")

            # Perform merge
            delta_table.alias("target").merge(
                gold_df.alias("source"),
                "target.id = source.id"
            ).whenMatchedUpdate(
                set=update_expressions
            ).whenNotMatchedInsertAll().execute()

            row_count = gold_df.count()

        else:
            # Table doesn't exist - create it with initial data
            gold_df.write.format("delta").mode("append").save(gold_table_path)
            row_count = gold_df.count()

        return {
            "table_name": table_name,
            "table_path": gold_table_path,
            "row_count": row_count,
        }
