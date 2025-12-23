from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # MongoDB Configuration
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "etl_engine"

    # Delta Lake Configuration
    delta_lake_base_path: str = "./delta-lake"

    # Medallion Architecture Paths (derived from base path if not specified)
    bronze_lake_path: str = "./delta-lake/bronze"
    silver_lake_path: str = "./delta-lake/silver"
    gold_lake_path: str = "./delta-lake/gold"  # Future use

    # Spark Configuration
    spark_app_name: str = "ETL-Executor"
    spark_master: str = "local[*]"

    # API Configuration
    api_v1_prefix: str = "/api/v1"
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Backend API Configuration
    backend_api_url: str = "http://localhost:8000"

    # Security
    encryption_key: str  # Required environment variable

    class Config:
        env_file = ".env"


_settings = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
        print(f"Using encryption key!!!!: {_settings.delta_lake_base_path}")
    return _settings
