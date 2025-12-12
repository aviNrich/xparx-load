# Backend Service - Claude Context

## Service Overview
This is the **ETL Engine Backend API** - a FastAPI microservice that manages ETL pipeline configurations including source database connections, mappings, schemas, and schedules.

**Port:** 8000
**Framework:** FastAPI (Python)
**Database:** MongoDB
**Purpose:** Configuration management layer for ETL pipelines

## Architecture

### Tech Stack
- **FastAPI** - Web framework
- **MongoDB** - Document database for storing configurations
- **PyMongo** - MongoDB driver
- **SQLAlchemy** - For testing database connections (MySQL/PostgreSQL)
- **Cryptography** - Fernet encryption for password storage
- **Pydantic** - Data validation and settings management

### Dependencies (requirements.txt)
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pymongo==4.6.1
pydantic==2.5.3
pydantic-settings==2.1.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
pymysql==1.1.0
cryptography==42.0.0
python-dotenv==1.0.0
python-multipart==0.0.6
httpx==0.25.2
```

## Project Structure

```
backend/
├── app/
│   ├── main.py                          # FastAPI app entry, lifespan, CORS
│   ├── config.py                        # Settings from environment
│   ├── database.py                      # MongoDB connection singleton
│   ├── routers/                         # API endpoints
│   │   ├── connections.py               # Connection CRUD + test
│   │   ├── mappings.py                  # Mapping CRUD + preview + column mappings
│   │   ├── schemas.py                   # Schema CRUD
│   │   └── schedules.py                 # Schedule CRUD
│   ├── services/                        # Business logic
│   │   ├── connection_service.py        # Connection CRUD operations
│   │   ├── test_connection_service.py   # Database connection testing
│   │   ├── mapping_service.py           # Mapping operations
│   │   ├── schema_service.py            # Schema operations
│   │   └── schedule_service.py          # Schedule operations
│   ├── schemas/                         # Pydantic models
│   │   ├── connection.py                # Connection models
│   │   ├── mapping.py                   # Mapping models
│   │   ├── schema.py                    # Schema models
│   │   └── schedule.py                  # Schedule models
│   └── utils/
│       ├── encryption.py                # Fernet password encryption/decryption
│       └── exceptions.py                # Custom exceptions
├── requirements.txt
├── Dockerfile
├── .env.example
└── .env                                 # gitignored, contains ENCRYPTION_KEY
```

## Key Features & Responsibilities

### 1. Connection Management
**Endpoints:** `/api/v1/connections/*`

- Create, read, update, delete database connections
- Support for MySQL and PostgreSQL
- Test connections before saving (5-second timeout)
- Password encryption using Fernet
- Store connection metadata (host, port, database, username, encrypted password)
- Connection status tracking (last_tested_at, last_test_status)

**MongoDB Collection:** `connections`

### 2. Mapping Management
**Endpoints:** `/api/v1/mappings/*`

- Define ETL mappings (source to target)
- Link to source connection
- Define source SQL query
- Preview query results before saving
- Configure column mappings (direct, split, join)
- Track mapping metadata

**MongoDB Collections:** `mappings`, `column_mappings`

**Column Mapping Types:**
- **Direct:** 1:1 field mapping
- **Split:** Split one source column into multiple target fields by delimiter
- **Join:** Join multiple source columns into one target field with separator

### 3. Schema Management
**Endpoints:** `/api/v1/schemas/*`

- Define target table schemas
- Specify column names and data types
- Schema used by execution service for validation
- Schema evolution support (add columns, prevent type changes)

**MongoDB Collection:** `schemas`

### 4. Schedule Management
**Endpoints:** `/api/v1/schedules/*`

- Create and manage ETL execution schedules
- Link schedules to mappings
- Define cron expressions for recurring executions
- Track schedule metadata

**MongoDB Collection:** `schedules`

## Environment Variables

Required variables in `.env`:

```bash
# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=etl_engine

# Security
ENCRYPTION_KEY=<fernet-key>  # Generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# API
API_V1_PREFIX=/api/v1
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

## Database Schema

### connections
```javascript
{
  _id: ObjectId,
  name: String,                          // Unique connection name
  db_type: "mysql" | "postgresql",       // Database type
  host: String,                          // Database host
  port: Number,                          // Database port (1-65535)
  database: String,                      // Database name
  username: String,                      // Username
  password: String,                      // Encrypted with Fernet
  created_at: ISODate,
  updated_at: ISODate,
  last_tested_at: ISODate | null,
  last_test_status: "success" | "failed" | null
}
```

### mappings
```javascript
{
  _id: ObjectId,
  name: String,                          // Unique mapping name
  description: String | null,
  source_connection_id: ObjectId,        // Reference to connections
  source_query: String,                  // SQL query
  target_schema_id: ObjectId,            // Reference to schemas
  created_at: ISODate,
  updated_at: ISODate
}
```

### column_mappings
```javascript
{
  _id: ObjectId,
  mapping_id: ObjectId,                  // Reference to mappings
  type: "direct" | "split" | "join",
  source_columns: [String],              // Array of source column names
  target_fields: [String],               // Array of target field names
  config: {
    delimiter: String | null,            // For split type
    separator: String | null             // For join type
  },
  created_at: ISODate,
  updated_at: ISODate
}
```

### schemas
```javascript
{
  _id: ObjectId,
  name: String,                          // Unique schema name
  description: String | null,
  columns: [{
    name: String,                        // Column name
    data_type: String                    // Data type (string, integer, float, boolean, date, timestamp)
  }],
  created_at: ISODate,
  updated_at: ISODate
}
```

### schedules
```javascript
{
  _id: ObjectId,
  name: String,                          // Unique schedule name
  mapping_id: ObjectId,                  // Reference to mappings
  cron_expression: String,               // Cron format
  enabled: Boolean,                      // Active status
  created_at: ISODate,
  updated_at: ISODate,
  last_run_at: ISODate | null,
  next_run_at: ISODate | null
}
```

## API Endpoints Summary

### Connections
- `POST /api/v1/connections/` - Create connection
- `GET /api/v1/connections/` - List all connections
- `GET /api/v1/connections/{id}` - Get connection by ID
- `PUT /api/v1/connections/{id}` - Update connection
- `DELETE /api/v1/connections/{id}` - Delete connection
- `POST /api/v1/connections/test` - Test new connection
- `POST /api/v1/connections/{id}/test` - Test existing connection

### Mappings
- `POST /api/v1/mappings/` - Create mapping
- `GET /api/v1/mappings/` - List all mappings
- `GET /api/v1/mappings/{id}` - Get mapping by ID
- `PUT /api/v1/mappings/{id}` - Update mapping
- `DELETE /api/v1/mappings/{id}` - Delete mapping
- `POST /api/v1/mappings/preview` - Preview SQL query results
- `POST /api/v1/mappings/{id}/column-mappings` - Create column mappings
- `GET /api/v1/mappings/{id}/column-mappings` - Get column mappings

### Schemas
- `POST /api/v1/schemas/` - Create schema
- `GET /api/v1/schemas/` - List all schemas
- `GET /api/v1/schemas/{id}` - Get schema by ID
- `PUT /api/v1/schemas/{id}` - Update schema
- `DELETE /api/v1/schemas/{id}` - Delete schema

### Schedules
- `POST /api/v1/schedules/` - Create schedule
- `GET /api/v1/schedules/` - List all schedules
- `GET /api/v1/schedules/{id}` - Get schedule by ID
- `PUT /api/v1/schedules/{id}` - Update schedule
- `DELETE /api/v1/schedules/{id}` - Delete schedule

### Health
- `GET /` - API info
- `GET /health` - Health check

## Security Considerations

### Password Encryption
- All database passwords encrypted using **Fernet** (symmetric encryption)
- Encryption key stored in `ENCRYPTION_KEY` environment variable
- Passwords encrypted before MongoDB storage
- Decryption only happens during connection testing
- Never return decrypted passwords in API responses

### Validation
- All inputs validated using Pydantic schemas
- Port range validation (1-65535)
- Required fields enforced
- SQL injection prevention through SQLAlchemy parameterized queries

### CORS
- Configured for frontend origins only
- Credentials support enabled
- All methods and headers allowed for trusted origins

## Running the Service

### Local Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Docker
```bash
docker build -t etl-backend .
docker run -p 8000:8000 --env-file .env etl-backend
```

### Docker Compose (from project root)
```bash
docker-compose up backend
```

## Testing

### Manual Testing
- Access API docs at http://localhost:8000/docs
- Test endpoints using Swagger UI
- Create test connections to sample databases

### Connection Testing
- MySQL: Requires accessible MySQL instance
- PostgreSQL: Requires accessible PostgreSQL instance
- 5-second timeout for connection attempts
- Returns database version info on success

## Common Development Tasks

### Adding a New Endpoint
1. Define Pydantic schema in `app/schemas/`
2. Create service function in `app/services/`
3. Add router endpoint in `app/routers/`
4. Include router in `app/main.py`

### Adding a New Database Type
1. Update `connection.py` schema enum
2. Add driver to `requirements.txt`
3. Update `test_connection_service.py` with new connection logic
4. Update frontend dropdown

### Debugging
- Check logs: `docker-compose logs backend`
- MongoDB inspection: Use MongoDB Compass or CLI
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Integration with Other Services

### Execution Service
- **Reads from:** Same MongoDB instance
- **Collections used:** connections, mappings, column_mappings, schemas
- **Purpose:** Execute ETL jobs defined by backend configurations
- **Port:** 8001

### Frontend
- **Connects to:** Backend API at http://localhost:8000/api/v1
- **Purpose:** UI for managing connections, mappings, schemas, schedules
- **Port:** 5173

## Known Limitations

- No authentication/authorization (POC phase)
- Schedules defined but not executed (execution logic not implemented)
- Only MySQL and PostgreSQL supported
- No connection pooling
- No audit logging
- Synchronous operations only

## Future Enhancements

- Add authentication and RBAC
- Support more database types (Oracle, SQL Server, Redshift, Snowflake)
- Implement schedule execution with Celery/Airflow
- Add connection health monitoring
- Implement audit logging
- Add data lineage tracking
- Support SSH tunneling and SSL certificates
