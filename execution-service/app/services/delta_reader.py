from pyspark.sql import DataFrame
from typing import Dict, Any, List, Optional
from .delta_writer import get_spark_session
from delta.tables import DeltaTable
import os
from ..config import get_settings
from ..utils.exceptions import DeltaWriteError

settings = get_settings()


def read_delta_table(
    table_name: str,
    filters: Optional[Dict[str, Any]] = None,
    limit: int = 100,
    offset: int = 0,
) -> Dict[str, Any]:
    """
    Read data from a Delta Lake table with optional filtering and pagination.

    Args:
        table_name: Name of the delta table (schema name)
        filters: Dictionary of field names to filter values
        limit: Maximum number of rows to return
        offset: Number of rows to skip

    Returns:
        Dictionary containing:
        - data: List of row dictionaries
        - total_count: Total number of rows matching filters
        - columns: List of column names with their types

    Raises:
        DeltaWriteError: If table doesn't exist or read fails
    """
    try:
        spark = get_spark_session()

        # Construct Delta Lake table path
        delta_table_path = os.path.join(settings.delta_lake_base_path, table_name)

        # Check if table exists
        if not DeltaTable.isDeltaTable(spark, delta_table_path):
            raise DeltaWriteError(f"Delta table '{table_name}' does not exist")

        # Read the Delta table
        df: DataFrame = spark.read.format("delta").load(delta_table_path)

        # Apply filters if provided
        if filters:
            for field_name, filter_value in filters.items():
                if filter_value is not None and filter_value != "":
                    # Check if column exists
                    if field_name not in df.columns:
                        continue

                    # Convert filter value to string for LIKE search
                    filter_str = str(filter_value)
                    # Use LIKE for string matching (case-insensitive partial match)
                    df = df.filter(df[field_name].cast("string").like(f"%{filter_str}%"))

        # Get total count after filtering
        total_count = df.count()

        # Apply pagination
        df = df.offset(offset).limit(limit)

        # Get column information
        columns = [
            {"name": field.name, "type": str(field.dataType)}
            for field in df.schema.fields
        ]

        # Convert to list of dictionaries
        rows = df.collect()
        data = [row.asDict() for row in rows]

        return {
            "data": data,
            "total_count": total_count,
            "columns": columns,
            "limit": limit,
            "offset": offset,
        }

    except DeltaWriteError:
        raise
    except Exception as e:
        raise DeltaWriteError(f"Failed to read from Delta Lake: {str(e)}")


def get_table_schema(table_name: str) -> Dict[str, Any]:
    """
    Get schema information for a Delta Lake table.

    Args:
        table_name: Name of the delta table

    Returns:
        Dictionary containing:
        - columns: List of column names with their types
        - table_name: Name of the table
        - table_path: Path to the Delta table

    Raises:
        DeltaWriteError: If table doesn't exist
    """
    try:
        spark = get_spark_session()

        # Construct Delta Lake table path
        delta_table_path = os.path.join(settings.delta_lake_base_path, table_name)

        # Check if table exists
        if not DeltaTable.isDeltaTable(spark, delta_table_path):
            raise DeltaWriteError(f"Delta table '{table_name}' does not exist")

        # Read the Delta table schema
        df = spark.read.format("delta").load(delta_table_path)

        # Get column information
        columns = [
            {"name": field.name, "type": str(field.dataType)}
            for field in df.schema.fields
        ]

        return {
            "table_name": table_name,
            "table_path": delta_table_path,
            "columns": columns,
        }

    except DeltaWriteError:
        raise
    except Exception as e:
        raise DeltaWriteError(f"Failed to read table schema: {str(e)}")
