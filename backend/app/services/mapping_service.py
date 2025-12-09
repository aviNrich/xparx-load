from pymongo.database import Database
from bson import ObjectId
from sqlalchemy import create_engine, text, inspect
from typing import List, Optional
from datetime import datetime
import re
from ..schemas.mapping import (
    TableInfoResponse,
    SqlPreviewRequest,
    SqlPreviewResponse,
    MappingCreate,
    MappingUpdate,
    MappingResponse,
    ColumnMappingCreate,
    ColumnMappingResponse
)
from ..utils.encryption import decrypt_password
from ..utils.exceptions import ConnectionNotFoundError


class MappingService:
    def __init__(self, db: Database):
        self.db = db
        self.collection = db.connections  # Use connections collection to get connection info
        self.mappings_collection = db.mappings  # For storing mappings
        self.column_mappings_collection = db.column_mappings  # For storing column mappings

    def _build_connection_string(self, connection_doc: dict) -> str:
        """Build SQLAlchemy connection string from connection document"""
        password = decrypt_password(connection_doc["password"])
        username = connection_doc["username"]
        host = connection_doc["host"]
        port = connection_doc["port"]
        database = connection_doc["database"]
        db_type = connection_doc["db_type"]

        if db_type == "mysql":
            return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
        elif db_type == "postgresql":
            return f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}"
        else:
            raise ValueError(f"Unsupported database type: {db_type}")

    def list_tables(self, connection_id: str) -> List[TableInfoResponse]:
        """List all tables from a connection with row count estimates"""
        # Get connection from database
        if not ObjectId.is_valid(connection_id):
            raise ConnectionNotFoundError(f"Invalid connection ID: {connection_id}")

        connection = self.collection.find_one({"_id": ObjectId(connection_id)})
        if not connection:
            raise ConnectionNotFoundError(f"Connection not found: {connection_id}")

        try:
            connection_string = self._build_connection_string(connection)
            engine = create_engine(
                connection_string,
                connect_args={"connect_timeout": 5},
                pool_pre_ping=True
            )

            tables = []
            db_type = connection["db_type"]

            with engine.connect() as conn:
                if db_type == "mysql":
                    # MySQL: Use information_schema.tables
                    query = text("""
                        SELECT
                            table_name,
                            table_schema,
                            table_type,
                            table_rows as row_count
                        FROM information_schema.tables
                        WHERE table_schema = DATABASE()
                        AND table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
                        ORDER BY table_name
                    """)
                    result = conn.execute(query)

                    for row in result:
                        tables.append(TableInfoResponse(
                            table_name=row[0],
                            table_schema=row[1],
                            table_type=row[2],
                            row_count=int(row[3]) if row[3] is not None else None
                        ))

                elif db_type == "postgresql":
                    # PostgreSQL: Use pg_catalog
                    query = text("""
                        SELECT
                            c.relname as table_name,
                            n.nspname as table_schema,
                            CASE c.relkind
                                WHEN 'r' THEN 'BASE TABLE'
                                WHEN 'v' THEN 'VIEW'
                                ELSE 'OTHER'
                            END as table_type,
                            c.reltuples::bigint as row_count
                        FROM pg_catalog.pg_class c
                        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                        WHERE c.relkind IN ('r', 'v')
                        AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
                        AND n.nspname !~ '^pg_temp'
                        ORDER BY table_name
                    """)
                    result = conn.execute(query)

                    for row in result:
                        tables.append(TableInfoResponse(
                            table_name=row[0],
                            table_schema=row[1],
                            table_type=row[2],
                            row_count=int(row[3]) if row[3] is not None and row[3] >= 0 else None
                        ))

            engine.dispose()
            return tables

        except Exception as e:
            raise Exception(f"Failed to list tables: {str(e)}")

    def preview_sql_query(self, request: SqlPreviewRequest, limit: int = 100) -> SqlPreviewResponse:
        """Execute SQL query and return preview results"""
        # Get connection from database
        if not ObjectId.is_valid(request.connection_id):
            raise ConnectionNotFoundError(f"Invalid connection ID: {request.connection_id}")

        connection = self.collection.find_one({"_id": ObjectId(request.connection_id)})
        if not connection:
            raise ConnectionNotFoundError(f"Connection not found: {request.connection_id}")

        try:
            # Validate query is a SELECT statement
            query_upper = request.sql_query.strip().upper()
            if not query_upper.startswith("SELECT"):
                raise ValueError("Only SELECT queries are allowed")

            # Add LIMIT clause if not present
            modified_query = self._add_limit_to_query(request.sql_query, limit)

            connection_string = self._build_connection_string(connection)
            engine = create_engine(
                connection_string,
                connect_args={"connect_timeout": 5},
                pool_pre_ping=True,
                execution_options={"timeout": 5}  # 5 second query timeout
            )

            with engine.connect() as conn:
                result = conn.execute(text(modified_query))

                # Get column names
                columns = list(result.keys())

                # Fetch rows
                rows = []
                for row in result:
                    rows.append([self._format_cell_value(val) for val in row])

            engine.dispose()

            return SqlPreviewResponse(
                columns=columns,
                rows=rows,
                row_count=len(rows)
            )

        except Exception as e:
            raise Exception(f"Failed to execute query: {str(e)}")

    def _add_limit_to_query(self, query: str, limit: int) -> str:
        """Add LIMIT clause to query if not present"""
        query_upper = query.strip().upper()

        # Check if LIMIT already exists
        if re.search(r'\bLIMIT\s+\d+', query_upper):
            # Replace existing LIMIT with our limit if it's higher
            match = re.search(r'\bLIMIT\s+(\d+)', query_upper)
            if match:
                existing_limit = int(match.group(1))
                if existing_limit > limit:
                    # Replace with our lower limit
                    query = re.sub(r'\bLIMIT\s+\d+', f'LIMIT {limit}', query, flags=re.IGNORECASE)
            return query
        else:
            # Add LIMIT clause
            return f"{query.rstrip(';')} LIMIT {limit}"

    def _format_cell_value(self, value):
        """Format cell values for JSON serialization"""
        if value is None:
            return None
        elif isinstance(value, (bytes, bytearray)):
            return value.decode('utf-8', errors='replace')
        elif hasattr(value, 'isoformat'):  # datetime objects
            return value.isoformat()
        else:
            return value

    # CRUD operations for mappings
    def create_mapping(self, mapping: MappingCreate) -> MappingResponse:
        """Create a new mapping"""
        mapping_dict = mapping.model_dump()

        # Add timestamps
        now = datetime.utcnow()
        mapping_dict["created_at"] = now
        mapping_dict["updated_at"] = now

        try:
            result = self.mappings_collection.insert_one(mapping_dict)
            mapping_dict["_id"] = str(result.inserted_id)
            return MappingResponse(**mapping_dict)
        except Exception as e:
            raise Exception(f"Failed to create mapping: {str(e)}")

    def get_mapping(self, mapping_id: str) -> MappingResponse:
        """Get a single mapping by ID"""
        if not ObjectId.is_valid(mapping_id):
            raise ValueError(f"Invalid mapping ID: {mapping_id}")

        mapping = self.mappings_collection.find_one({"_id": ObjectId(mapping_id)})
        if not mapping:
            raise ValueError(f"Mapping not found: {mapping_id}")

        mapping["_id"] = str(mapping["_id"])
        return MappingResponse(**mapping)

    def list_mappings(self) -> List[MappingResponse]:
        """List all mappings"""
        mappings = list(self.mappings_collection.find().sort("updated_at", -1))
        for mapping in mappings:
            mapping["_id"] = str(mapping["_id"])
        return [MappingResponse(**mapping) for mapping in mappings]

    def update_mapping(self, mapping_id: str, update: MappingUpdate) -> MappingResponse:
        """Update an existing mapping"""
        if not ObjectId.is_valid(mapping_id):
            raise ValueError(f"Invalid mapping ID: {mapping_id}")

        update_dict = update.model_dump(exclude_unset=True)
        if not update_dict:
            return self.get_mapping(mapping_id)

        update_dict["updated_at"] = datetime.utcnow()

        result = self.mappings_collection.find_one_and_update(
            {"_id": ObjectId(mapping_id)},
            {"$set": update_dict},
            return_document=True
        )

        if not result:
            raise ValueError(f"Mapping not found: {mapping_id}")

        result["_id"] = str(result["_id"])
        return MappingResponse(**result)

    def delete_mapping(self, mapping_id: str) -> bool:
        """Delete a mapping"""
        if not ObjectId.is_valid(mapping_id):
            raise ValueError(f"Invalid mapping ID: {mapping_id}")

        result = self.mappings_collection.delete_one({"_id": ObjectId(mapping_id)})
        if result.deleted_count == 0:
            raise ValueError(f"Mapping not found: {mapping_id}")

        return True

    # Column Mapping CRUD operations
    def create_column_mapping(self, config: ColumnMappingCreate) -> ColumnMappingResponse:
        """Create a new column mapping configuration"""
        # Validate mapping exists
        if not ObjectId.is_valid(config.mapping_id):
            raise ValueError(f"Invalid mapping ID: {config.mapping_id}")

        mapping = self.mappings_collection.find_one({"_id": ObjectId(config.mapping_id)})
        if not mapping:
            raise ValueError(f"Mapping not found: {config.mapping_id}")

        # Validate target schema exists
        if not ObjectId.is_valid(config.target_schema_id):
            raise ValueError(f"Invalid schema ID: {config.target_schema_id}")

        schema = self.db.table_schemas.find_one({"_id": ObjectId(config.target_schema_id)})
        if not schema:
            raise ValueError(f"Schema not found: {config.target_schema_id}")

        config_dict = config.model_dump()

        # Add timestamps
        now = datetime.utcnow()
        config_dict["created_at"] = now
        config_dict["updated_at"] = now

        try:
            result = self.column_mappings_collection.insert_one(config_dict)
            config_dict["_id"] = str(result.inserted_id)
            return ColumnMappingResponse(**config_dict)
        except Exception as e:
            raise Exception(f"Failed to create column mapping: {str(e)}")

    def get_column_mapping(self, mapping_id: str) -> Optional[ColumnMappingResponse]:
        """Get column mapping configuration by mapping_id"""
        if not ObjectId.is_valid(mapping_id):
            raise ValueError(f"Invalid mapping ID: {mapping_id}")

        config = self.column_mappings_collection.find_one({"mapping_id": mapping_id})
        if not config:
            return None

        config["_id"] = str(config["_id"])
        return ColumnMappingResponse(**config)

    def update_column_mapping(self, mapping_id: str, update: ColumnMappingCreate) -> ColumnMappingResponse:
        """Update existing column mapping configuration"""
        if not ObjectId.is_valid(mapping_id):
            raise ValueError(f"Invalid mapping ID: {mapping_id}")

        # Validate target schema if provided
        if update.target_schema_id:
            if not ObjectId.is_valid(update.target_schema_id):
                raise ValueError(f"Invalid schema ID: {update.target_schema_id}")

            schema = self.db.table_schemas.find_one({"_id": ObjectId(update.target_schema_id)})
            if not schema:
                raise ValueError(f"Schema not found: {update.target_schema_id}")

        update_dict = update.model_dump()
        update_dict["updated_at"] = datetime.utcnow()

        result = self.column_mappings_collection.find_one_and_update(
            {"mapping_id": mapping_id},
            {"$set": update_dict},
            return_document=True,
            upsert=True  # Create if doesn't exist
        )

        if not result:
            raise ValueError(f"Failed to update column mapping for mapping: {mapping_id}")

        result["_id"] = str(result["_id"])
        return ColumnMappingResponse(**result)

    def delete_column_mapping(self, mapping_id: str) -> bool:
        """Delete a column mapping configuration"""
        if not ObjectId.is_valid(mapping_id):
            raise ValueError(f"Invalid mapping ID: {mapping_id}")

        result = self.column_mappings_collection.delete_one({"mapping_id": mapping_id})
        return result.deleted_count > 0
