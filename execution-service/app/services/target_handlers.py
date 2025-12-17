from pyspark.sql import DataFrame
from typing import Dict, Any
import logging
import uuid
from app.services.udfs import normalize_gender, uuidv5_udf
from pyspark.sql import functions as F

logger = logging.getLogger(__name__)


class TargetHandlers:
    """
    Facade for handling different schema-specific transformations before writing to target database.
    Each handler is a static method that receives a DataFrameWriter and performs necessary transformations.
    """

    @staticmethod
    def interests_handler(df: DataFrame, context: Dict[str, Any]) -> DataFrame:
        pg_df = df.select(
            TargetHandlers.poi_id_col(context).alias("entity_id"),
            TargetHandlers.value_id_col("interest_name").alias("interest_id"),
            TargetHandlers.source_id_col(context),
            TargetHandlers.source_item_id_col(),
            TargetHandlers.id_col(),
        )
        pg_df = pg_df = pg_df.withColumn("entity_type", F.lit("PoI"))

        related_df = df.select(
            TargetHandlers.value_id_col("interest_name").alias("id"),
            df.interest_name.alias("interest_name"),
        ).distinct()

        return {
            "df": pg_df,
            "related_df": related_df,
            "related_table": "interest",
            "table_name": "interest_to_entities",
            "primary_col": "primary_name",
            "related_poi_col": "entity_id",
        }

    @staticmethod
    def industries_handler(df: DataFrame, context: Dict[str, Any]) -> DataFrame:
        pg_df = df.select(
            TargetHandlers.poi_id_col(context).alias("entity_id"),
            TargetHandlers.value_id_col("name").alias("industry_id"),
            TargetHandlers.source_id_col(context),
            TargetHandlers.source_item_id_col(),
            TargetHandlers.id_col(),
        )
        pg_df = pg_df = pg_df.withColumn("entity_type", F.lit("PoI"))

        related_df = df.select(
            TargetHandlers.value_id_col("name").alias("id"),
            df.name.alias("name"),
        ).distinct()

        return {
            "df": pg_df,
            "related_df": related_df,
            "related_table": "industry",
            "table_name": "industry_to_entities",
            "primary_col": "primary_industry",
            "related_poi_col": "entity_id",
        }

    @staticmethod
    def emails_handler(df: DataFrame, context: Dict[str, Any]) -> DataFrame:
        pg_df = df.select(
            TargetHandlers.poi_id_col(context).alias("entity_id"),
            TargetHandlers.value_id_col("email").alias("email_address_id"),
            TargetHandlers.source_id_col(context),
            TargetHandlers.source_item_id_col(),
            TargetHandlers.id_col(),
        )
        pg_df = pg_df = pg_df.withColumn("email_address_entity_type", F.lit("PoI"))

        related_df = df.select(  #
            TargetHandlers.value_id_col("email").alias("id"),
            df.email.alias("email_value"),
        ).distinct()

        return {
            "df": pg_df,
            "related_df": related_df,
            "related_table": "email",
            "table_name": "email_address_to_entities",
            "primary_col": "primary_email",
            "related_poi_col": "entity_id",
        }

    @staticmethod
    def names_handler(df: DataFrame, context: Dict[str, Any]) -> DataFrame:
        pg_df = df.select(
            df.first_name.alias("first_name"),
            df.last_name.alias("last_name"),
            TargetHandlers.source_id_col(context),
            TargetHandlers.source_item_id_col(),
            TargetHandlers.id_col(),
            TargetHandlers.poi_id_col(context).alias("poi_id"),
        )

        return {
            "df": pg_df,
            "table_name": "name_to_poi",
            "primary_col": "primary_name",
            "related_poi_col": "poi_id",
        }

    @staticmethod
    def phones_handler(df: DataFrame, context: Dict[str, Any]) -> DataFrame:
        pg_df = df.select(
            TargetHandlers.poi_id_col(context).alias("entity_id"),
            TargetHandlers.value_id_col("phone_number").alias("phone_number_id"),
            TargetHandlers.source_id_col(context),
            TargetHandlers.source_item_id_col(),
            TargetHandlers.id_col(),
        )
        pg_df = pg_df = pg_df.withColumn("entity_type", F.lit("PoI"))

        related_df = df.select(  #
            TargetHandlers.value_id_col("phone_number").alias("id"),
            df.phone_number.alias("original_value"),
            df.phone_number.alias("sanitized_value"),
        ).distinct()

        return {
            "df": pg_df,
            "related_df": related_df,
            "related_table": "phone_number",
            "table_name": "phone_number_to_entities",
            "primary_col": "primary_device",
            "related_poi_col": "entity_id",
        }

    @staticmethod
    def genders_handler(df: DataFrame, context: Dict[str, Any]) -> DataFrame:
        pg_df = df.select(
            normalize_gender(df.gender).alias("gender"),
            TargetHandlers.source_id_col(context),
            TargetHandlers.source_item_id_col(),
            TargetHandlers.id_col(),
            TargetHandlers.poi_id_col(context).alias("poi_id"),
        )

        return {
            "df": pg_df,
            "table_name": "gender",
            "primary_col": "primary_gender",
            "related_poi_col": "poi_id",
        }

    @staticmethod
    def poi_id_col(context):
        return uuidv5_udf(
            F.concat(F.col("entity_root_id"), F.lit(context["source_id"]))
        )

    @staticmethod
    def source_id_col(context):
        return uuidv5_udf(F.lit(context["source_id"] + "SparxSourceSystem")).alias(
            "source_id"
        )

    @staticmethod
    def id_col():
        return F.expr("uuid()").alias("id")

    @staticmethod
    def value_id_col(col: str):
        return uuidv5_udf(F.col(col))

    @staticmethod
    def source_item_id_col():
        return F.col("entity_id").cast("string").alias("source_item_id")

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
