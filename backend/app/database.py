from pymongo import MongoClient, ASCENDING
from .config import get_settings

settings = get_settings()
client = None
db = None


def connect_to_mongo():
    """Connect to MongoDB and create indexes"""
    global client, db
    client = MongoClient(settings.mongodb_url)
    db = client[settings.mongodb_db_name]

    # Create indexes
    db.connections.create_index([("name", ASCENDING)], unique=True)
    db.connections.create_index([("db_type", ASCENDING)])
    db.connections.create_index([("updated_at", ASCENDING)])


def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()


def get_database():
    """Get database instance"""
    return db
