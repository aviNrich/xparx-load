from datetime import datetime
from typing import Optional
from bson import ObjectId
from pymongo.database import Database
from app.schemas.system_settings import SystemSettings, TargetDatabaseUpdate
from app.utils.encryption import encrypt_password, decrypt_password
import sqlalchemy
from sqlalchemy import create_engine, text


SETTINGS_COLLECTION = "system_settings"
SETTINGS_DOCUMENT_ID = "global_settings"


class SystemSettingsService:
    """Service for managing system settings"""

    def __init__(self, db: Database):
        self.db = db
        self.collection = db[SETTINGS_COLLECTION]

    def get_settings(self) -> Optional[dict]:
        """Get system settings"""
        settings = self.collection.find_one({"_id": SETTINGS_DOCUMENT_ID})

        # Mask password in response
        if settings and settings.get("target_db") and settings["target_db"].get("password"):
            settings["target_db"]["password"] = "********"

        return settings

    def update_target_db(self, config: TargetDatabaseUpdate) -> dict:
        """Update target database configuration"""
        now = datetime.utcnow()

        # Encrypt password
        encrypted_password = encrypt_password(config.password)

        # Check if settings document exists
        existing = self.collection.find_one({"_id": SETTINGS_DOCUMENT_ID})

        target_db_data = {
            "host": config.host,
            "port": config.port,
            "database": config.database,
            "username": config.username,
            "password": encrypted_password
        }

        if existing:
            # Update existing document
            self.collection.update_one(
                {"_id": SETTINGS_DOCUMENT_ID},
                {
                    "$set": {
                        "target_db": target_db_data,
                        "updated_at": now
                    }
                }
            )
        else:
            # Create new document
            self.collection.insert_one({
                "_id": SETTINGS_DOCUMENT_ID,
                "target_db": target_db_data,
                "created_at": now,
                "updated_at": now
            })

        # Return settings with masked password
        result = self.get_settings()
        return result

    def test_target_db_connection(self, config: TargetDatabaseUpdate) -> dict:
        """Test PostgreSQL connection"""
        try:
            # Build PostgreSQL connection string
            connection_string = (
                f"postgresql://{config.username}:{config.password}@"
                f"{config.host}:{config.port}/{config.database}"
            )

            # Create engine with timeout
            engine = create_engine(
                connection_string,
                connect_args={"connect_timeout": 5}
            )

            # Test connection
            with engine.connect() as connection:
                result = connection.execute(text("SELECT version()"))
                version = result.scalar()

                return {
                    "success": True,
                    "message": "Connection successful",
                    "details": {
                        "db_type": "PostgreSQL",
                        "version": version
                    }
                }

        except sqlalchemy.exc.OperationalError as e:
            error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
            return {
                "success": False,
                "message": f"Connection failed: {error_msg}",
                "details": {
                    "error_type": "OperationalError"
                }
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Unexpected error: {str(e)}",
                "details": {
                    "error_type": type(e).__name__
                }
            }
        finally:
            if 'engine' in locals():
                engine.dispose()

    def get_decrypted_target_db(self) -> Optional[dict]:
        """Get target database config with decrypted password (for internal use)"""
        settings = self.collection.find_one({"_id": SETTINGS_DOCUMENT_ID})

        if settings and settings.get("target_db"):
            target_db = settings["target_db"].copy()
            if target_db.get("password"):
                target_db["password"] = decrypt_password(target_db["password"])
            return target_db

        return None