from pyspark.sql import DataFrame
from typing import Dict, Any
import logging
import uuid
from app.services.udfs import uuidv5_udf
from pyspark.sql.functions import lit, concat

logger = logging.getLogger(__name__)


class TargetHandlers:
    """
    Facade for handling different schema-specific transformations before writing to target database.
    Each handler is a static method that receives a DataFrameWriter and performs necessary transformations.
    """

    @staticmethod
    def names_handler(df: DataFrame, context: Dict[str, Any]) -> DataFrame:
        """
        Handler for names schema.
        Applies names-specific transformations to the DataFrameWriter before saving.

        Args:
            writer: Spark DataFrameWriter configured with JDBC options
            schema_handler: The handler name (for logging/validation)

        Returns:
            Modified DataFrameWriter ready to save
        """
        logger.info("Applying transformations")

        pg_df = df.select(
            df.first_name.alias("first_name"),
            df.last_name.alias("last_name"),
            # df.source_platform.alias("source_platform"),
            df.full_name.alias("full_name"),
            df.entity_id.alias("source_item_id"),
            df.entity_id.alias("source_id"),
            uuidv5_udf(concat(lit(context["source_id"]), df.entity_root_id)).alias(
                "poi_id"
            ),
            uuidv5_udf(lit(context["source_id"])).alias("source_platform"),
        )
        pg_df = pg_df.withColumn("source_platform", lit(context["source_id"]))

        df.printSchema()
        pg_df.show(truncate=False)

        return {"df": pg_df, "table_name": "name_to_poi"}

    @staticmethod
    def get_handler(schema_handler: str):
        """
        Get the appropriate handler function based on schema_handler name.

        Args:
            schema_handler: Name of the handler (e.g., "names_handler")

        Returns:
            Handler function

        Raises:
            ValueError: If handler not found
        """
        if not schema_handler:
            raise ValueError("schema_handler cannot be empty")

        # Get the handler method from the class
        handler = getattr(TargetHandlers, schema_handler, None)

        if handler is None:
            raise ValueError(
                f"Handler '{schema_handler}' not found. "
                f"Available handlers: {TargetHandlers.list_handlers()}"
            )

        if not callable(handler):
            raise ValueError(f"Handler '{schema_handler}' is not callable")

        return handler

    @staticmethod
    def list_handlers():
        """
        List all available handler names.

        Returns:
            List of handler method names
        """
        handlers = [
            name
            for name in dir(TargetHandlers)
            if not name.startswith("_")
            and name not in ["get_handler", "list_handlers"]
            and callable(getattr(TargetHandlers, name))
        ]
        return handlers
