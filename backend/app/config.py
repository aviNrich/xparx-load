from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # MongoDB Configuration
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "etl_engine"

    # API Configuration
    api_v1_prefix: str = "/api/v1"
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Execution Service Configuration
    execution_service_url: str = "http://localhost:8001/api/v1"

    # Security
    encryption_key: str

    class Config:
        env_file = "../../.env"


@lru_cache()
def get_settings():
    sett = Settings()
    print(f"Using encryption key: {sett.encryption_key}")
    return sett
