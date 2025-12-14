from pymongo.database import Database
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from ..schemas.schema import TableSchemaCreate, TableSchemaUpdate, TableSchemaResponse
from ..utils.exceptions import ConnectionNotFoundError, DuplicateConnectionError


class SchemaService:
    def __init__(self, db: Database):
        self.collection = db["table_schemas"]

    def create_schema(self, schema: TableSchemaCreate) -> TableSchemaResponse:
        """Create a new table schema"""
        # Check if schema with same name already exists
        existing = self.collection.find_one({"name": schema.name})
        if existing:
            raise DuplicateConnectionError(
                f"Schema with name '{schema.name}' already exists"
            )

        # Prepare document
        now = datetime.utcnow()
        schema_dict = schema.model_dump()
        schema_dict["created_at"] = now
        schema_dict["updated_at"] = now

        # Insert into database
        result = self.collection.insert_one(schema_dict)

        # Return the created schema
        created_schema = self.collection.find_one({"_id": result.inserted_id})
        created_schema["_id"] = str(created_schema["_id"])
        return TableSchemaResponse(**created_schema)

    def list_schemas(self) -> List[TableSchemaResponse]:
        """List all table schemas"""
        schemas = list(self.collection.find().sort("created_at", -1))
        for schema in schemas:
            schema["_id"] = str(schema["_id"])
        return [TableSchemaResponse(**schema) for schema in schemas]

    def get_schema(self, schema_id: str) -> TableSchemaResponse:
        """Get a specific schema by ID"""
        if not ObjectId.is_valid(schema_id):
            raise ConnectionNotFoundError(f"Invalid schema ID: {schema_id}")

        schema = self.collection.find_one({"_id": ObjectId(schema_id)})
        if not schema:
            raise ConnectionNotFoundError(f"Schema with ID {schema_id} not found")

        schema["_id"] = str(schema["_id"])
        return TableSchemaResponse(**schema)

    def update_schema(
        self, schema_id: str, update: TableSchemaUpdate
    ) -> TableSchemaResponse:
        """Update an existing schema"""
        if not ObjectId.is_valid(schema_id):
            raise ConnectionNotFoundError(f"Invalid schema ID: {schema_id}")

        # Check if schema exists
        existing = self.collection.find_one({"_id": ObjectId(schema_id)})
        if not existing:
            raise ConnectionNotFoundError(f"Schema with ID {schema_id} not found")

        # Check for duplicate name if name is being updated
        if update.name and update.name != existing.get("name"):
            duplicate = self.collection.find_one(
                {"name": update.name, "_id": {"$ne": ObjectId(schema_id)}}
            )
            if duplicate:
                raise DuplicateConnectionError(
                    f"Schema with name '{update.name}' already exists"
                )

        # Prepare update data
        update_data = {
            k: v
            for k, v in update.model_dump(exclude_unset=True).items()
            if v is not None
        }
        if update_data:
            update_data["updated_at"] = datetime.utcnow()

            # Update in database
            self.collection.update_one(
                {"_id": ObjectId(schema_id)}, {"$set": update_data}
            )

        # Return updated schema
        updated_schema = self.collection.find_one({"_id": ObjectId(schema_id)})
        updated_schema["_id"] = str(updated_schema["_id"])
        return TableSchemaResponse(**updated_schema)

    def delete_schema(self, schema_id: str) -> None:
        """Delete a schema"""
        if not ObjectId.is_valid(schema_id):
            raise ConnectionNotFoundError(f"Invalid schema ID: {schema_id}")

        result = self.collection.delete_one({"_id": ObjectId(schema_id)})
        if result.deleted_count == 0:
            raise ConnectionNotFoundError(f"Schema with ID {schema_id} not found")
