"""
Shared utility for writing Person of Interest (PoI) data to Gold layer.
This module provides reusable functions for handlers that need to write PoI records.
"""

from pyspark.sql import DataFrame, SparkSession, functions as F
from pyspark.sql.window import Window
from delta.tables import DeltaTable
from typing import Dict, Any
import os
import sys


def write_poi_table(
    df: DataFrame,
    poi_col: str,
    primary_col: str,
    base_path: str,
    spark: SparkSession,
) -> Dict[str, Any]:
    """
    Write Person of Interest (PoI) data to gold layer with merge/upsert logic.

    This function:
    1. Deduplicates records by poi_col (keeps first occurrence)
    2. Extracts PoI fields (id, primary_*, source_id, source_item_id)
    3. Writes to person_of_interest table with COALESCE merge logic

    Args:
        df: DataFrame from handler containing:
            - poi_col: Column name to use as PoI ID
            - primary_col: Column name to use as primary field (e.g., "primary_name")
            - source_id: Source system ID
            - source_item_id: Source item ID
            - id: Record ID
            - _gold_* metadata columns (already injected)
        poi_col: Name of the column to use as PoI ID (e.g., "entity_id", "poi_id")
        primary_col: Name of the primary column (e.g., "primary_name", "primary_email")
        base_path: Base path for gold layer storage
        spark: Spark session

    Returns:
        Dict with write results: {"table_name": str, "table_path": str, "row_count": int}

    Raises:
        ValueError: If required columns are missing
    """
    # Validate required columns
    required_cols = [poi_col, "id", "source_id", "source_item_id"]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns for PoI write: {missing_cols}")

    # Deduplicate by poi_col (keep first occurrence per PoI)
    w = Window.partitionBy(poi_col).orderBy("id")
    poi_df = (
        df.withColumn("rn", F.row_number().over(w))
        .filter(F.col("rn") == 1)
        .drop("rn")
        .select(
            F.col(poi_col).alias("id"),
            F.col("id").alias(primary_col),
            "source_id",
            "source_item_id",
            # Include all _gold_* metadata columns
            *[col for col in df.columns if col.startswith("_gold_")],
        )
    )

    # Check if DataFrame has data
    if poi_df.count() == 0:
        print(f"⚠ Skipping PoI write: no PoI data to write", file=sys.stderr)
        return {
            "table_name": "person_of_interest",
            "table_path": os.path.join(base_path, "gold", "person_of_interest"),
            "row_count": 0,
        }

    # Construct gold table path
    gold_table_path = os.path.join(base_path, "gold", "person_of_interest")

    # Check if table exists
    if DeltaTable.isDeltaTable(spark, gold_table_path):
        # Table exists - perform MERGE operation
        delta_table = DeltaTable.forPath(spark, gold_table_path)
        existing_df = delta_table.toDF()
        existing_columns = set(existing_df.columns)

        # Get all columns from the incoming DataFrame
        source_columns = set(poi_df.columns)

        # Find new columns that need to be added to the target table
        new_columns = source_columns - existing_columns

        if new_columns:
            # Add missing columns to target table with NULL values
            print(
                f"  Adding new columns to PoI table: {', '.join(new_columns)}",
                file=sys.stderr,
            )

            # Create a DataFrame with just one dummy row containing all columns
            from pyspark.sql import Row

            # Get schema information to handle non-nullable fields
            schema_fields = {field.name: field for field in poi_df.schema.fields}

            dummy_row = {}
            for col in poi_df.columns:
                field = schema_fields[col]
                # Provide appropriate dummy values based on nullable constraint
                if not field.nullable or col in ["id", "source_id", "source_item_id"]:
                    # For non-nullable fields or key fields, provide dummy string values
                    dummy_row[col] = "__DUMMY__"
                else:
                    # For nullable fields, use None
                    dummy_row[col] = None

            # Override id with unique value
            dummy_row["id"] = "__DUMMY_ROW_FOR_SCHEMA__"

            dummy_df = spark.createDataFrame([Row(**dummy_row)], schema=poi_df.schema)

            # Append with schema merge to add new columns
            dummy_df.write.format("delta").mode("append").option(
                "mergeSchema", "true"
            ).save(gold_table_path)

            # Delete the dummy row
            delta_table = DeltaTable.forPath(spark, gold_table_path)
            delta_table.delete("id = '__DUMMY_ROW_FOR_SCHEMA__'")

            # Refresh the table reference
            delta_table = DeltaTable.forPath(spark, gold_table_path)
            existing_columns = set(delta_table.toDF().columns)

        # Get all columns from the DataFrame (excluding metadata for matching)
        data_columns = [col for col in poi_df.columns if not col.startswith("_gold_")]

        # Build COALESCE update expressions for primary columns
        # This ensures we only update if the existing value is NULL
        update_expressions = {}
        for col_name in data_columns:
            if col_name.startswith("primary_") or col_name in [
                "source_id",
                "source_item_id",
            ]:
                # For primary columns: COALESCE(existing, new) - keep existing if not null
                update_expressions[col_name] = F.coalesce(
                    F.col(f"target.{col_name}"), F.col(f"source.{col_name}")
                )
            else:
                # For other columns: just update with new value
                update_expressions[col_name] = F.col(f"source.{col_name}")

        # Add metadata columns to update expressions
        for col_name in poi_df.columns:
            if col_name.startswith("_gold_"):
                update_expressions[col_name] = F.col(f"source.{col_name}")

        # Build insert expressions - only insert columns that exist in source
        insert_expressions = {col: F.col(f"source.{col}") for col in poi_df.columns}

        # Perform merge
        delta_table.alias("target").merge(
            poi_df.alias("source"), "target.id = source.id"
        ).whenMatchedUpdate(set=update_expressions).whenNotMatchedInsert(
            values=insert_expressions
        ).execute()

        row_count = poi_df.count()

    else:
        # Table doesn't exist - create it with initial data
        poi_df.write.format("delta").mode("append").save(gold_table_path)
        row_count = poi_df.count()

    print(
        f"✓ Gold layer (PoI): {row_count} PoI records written/updated", file=sys.stderr
    )

    return {
        "table_name": "person_of_interest",
        "table_path": gold_table_path,
        "row_count": row_count,
    }
