# ETL Execution Service

A FastAPI microservice for executing ETL mappings and writing data to Delta Lake with schema evolution support.

## Features

- Execute ETL mappings by mapping ID
- Support for direct, split, and join column transformations
- Write to Delta Lake with automatic schema evolution
- Schema validation (prevents type changes, allows new columns)
- Automatic rollback on failure (ACID transactions)
- Metadata tracking (mapping_id, execution_time)
- Support for MySQL and PostgreSQL sources

## Architecture

- **Framework**: FastAPI
- **Database**: MongoDB (reads from existing etl_engine database)
- **Data Processing**: PySpark + Delta Lake
- **Port**: 8001

## Setup

### 1. Install Dependencies

```bash
cd execution-service
pip install -r requirements.txt
```

### 2. Configure Environment

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `ENCRYPTION_KEY`: Generate using `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
- Other settings as needed (MongoDB URL, Delta Lake path, etc.)

### 3. Run with Docker Compose (Recommended)

From the project root directory:

```bash
# Make sure ENCRYPTION_KEY is set in root .env file
docker-compose up execution-service

# Or run all services
docker-compose up
```

### 4. Run Locally (Development)

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
# or
./start.sh
```

### 5. Run with Docker (Standalone)

```bash
docker build -t etl-execution-service .
docker run -p 8001:8001 --env-file .env etl-execution-service
```

## API Endpoints

### Execute Mapping

**POST** `/api/v1/executions/run`

Execute an ETL mapping by ID.

**Request Body:**
```json
{
    "mapping_id": "507f1f77bcf86cd799439011"
}
```

**Response (Success):**
```json
{
    "execution_id": "uuid-here",
    "mapping_id": "507f1f77bcf86cd799439011",
    "status": "success",
    "rows_written": 1500,
    "execution_time": "2025-12-10T10:30:00Z",
    "delta_table_path": "/tmp/delta-lake/customer_schema",
    "error_message": null
}
```

**Response (Failure):**
```json
{
    "execution_id": "uuid-here",
    "mapping_id": "507f1f77bcf86cd799439011",
    "status": "failed",
    "rows_written": 0,
    "execution_time": "2025-12-10T10:30:00Z",
    "delta_table_path": null,
    "error_message": "Schema type mismatch: column 'age' expected integer but got string"
}
```

### Health Check

**GET** `/health`

Check service health status.

**Response:**
```json
{
    "status": "healthy",
    "service": "ETL Execution Service",
    "version": "1.0.0"
}
```

## How It Works

1. **Configuration Retrieval**: Fetches mapping, connection, column mappings, and target schema from MongoDB
2. **Source Extraction**: Executes SQL query on source database (MySQL/PostgreSQL)
3. **Transformation**: Applies column mappings:
   - **Direct**: 1:1 column mapping
   - **Split**: Split one column into multiple fields by delimiter
   - **Join**: Join multiple columns into one field with separator
4. **Metadata Addition**: Adds `mapping_id` and `execution_time` columns
5. **Schema Validation**: Checks for type compatibility with existing Delta Lake schema
6. **Delta Lake Write**: Writes data with ACID guarantees and schema evolution

## Schema Evolution Rules

- ✅ **Allowed**: Adding new columns
- ❌ **Not Allowed**: Changing column types
- ❌ **Not Allowed**: Removing columns
- 🔄 **Automatic Rollback**: Failed writes don't leave partial data

## Testing

### Example Test Flow

1. Create a mapping in the main backend UI
2. Configure column mappings and target schema
3. Call the execution endpoint:

```bash
curl -X POST http://localhost:8001/api/v1/executions/run \
  -H "Content-Type: application/json" \
  -d '{"mapping_id": "your-mapping-id"}'
```

4. Check Delta Lake table:

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()

df = spark.read.format("delta").load("/tmp/delta-lake/your_schema_name")
df.show()
```

## Error Handling

All exceptions are caught and returned in the response:

- `MappingNotFoundError`: Invalid mapping_id
- `ConnectionNotFoundError`: Source connection not found
- `ColumnMappingNotFoundError`: Column mapping config missing
- `SchemaNotFoundError`: Target schema not found
- `SourceConnectionError`: Can't connect to source database
- `SourceQueryError`: SQL query execution failed
- `TransformationError`: Data transformation failed
- `SchemaValidationError`: Schema type mismatch
- `DeltaWriteError`: Delta Lake write failed

## Project Structure

```
execution-service/
├── app/
│   ├── main.py                     # FastAPI app entry point
│   ├── config.py                   # Configuration settings
│   ├── database.py                 # MongoDB connection
│   ├── routers/
│   │   └── executions.py           # API endpoints
│   ├── services/
│   │   ├── execution_service.py    # Main ETL logic
│   │   └── delta_writer.py         # Delta Lake operations
│   ├── schemas/
│   │   └── execution.py            # Pydantic models
│   └── utils/
│       ├── exceptions.py           # Custom exceptions
│       └── encryption.py           # Password encryption
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Docker configuration
├── .env.example                    # Environment template
└── README.md                       # This file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection URL | `mongodb://localhost:27017` |
| `MONGODB_DB_NAME` | MongoDB database name | `etl_engine` |
| `DELTA_LAKE_BASE_PATH` | Base path for Delta Lake tables | `/tmp/delta-lake` |
| `SPARK_APP_NAME` | Spark application name | `ETL-Executor` |
| `SPARK_MASTER` | Spark master URL | `local[*]` |
| `API_V1_PREFIX` | API version prefix | `/api/v1` |
| `CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:5173","http://localhost:3000"]` |
| `ENCRYPTION_KEY` | Fernet encryption key (required) | - |

## Notes

- The service reads from the same MongoDB instance as the main backend
- Delta Lake tables are stored locally by default (configure path in .env)
- Spark session is created as a singleton for performance
- All executions are synchronous (scheduling is out of scope)
- Failed executions don't leave partial data due to Delta Lake's ACID properties
