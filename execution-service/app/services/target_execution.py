import time
from typing import Dict, Any
import requests
from pyspark.sql import DataFrame
from .delta_writer import get_spark_session
from .target_handlers import TargetHandlers
from sqlalchemy import create_engine
import logging
from ..config import get_settings
from pyspark.sql.window import Window
from pyspark.sql import functions as F
import psycopg2

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
                - run_id: Run ID
                - mapping_id: Mapping ID
                - status: Execution status
                - rows_written: Number of rows written to Delta
                - execution_time: Execution timestamp
                - delta_table_path: Path to Delta table

        Returns:
            Dictionary with execution results
        """
        run_id = context["run_id"]
        mapping_id = context["mapping_id"]
        delta_table_path = context["delta_table_path"]

        try:
            # Step 1: Read data from Delta table filtered by run_id
            logger.info(f"Reading Delta table from {delta_table_path} for run_id: {run_id}")
            df = self._read_delta_table(delta_table_path, run_id)

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
                "run_id": run_id,
                "mapping_id": mapping_id,
                "status": "success",
                "rows_written_to_target": rows_written,
                "target_table": table_name,
                "error_message": None,
            }

        except Exception as e:
            logger.error(f"Target execution failed: {str(e)}")
            return {
                "run_id": run_id,
                "mapping_id": mapping_id,
                "status": "failed",
                "rows_written_to_target": 0,
                "target_table": None,
                "error_message": str(e),
            }

    def _read_delta_table(self, delta_table_path: str, run_id: str) -> DataFrame:
        """Read data from Delta table filtered by run_id"""
        df = self.spark.read.format("delta").load(delta_table_path)
        # Filter by run_id to only get data from this specific run
        df = df.filter(F.col("run_id") == run_id)
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

    def get_pg_writer(self, df, target_db_config, table_name, mode="append"):
        jdbc_url = (
            f"jdbc:postgresql://{target_db_config['host']}:{target_db_config['port']}"
            f"/{target_db_config['database']}"
        )

        return (
            df.write.format("jdbc")
            .option("url", jdbc_url)
            .option("dbtable", table_name)
            .option("user", target_db_config["username"])
            .option("password", target_db_config["password"])
            .option("driver", "org.postgresql.Driver")
            .option("stringtype", "unspecified")
            .mode(mode)
        )

    def _write_to_target_db(
        self,
        df: DataFrame,
        schema_handler: str,
        source_id: str,
        target_db_config: Dict[str, Any],
    ) -> int:
        """Write Spark DataFrame to target PostgreSQL database using Spark JDBC"""

        context = {"source_id": source_id}
        try:
            handler = TargetHandlers.get_handler(schema_handler)
            res = handler(df, context)
            writer = self.get_pg_writer(
                res["df"], target_db_config, res["table_name"], "append"
            )
            writer.save()

            res["df"].show(5, truncate=False)

            if "related_df" in res:
                self._write_related_with_conflict_handling(
                    res["related_df"], target_db_config, res["related_table"]
                )
                res["related_df"].show(5, truncate=False)
            w = Window.partitionBy(res["related_poi_col"]).orderBy("id")
            poi_df = (
                res["df"]
                .withColumn("rn", F.row_number().over(w))
                .filter(F.col("rn") == 1)
                .drop("rn")
                .select(
                    F.col(res["related_poi_col"]).alias("id"),
                    F.col("id").alias(res["primary_col"]),  # keep the original id too
                    "source_id",
                    "source_item_id",
                )
            )

            self._write_poi(poi_df, target_db_config)

        except ValueError as e:
            logger.warning(
                f"Handler error: {str(e)}. Writing without handler transformations."
            )
        return df.count()

    def _write_poi(self, df: DataFrame, target_db_config: Dict[str, Any]) -> None:
        temp_table = f"person_of_interest_temp_{int(time.time())}"

        conn = psycopg2.connect(
            **{
                "host": target_db_config["host"],
                "port": target_db_config["port"],
                "database": target_db_config["database"],
                "user": target_db_config["username"],
                "password": target_db_config["password"],
            }
        )
        cursor = conn.cursor()
        cursor.execute(f"""
        CREATE TABLE {temp_table} (LIKE person_of_interest INCLUDING ALL)
        """)
        conn.commit()

        writer = self.get_pg_writer(df, target_db_config, temp_table)
        saved = writer.save()

        cursor.execute(f"""
                       INSERT INTO person_of_interest (id, primary_name, primary_gender, primary_interest, primary_email, primary_device)
            SELECT id, primary_name, primary_gender, primary_interest, primary_email, primary_device
            FROM {temp_table}
            ON CONFLICT (id)
            DO UPDATE
            SET
            primary_name   = COALESCE(person_of_interest.primary_name, EXCLUDED.primary_name),
            primary_gender = COALESCE(person_of_interest.primary_gender, EXCLUDED.primary_gender),
            primary_interest = COALESCE(person_of_interest.primary_interest, EXCLUDED.primary_interest),
            primary_email = COALESCE(person_of_interest.primary_email, EXCLUDED.primary_email),
            primary_device = COALESCE(person_of_interest.primary_device, EXCLUDED.primary_device)
        """)
        conn.commit()

        cursor.execute(f"DROP TABLE {temp_table}")
        conn.commit()
        cursor.execute("REFRESH materialized view mv_person_of_interest_details;")
        conn.commit()
        print(saved)

    def _write_related_with_conflict_handling(
        self, df: DataFrame, target_db_config: Dict[str, Any], table_name: str
    ) -> None:
        """Write related table data with proper conflict handling using temp table strategy"""
        temp_table = f"{table_name}_temp_{int(time.time())}"

        conn = psycopg2.connect(
            **{
                "host": target_db_config["host"],
                "port": target_db_config["port"],
                "database": target_db_config["database"],
                "user": target_db_config["username"],
                "password": target_db_config["password"],
            }
        )
        cursor = conn.cursor()

        try:
            # Create temp table with same structure as target table
            cursor.execute(f"""
                CREATE TABLE {temp_table} (LIKE {table_name} INCLUDING ALL)
            """)
            conn.commit()

            # Write data to temp table
            writer = self.get_pg_writer(df, target_db_config, temp_table, "append")
            writer.save()

            # Insert from temp table with conflict handling
            cursor.execute(f"""
                INSERT INTO {table_name}
                SELECT * FROM {temp_table}
                ON CONFLICT (id) DO NOTHING
            """)
            conn.commit()

            logger.info(f"Successfully wrote to {table_name} with conflict handling")

        except Exception as e:
            conn.rollback()
            logger.error(f"Failed to write to {table_name}: {str(e)}")
            raise
        finally:
            # drop temp table and close connection
            cursor.execute(f"DROP TABLE {temp_table}")
            conn.commit()
            cursor.close()
            conn.close()


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
