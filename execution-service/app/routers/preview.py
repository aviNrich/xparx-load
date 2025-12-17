from fastapi import APIRouter, HTTPException, status, Depends
from pymongo.database import Database
from bson import ObjectId
from pydantic import BaseModel
from typing import List, Optional, Literal
from ..database import get_database
from pyspark.sql import SparkSession
from functools import reduce
from ..utils.encryption import decrypt_password
from ..services.delta_writer import get_spark_session
import os

router = APIRouter(prefix="/preview", tags=["preview"])


class PreviewRequest(BaseModel):
    connection_id: str
    sql_query: str
    limit: Optional[int] = 100


class PreviewResponse(BaseModel):
    columns: List[str]
    rows: List[List]
    row_count: int


@router.post("/", response_model=PreviewResponse)
def preview_data(
    request: PreviewRequest,
    db: Database = Depends(get_database)
):
    """Preview data from connection (DB or file) using Spark with SQL filtering"""
    try:
        # Get connection from database
        if not ObjectId.is_valid(request.connection_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid connection ID: {request.connection_id}"
            )

        connection = db.connections.find_one({"_id": ObjectId(request.connection_id)})
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Connection not found: {request.connection_id}"
            )

        # Validate query is a SELECT statement
        query_upper = request.sql_query.strip().upper()
        if not query_upper.startswith("SELECT"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only SELECT queries are allowed"
            )

        spark = get_spark_session()
        db_type = connection.get("db_type")

        # Load data based on connection type
        if db_type in ["mysql", "postgresql"]:
            # Database connection - use JDBC
            password = decrypt_password(connection["password"])

            if db_type == "mysql":
                jdbc_url = f"jdbc:mysql://{connection['host']}:{connection['port']}/{connection['database']}"
                driver = "com.mysql.cj.jdbc.Driver"
            else:  # postgresql
                jdbc_url = f"jdbc:postgresql://{connection['host']}:{connection['port']}/{connection['database']}"
                driver = "org.postgresql.Driver"

            # Execute query directly via JDBC
            df = spark.read.format("jdbc") \
                .option("url", jdbc_url) \
                .option("query", f"({request.sql_query}) as subquery") \
                .option("user", connection["username"]) \
                .option("password", password) \
                .option("driver", driver) \
                .load()

        elif db_type == "file":
            # File connection - load files and create temp view
            file_type = connection.get("file_type", "csv")
            file_paths = connection.get("file_paths", [])

            if not file_paths:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No files found in connection"
                )

            # Read all files based on file type
            if file_type == "csv":
                dfs = [spark.read.csv(fp, header=True, inferSchema=True) for fp in file_paths]
            elif file_type == "json":
                dfs = [spark.read.json(fp) for fp in file_paths]
            elif file_type == "excel":
                dfs = [spark.read.format("com.crealytics.spark.excel")
                      .option("header", "true")
                      .option("inferSchema", "true")
                      .load(fp) for fp in file_paths]
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported file type: {file_type}"
                )

            # Union all dataframes if multiple files
            df = dfs[0] if len(dfs) == 1 else reduce(lambda a, b: a.union(b), dfs)

            # Create temp view named "file"
            df.createOrReplaceTempView("file")

            # Execute SQL query
            df = spark.sql(request.sql_query)

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported connection type: {db_type}"
            )

        # Limit results
        df = df.limit(request.limit)

        # Convert to pandas for easy serialization
        pandas_df = df.toPandas()

        # Format response
        columns = pandas_df.columns.tolist()
        rows = pandas_df.fillna("").values.tolist()

        return PreviewResponse(
            columns=columns,
            rows=rows,
            row_count=len(rows)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to preview data: {str(e)}"
        )
