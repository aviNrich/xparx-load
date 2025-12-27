from pyspark.sql import DataFrame, SparkSession
from typing import Dict, Any
import logging
import uuid
import os
import sys
from app.services.udfs import normalize_gender, normalize_name_udf, uuidv5_udf
from app.services.poi_writer import write_poi_table
from pyspark.sql import functions as F

logger = logging.getLogger(__name__)


class GoldHandlers:
    """
    Facade for handling different schema-specific transformations before writing to target database.
    Each handler is a static method that receives a DataFrameWriter and performs necessary transformations.
    """

    @staticmethod
    def interests_handler(
        df: DataFrame, context: Dict[str, Any], base_path: str, spark: SparkSession
    ) -> Dict[str, Any]:
        # Transform main data
        main_df = df.select(
            GoldHandlers.poi_id_col(context).alias("entity_id"),
            GoldHandlers.value_id_col("interest_name").alias("interest_id"),
            GoldHandlers.source_id_col(context),
            GoldHandlers.source_item_id_col(),
            GoldHandlers.id_col(),
            *[
                col for col in df.columns if col.startswith("_gold_")
            ],  # Include metadata
        )
        main_df = main_df.withColumn("entity_type", F.lit("PoI"))

        # Transform related data
        related_df = df.select(
            GoldHandlers.value_id_col("interest_name").alias("id"),
            df.interest_name.alias("interest_name"),
            *[
                col for col in df.columns if col.startswith("_gold_")
            ],  # Include metadata
        ).distinct()

        # Write main table
        main_table_path = os.path.join(base_path, "gold", "interest_to_entities")
        main_df.write.format("delta").mode("append").option("mergeSchema", "true").save(
            main_table_path
        )
        main_row_count = main_df.count()
        print(
            f"✓ Gold layer (main): {main_row_count} rows written to interest_to_entities",
            file=sys.stderr,
        )

        # Write related table
        related_table_path = os.path.join(base_path, "gold", "interest")
        related_df.write.format("delta").mode("append").option(
            "mergeSchema", "true"
        ).save(related_table_path)
        related_row_count = related_df.count()
        print(
            f"✓ Gold layer (related): {related_row_count} rows written to interest",
            file=sys.stderr,
        )

        # Write PoI table
        poi_result = write_poi_table(
            df=main_df,
            poi_col="entity_id",
            primary_col="primary_name",
            base_path=base_path,
            spark=spark,
        )

        return {
            "main": {"table_name": "interest_to_entities", "row_count": main_row_count},
            "related": {"table_name": "interest", "row_count": related_row_count},
            "poi": {"row_count": poi_result["row_count"]},
        }

    @staticmethod
    def industries_handler(
        df: DataFrame, context: Dict[str, Any], base_path: str, spark: SparkSession
    ) -> Dict[str, Any]:
        # Transform main data
        main_df = df.select(
            GoldHandlers.poi_id_col(context).alias("entity_id"),
            GoldHandlers.value_id_col("name").alias("industry_id"),
            GoldHandlers.source_id_col(context),
            GoldHandlers.source_item_id_col(),
            GoldHandlers.id_col(),
            *[
                col for col in df.columns if col.startswith("_gold_")
            ],  # Include metadata
        )
        main_df = main_df.withColumn("entity_type", F.lit("PoI"))

        # Transform related data
        related_df = df.select(
            GoldHandlers.value_id_col("name").alias("id"),
            df.name.alias("name"),
            *[
                col for col in df.columns if col.startswith("_gold_")
            ],  # Include metadata
        ).distinct()

        # Write main table
        main_table_path = os.path.join(base_path, "gold", "industry_to_entities")
        main_df.write.format("delta").mode("append").option("mergeSchema", "true").save(
            main_table_path
        )
        main_row_count = main_df.count()
        print(
            f"✓ Gold layer (main): {main_row_count} rows written to industry_to_entities",
            file=sys.stderr,
        )

        # Write related table
        related_table_path = os.path.join(base_path, "gold", "industry")
        related_df.write.format("delta").mode("append").option(
            "mergeSchema", "true"
        ).save(related_table_path)
        related_row_count = related_df.count()
        print(
            f"✓ Gold layer (related): {related_row_count} rows written to industry",
            file=sys.stderr,
        )

        # Note: No PoI write for industries (no primary_col defined)

        return {
            "main": {"table_name": "industry_to_entities", "row_count": main_row_count},
            "related": {"table_name": "industry", "row_count": related_row_count},
            "poi": None,
        }

    @staticmethod
    def emails_handler(
        df: DataFrame, context: Dict[str, Any], base_path: str, spark: SparkSession
    ) -> Dict[str, Any]:
        # Transform main data
        main_df = df.select(
            GoldHandlers.poi_id_col(context).alias("entity_id"),
            GoldHandlers.value_id_col("email").alias("email_address_id"),
            GoldHandlers.source_id_col(context),
            GoldHandlers.source_item_id_col(),
            GoldHandlers.id_col(),
            *[
                col for col in df.columns if col.startswith("_gold_")
            ],  # Include metadata
        )
        main_df = main_df.withColumn("email_address_entity_type", F.lit("PoI"))

        # Transform related data
        related_df = df.select(
            GoldHandlers.value_id_col("email").alias("id"),
            df.email.alias("email_value"),
            *[
                col for col in df.columns if col.startswith("_gold_")
            ],  # Include metadata
        ).distinct()

        # Write main table
        main_table_path = os.path.join(base_path, "gold", "email_address_to_entities")
        main_df.write.format("delta").mode("append").option("mergeSchema", "true").save(
            main_table_path
        )
        main_row_count = main_df.count()
        print(
            f"✓ Gold layer (main): {main_row_count} rows written to email_address_to_entities",
            file=sys.stderr,
        )

        # Write related table
        related_table_path = os.path.join(base_path, "gold", "email")
        related_df.write.format("delta").mode("append").option(
            "mergeSchema", "true"
        ).save(related_table_path)
        related_row_count = related_df.count()
        print(
            f"✓ Gold layer (related): {related_row_count} rows written to email",
            file=sys.stderr,
        )

        # Write PoI table
        poi_result = write_poi_table(
            df=main_df,
            poi_col="entity_id",
            primary_col="primary_email",
            base_path=base_path,
            spark=spark,
        )

        return {
            "main": {
                "table_name": "email_address_to_entities",
                "row_count": main_row_count,
            },
            "related": {"table_name": "email", "row_count": related_row_count},
            "poi": {"row_count": poi_result["row_count"]},
        }

    @staticmethod
    def names_handler(
        df: DataFrame, context: Dict[str, Any], base_path: str, spark: SparkSession
    ) -> Dict[str, Any]:
        columns = ["first_name", "middle_name", "last_name", "full_name"]

        # add missing columns if they don't exist, so UDF can safely run
        for c in columns:
            if c not in df.columns:
                df = df.withColumn(c, F.lit(None).cast("string"))
        # Transform main data
        main_df = df.select(
            GoldHandlers.source_id_col(context),
            GoldHandlers.source_item_id_col(),
            GoldHandlers.id_col(),
            GoldHandlers.poi_id_col(context).alias("poi_id"),
            *[F.col(c) for c in columns],
            *[
                col for col in df.columns if col.startswith("_gold_")
            ],  # Include metadata
        )

        # Apply normalization and extract fields from the struct
        main_df = main_df.withColumn(
            "normalized",
            normalize_name_udf(
                F.col("first_name"),
                F.col("middle_name"),
                F.col("last_name"),
                F.col("full_name"),
            ),
        )

        # Extract normalized fields from the struct and replace original columns
        main_df = main_df.withColumn("first_name", F.col("normalized.first_name")) \
                         .withColumn("middle_name", F.col("normalized.middle_name")) \
                         .withColumn("last_name", F.col("normalized.last_name")) \
                         .withColumn("full_name", F.col("normalized.full_name")) \
                         .drop("normalized")

        # Write main table
        main_table_path = os.path.join(base_path, "gold", "name_to_poi")
        main_df.write.format("delta").mode("append").option("mergeSchema", "true").save(
            main_table_path
        )
        main_row_count = main_df.count()
        print(
            f"✓ Gold layer (main): {main_row_count} rows written to name_to_poi",
            file=sys.stderr,
        )

        # Write PoI table
        poi_result = write_poi_table(
            df=main_df,
            poi_col="poi_id",
            primary_col="primary_name",
            base_path=base_path,
            spark=spark,
        )

        return {
            "main": {"table_name": "name_to_poi", "row_count": main_row_count},
            "related": None,
            "poi": {"row_count": poi_result["row_count"]},
        }

    @staticmethod
    def phones_handler(
        df: DataFrame, context: Dict[str, Any], base_path: str, spark: SparkSession
    ) -> Dict[str, Any]:
        # Transform main data
        main_df = df.select(
            GoldHandlers.poi_id_col(context).alias("entity_id"),
            GoldHandlers.value_id_col("phone_number").alias("phone_number_id"),
            GoldHandlers.source_id_col(context),
            GoldHandlers.source_item_id_col(),
            GoldHandlers.id_col(),
            *[
                col for col in df.columns if col.startswith("_gold_")
            ],  # Include metadata
        )
        main_df = main_df.withColumn("entity_type", F.lit("PoI"))

        # Transform related data
        related_df = df.select(
            GoldHandlers.value_id_col("phone_number").alias("id"),
            df.phone_number.alias("original_value"),
            df.phone_number.alias("sanitized_value"),
            *[
                col for col in df.columns if col.startswith("_gold_")
            ],  # Include metadata
        ).distinct()

        # Write main table
        main_table_path = os.path.join(base_path, "gold", "phone_number_to_entities")
        main_df.write.format("delta").mode("append").option("mergeSchema", "true").save(
            main_table_path
        )
        main_row_count = main_df.count()
        print(
            f"✓ Gold layer (main): {main_row_count} rows written to phone_number_to_entities",
            file=sys.stderr,
        )

        # Write related table
        related_table_path = os.path.join(base_path, "gold", "phone_number")
        related_df.write.format("delta").mode("append").option(
            "mergeSchema", "true"
        ).save(related_table_path)
        related_row_count = related_df.count()
        print(
            f"✓ Gold layer (related): {related_row_count} rows written to phone_number",
            file=sys.stderr,
        )

        # Write PoI table
        poi_result = write_poi_table(
            df=main_df,
            poi_col="entity_id",
            primary_col="primary_device",
            base_path=base_path,
            spark=spark,
        )

        return {
            "main": {
                "table_name": "phone_number_to_entities",
                "row_count": main_row_count,
            },
            "related": {"table_name": "phone_number", "row_count": related_row_count},
            "poi": {"row_count": poi_result["row_count"]},
        }

    @staticmethod
    def genders_handler(
        df: DataFrame, context: Dict[str, Any], base_path: str, spark: SparkSession
    ) -> Dict[str, Any]:
        # Transform main data
        main_df = df.select(
            GoldHandlers.source_id_col(context),
            GoldHandlers.source_item_id_col(),
            GoldHandlers.id_col(),
            GoldHandlers.poi_id_col(context).alias("poi_id"),
            normalize_gender(df.gender).alias("gender"),
            *[
                col for col in df.columns if col.startswith("_gold_")
            ],  # Include metadata
        ).cache()

        # Get count before any write operations
        main_row_count = main_df.count()

        # Write main table
        main_table_path = os.path.join(base_path, "gold", "gender")
        main_df.write.format("delta").mode("append").option("mergeSchema", "true").save(
            main_table_path
        )
        print(
            f"✓ Gold layer (main): {main_row_count} rows written to gender",
            file=sys.stderr,
        )

        # Write PoI table
        poi_result = write_poi_table(
            df=main_df,
            poi_col="poi_id",
            primary_col="primary_gender",
            base_path=base_path,
            spark=spark,
        )

        # Unpersist after all operations
        main_df.unpersist()

        return {
            "main": {"table_name": "gender", "row_count": main_row_count},
            "related": None,
            "poi": {"row_count": poi_result["row_count"]},
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
        handler = getattr(GoldHandlers, schema_handler, None)

        if handler is None:
            raise ValueError(
                f"Handler '{schema_handler}' not found. "
                f"Available handlers: {GoldHandlers.list_handlers()}"
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
            for name in dir(GoldHandlers)
            if not name.startswith("_")
            and name not in ["get_handler", "list_handlers"]
            and callable(getattr(GoldHandlers, name))
        ]
        return handlers
