from typing import Dict, Any
import requests
from pyspark.sql import DataFrame
from .delta_writer import get_spark_session
from .target_handlers import TargetHandlers
from sqlalchemy import create_engine
import logging
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class TargetExecutionService:
    """Service for writing Delta Lake data to target database"""

    def __init__(self):
        self.spark = get_spark_session()

    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute target database write operation.

        Args:
            context: Dictionary containing:
                - execution_id: Execution ID
                - mapping_id: Mapping ID
                - status: Execution status
                - rows_written: Number of rows written to Delta
                - execution_time: Execution timestamp
                - delta_table_path: Path to Delta table

        Returns:
            Dictionary with execution results
        """
        execution_id = context["execution_id"]
        mapping_id = context["mapping_id"]
        delta_table_path = context["delta_table_path"]

        try:
            # Step 1: Read data from Delta table
            logger.info(f"Reading Delta table from {delta_table_path}")
            df = self._read_delta_table(delta_table_path)

            # Step 2: Get target database settings from backend
            logger.info("Fetching target database settings")
            target_db_config = self._get_target_db_settings()

            if not target_db_config:
                raise Exception("Target database settings not configured")

            # Step 3: Connect to target database
            logger.info(f"Connecting to target database: {target_db_config['host']}")

            # Step 4: Write DataFrame to target database using Spark
            logger.info("Writing data to target database")
            table_name = self._extract_table_name_from_path(delta_table_path)
            rows_written = self._write_to_target_db(
                df,
                context["schema_handler"],
                context["source_id"],
                target_db_config,
            )

            logger.info(f"Successfully wrote {rows_written} rows to target database")

            return {
                "execution_id": execution_id,
                "mapping_id": mapping_id,
                "status": "success",
                "rows_written_to_target": rows_written,
                "target_table": table_name,
                "error_message": None,
            }

        except Exception as e:
            logger.error(f"Target execution failed: {str(e)}")
            return {
                "execution_id": execution_id,
                "mapping_id": mapping_id,
                "status": "failed",
                "rows_written_to_target": 0,
                "target_table": None,
                "error_message": str(e),
            }

    def _read_delta_table(self, delta_table_path: str) -> DataFrame:
        """Read data from Delta table"""
        df = self.spark.read.format("delta").load(delta_table_path)
        return df

    def _get_target_db_settings(self) -> Dict[str, Any]:
        """Fetch target database settings from backend API"""
        try:
            response = requests.get(
                f"{settings.backend_api_url}/api/v1/system-settings/target-db-decrypted",
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("target_db")
        except requests.RequestException as e:
            logger.error(f"Failed to fetch target DB settings: {str(e)}")
            raise Exception(f"Failed to fetch target database settings: {str(e)}")

    def _create_target_db_connection(self, config: Dict[str, Any]):
        """Create SQLAlchemy engine for target database"""
        connection_string = (
            f"postgresql://{config['username']}:{config['password']}@"
            f"{config['host']}:{config['port']}/{config['database']}"
        )

        engine = create_engine(
            connection_string, pool_pre_ping=True, pool_size=5, max_overflow=10
        )

        return engine

    def _extract_table_name_from_path(self, delta_table_path: str) -> str:
        """Extract table name from Delta table path"""
        # Path format: /path/to/delta-lake/schema_name
        return delta_table_path.rstrip("/").split("/")[-1]

    def _write_to_target_db(
        self,
        df: DataFrame,
        schema_handler: str,
        source_id: str,
        target_db_config: Dict[str, Any],
    ) -> int:
        """Write Spark DataFrame to target PostgreSQL database using Spark JDBC"""
        jdbc_url = (
            f"jdbc:postgresql://{target_db_config['host']}:{target_db_config['port']}"
            f"/{target_db_config['database']}"
        )

        context = {"source_id": source_id}
        try:
            handler = TargetHandlers.get_handler(schema_handler)
            res = handler(df, context)
            writer = (
                res["df"]
                .write.format("jdbc")
                .option("url", jdbc_url)
                .option("dbtable", res["table_name"])
                .option("user", target_db_config["username"])
                .option("password", target_db_config["password"])
                .option("driver", "org.postgresql.Driver")
                .option("stringtype", "unspecified")
                .mode("append")
            )
            writer.save()

        except ValueError as e:
            logger.warning(
                f"Handler error: {str(e)}. Writing without handler transformations."
            )
        return df.count()


def execute_target_write(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function to execute target database write.

    Args:
        context: Execution context containing execution details

    Returns:
        Dictionary with execution results
    """
    service = TargetExecutionService()
    return service.execute(context)
