from pymongo import MongoClient
from pymongo.database import Database
from .config import get_settings

settings = get_settings()
print(settings, "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1")
# Global MongoDB client
client: MongoClient = None
db: Database = None


def connect_to_mongo():
    """Initialize MongoDB connection"""
    global client, db
    client = MongoClient(settings.mongodb_url)
    db = client[settings.mongodb_db_name]
    print(f"Connected to MongoDB: {settings.mongodb_db_name}")


def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_database() -> Database:
    """Get MongoDB database instance"""
    return db
