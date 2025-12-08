from pymongo.database import Database
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from ..schemas.connection import ConnectionCreate, ConnectionUpdate, ConnectionResponse
from ..utils.encryption import encrypt_password, decrypt_password
from ..utils.exceptions import ConnectionNotFoundError, DuplicateConnectionError


class ConnectionService:
    def __init__(self, db: Database):
        self.db = db
        self.collection = db.connections

    def create_connection(self, connection: ConnectionCreate) -> ConnectionResponse:
        """Create a new connection"""
        # Encrypt password
        connection_dict = connection.model_dump()
        connection_dict["password"] = encrypt_password(connection_dict["password"])

        # Add timestamps
        now = datetime.utcnow()
        connection_dict["created_at"] = now
        connection_dict["updated_at"] = now
        connection_dict["last_tested_at"] = None
        connection_dict["last_test_status"] = None

        try:
            result = self.collection.insert_one(connection_dict)
            connection_dict["_id"] = str(result.inserted_id)
            return ConnectionResponse(**connection_dict)
        except Exception as e:
            if "duplicate key" in str(e).lower():
                raise DuplicateConnectionError(f"Connection with name '{connection.name}' already exists")
            raise

    def get_connection(self, connection_id: str) -> ConnectionResponse:
        """Get a single connection by ID"""
        if not ObjectId.is_valid(connection_id):
            raise ConnectionNotFoundError(f"Invalid connection ID: {connection_id}")

        connection = self.collection.find_one({"_id": ObjectId(connection_id)})
        if not connection:
            raise ConnectionNotFoundError(f"Connection not found: {connection_id}")

        connection["_id"] = str(connection["_id"])
        return ConnectionResponse(**connection)

    def list_connections(self) -> List[ConnectionResponse]:
        """List all connections"""
        connections = list(self.collection.find().sort("updated_at", -1))
        for conn in connections:
            conn["_id"] = str(conn["_id"])
        return [ConnectionResponse(**conn) for conn in connections]

    def update_connection(self, connection_id: str, update: ConnectionUpdate) -> ConnectionResponse:
        """Update an existing connection"""
        if not ObjectId.is_valid(connection_id):
            raise ConnectionNotFoundError(f"Invalid connection ID: {connection_id}")

        update_dict = update.model_dump(exclude_unset=True)
        if not update_dict:
            return self.get_connection(connection_id)

        # Encrypt password if provided
        if "password" in update_dict:
            update_dict["password"] = encrypt_password(update_dict["password"])

        update_dict["updated_at"] = datetime.utcnow()

        result = self.collection.find_one_and_update(
            {"_id": ObjectId(connection_id)},
            {"$set": update_dict},
            return_document=True
        )

        if not result:
            raise ConnectionNotFoundError(f"Connection not found: {connection_id}")

        result["_id"] = str(result["_id"])
        return ConnectionResponse(**result)

    def delete_connection(self, connection_id: str) -> bool:
        """Delete a connection"""
        if not ObjectId.is_valid(connection_id):
            raise ConnectionNotFoundError(f"Invalid connection ID: {connection_id}")

        result = self.collection.delete_one({"_id": ObjectId(connection_id)})
        if result.deleted_count == 0:
            raise ConnectionNotFoundError(f"Connection not found: {connection_id}")

        return True

    def update_test_status(self, connection_id: str, status: str):
        """Update last test status and timestamp"""
        self.collection.update_one(
            {"_id": ObjectId(connection_id)},
            {
                "$set": {
                    "last_tested_at": datetime.utcnow(),
                    "last_test_status": status
                }
            }
        )
