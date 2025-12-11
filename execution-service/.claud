# Execution Service - Claude Context

## Service Overview
This is the **ETL Execution Service** - a FastAPI microservice that executes ETL mappings by extracting data from source databases, applying transformations, and writing to Delta Lake with schema evolution support.

**Port:** 8001
**Framework:** FastAPI (Python) + PySpark
**Storage:** Delta Lake
**Purpose:** ETL execution engine with ACID guarantees

## Architecture

### Tech Stack
- **FastAPI** - Web framework for REST API
- **PySpark** - Distributed data processing engine
- **Delta Lake** - ACID-compliant data lake storage layer
- **Pandas** - Data transformation library
- **MongoDB** - Configuration database (reads from backend's database)
- **SQLAlchemy** - Database connectivity for MySQL/PostgreSQL
- **Cryptography** - Password decryption (Fernet)

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
pyspark==3.5.0
delta-spark==3.0.0
pandas==2.1.4
```

## Project Structure

```
execution-service/
├── app/
│   ├── main.py                          # FastAPI app entry, lifespan, CORS
│   ├── config.py                        # Settings from environment
│   ├── database.py                      # MongoDB connection (read-only)
│   ├── routers/
│   │   └── executions.py                # Execution API endpoints
│   ├── services/
│   │   ├── execution_service.py         # Main ETL orchestration logic
│   │   └── delta_writer.py              # Delta Lake write operations
│   ├── schemas/
│   │   └── execution.py                 # Pydantic models for requests/responses
│   └── utils/
│       ├── encryption.py                # Password decryption (Fernet)
│       └── exceptions.py                # Custom exceptions
├── delta-lake/                          # Local Delta Lake storage (gitignored)
├── requirements.txt
├── Dockerfile
├── start.sh                             # Local development startup script
├── .env.example
├── .env                                 # gitignored
└── README.md
```

## Key Features & Responsibilities

### 1. ETL Execution
Execute complete ETL pipelines from configuration stored in MongoDB:

**Execution Flow:**
1. **Configuration Retrieval** - Fetch mapping, connection, column mappings, target schema from MongoDB
2. **Source Extraction** - Connect to source database (MySQL/PostgreSQL) and execute SQL query
3. **Data Transformation** - Apply column mappings (direct, split, join)
4. **Metadata Addition** - Add `mapping_id` and `execution_time` columns
5. **Schema Validation** - Validate against existing Delta Lake schema (prevent type changes)
6. **Delta Lake Write** - Write data with ACID guarantees and schema evolution

### 2. Column Transformation Types

**Direct Mapping (1:1)**
- Map one source column directly to one target field
- Example: `customer_name` → `name`

**Split Mapping (1:N)**
- Split one source column into multiple target fields by delimiter
- Example: `"John,Doe"` → `first_name: "John"`, `last_name: "Doe"`
- Configuration: `{"delimiter": ","}`

**Join Mapping (N:1)**
- Join multiple source columns into one target field with separator
- Example: `first_name: "John"`, `last_name: "Doe"` → `"John Doe"`
- Configuration: `{"separator": " "}`

### 3. Delta Lake Operations
- **ACID Transactions** - All-or-nothing writes with automatic rollback on failure
- **Schema Evolution** - Automatically add new columns to existing tables
- **Type Safety** - Prevent changing column types (e.g., string → integer)
- **Metadata Tracking** - Automatic `mapping_id` and `execution_time` columns
- **Time Travel** - Delta Lake versioning for historical queries

### 4. Schema Validation Rules
- ✅ **Allowed:** Adding new columns
- ❌ **Not Allowed:** Changing column data types
- ❌ **Not Allowed:** Removing columns
- 🔄 **Rollback:** Failed validations trigger automatic rollback (no partial data)

## Environment Variables

Required variables in `.env`:

```bash
# MongoDB (shared with backend service)
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=etl_engine

# Security
ENCRYPTION_KEY=<fernet-key>  # Same as backend

# Delta Lake Configuration
DELTA_LAKE_BASE_PATH=/tmp/delta-lake  # Local storage path
SPARK_APP_NAME=ETL-Executor
SPARK_MASTER=local[*]  # Use all available cores

# API
API_V1_PREFIX=/api/v1
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

## MongoDB Collections (Read-Only)

This service **reads** from the backend's MongoDB database. It does NOT write to MongoDB.

### Collections Used:
- **mappings** - ETL mapping configurations
- **connections** - Source database connection details (with encrypted passwords)
- **column_mappings** - Column transformation rules
- **table_schemas** - Target schema definitions

Refer to [backend/CLAUDE_CONTEXT.md](../backend/CLAUDE_CONTEXT.md) for detailed schema definitions.

## API Endpoints

### Execute ETL Mapping
**POST** `/api/v1/executions/run`

Execute an ETL mapping by its MongoDB ID.

**Request:**
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

**Response:**
```json
{
  "status": "healthy",
  "service": "ETL Execution Service",
  "version": "1.0.0"
}
```

## Execution Service Architecture

### ExecutionService Class
**File:** `app/services/execution_service.py`

Main orchestrator for ETL execution:
- `execute_mapping(mapping_id)` - Main entry point
- `_get_mapping_config(mapping_id)` - Fetch all configurations from MongoDB
- `_extract_source_data(config)` - Connect to source DB and run SQL query
- `_transform_data(data, config)` - Apply column mappings
- Delegates Delta Lake writing to `DeltaWriter`

### DeltaWriter Module
**File:** `app/services/delta_writer.py`

Handles all Delta Lake operations:
- `get_spark_session()` - Singleton Spark session with Delta Lake config
- `write_to_delta_lake(df, schema_name, target_schema)` - Main write function
- `map_field_type_to_spark(field_type)` - Convert schema types to Spark types
- Schema validation and enforcement
- Merge mode for upsert operations

### Spark Session
- **Singleton pattern** - One Spark session per service instance
- **Delta Lake packages** - Pre-configured with `io.delta:delta-spark_2.12:3.0.0`
- **Local mode** - Runs on local machine using all available cores
- **Log level** - Set to WARN to reduce noise

## Data Flow Example

### Example Scenario: Customer ETL

1. **Configuration in MongoDB:**
   - Mapping: Extract customers from MySQL
   - Source Query: `SELECT id, full_name, email FROM customers`
   - Column Mappings:
     - Direct: `id` → `customer_id`
     - Split: `full_name` → `first_name`, `last_name` (delimiter: " ")
     - Direct: `email` → `email`
   - Target Schema: `customer_schema` with columns `[customer_id, first_name, last_name, email]`

2. **Execution Request:**
   ```bash
   POST /api/v1/executions/run
   {"mapping_id": "507f1f77bcf86cd799439011"}
   ```

3. **Service Actions:**
   - Fetch mapping config from MongoDB
   - Decrypt MySQL password
   - Connect to MySQL and execute query
   - Load results into Pandas DataFrame
   - Apply split transformation: `"John Doe"` → `first_name: "John"`, `last_name: "Doe"`
   - Add metadata: `mapping_id`, `execution_time`
   - Convert to PySpark DataFrame
   - Validate schema (check for type mismatches)
   - Write to Delta Lake: `/tmp/delta-lake/customer_schema/`

4. **Result:**
   - Delta table updated with new data
   - ACID guarantees ensure atomicity
   - Schema evolution adds new columns if needed
   - Response returned with row count and status

## Error Handling

### Custom Exceptions
All errors are caught and returned in execution response:

- `MappingNotFoundError` - Invalid mapping_id
- `ConnectionNotFoundError` - Source connection not found in MongoDB
- `ColumnMappingNotFoundError` - Column mapping configuration missing
- `SchemaNotFoundError` - Target schema not found
- `SourceConnectionError` - Cannot connect to source database
- `SourceQueryError` - SQL query execution failed
- `TransformationError` - Data transformation failed (split/join errors)
- `SchemaValidationError` - Schema type mismatch detected
- `DeltaWriteError` - Delta Lake write operation failed

### Error Response Pattern
All errors return `status: "failed"` with descriptive `error_message`:
```json
{
  "execution_id": "...",
  "mapping_id": "...",
  "status": "failed",
  "rows_written": 0,
  "execution_time": "...",
  "delta_table_path": null,
  "error_message": "Detailed error message here"
}
```

## Delta Lake Storage

### Directory Structure
```
/tmp/delta-lake/
├── customer_schema/           # Table directory
│   ├── _delta_log/            # Transaction log (ACID)
│   │   ├── 00000000000000000000.json
│   │   ├── 00000000000000000001.json
│   │   └── ...
│   ├── part-00000-xxx.parquet # Data files
│   ├── part-00001-xxx.parquet
│   └── ...
└── order_schema/
    └── ...
```

### Delta Lake Features Used
- **Transaction Log** - ACID guarantees through `_delta_log/`
- **Parquet Format** - Efficient columnar storage
- **Schema Enforcement** - Type checking before writes
- **Time Travel** - Query historical versions
- **Merge Operations** - Upsert support (configurable)

### Querying Delta Tables
```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .config("spark.jars.packages", "io.delta:delta-spark_2.12:3.0.0") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()

# Read current version
df = spark.read.format("delta").load("/tmp/delta-lake/customer_schema")
df.show()

# Time travel query
df_v1 = spark.read.format("delta").option("versionAsOf", 1).load("/tmp/delta-lake/customer_schema")
```

## Running the Service

### Local Development
```bash
cd execution-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Or use start script
./start.sh
```

### Docker
```bash
docker build -t etl-execution-service .
docker run -p 8001:8001 --env-file .env etl-execution-service
```

### Docker Compose (from project root)
```bash
docker-compose up execution-service
```

## Testing

### Manual Testing
```bash
# Create mapping in backend UI first, then execute:
curl -X POST http://localhost:8001/api/v1/executions/run \
  -H "Content-Type: application/json" \
  -d '{"mapping_id": "your-mapping-id"}'
```

### Verify Delta Lake Results
```bash
cd execution-service
python

from pyspark.sql import SparkSession
from delta.tables import DeltaTable

spark = SparkSession.builder \
    .config("spark.jars.packages", "io.delta:delta-spark_2.12:3.0.0") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()

df = spark.read.format("delta").load("/tmp/delta-lake/your_schema_name")
df.show()
df.printSchema()
```

## Performance Considerations

### Spark Configuration
- **Local mode:** `local[*]` uses all CPU cores
- **Memory:** Adjust with `spark.driver.memory` for large datasets
- **Partitions:** PySpark auto-partitions data based on size

### Delta Lake Optimization
- **File compaction:** Run `OPTIMIZE` periodically for better read performance
- **Z-ordering:** Use `ZORDER BY` for frequently filtered columns
- **Vacuum:** Clean up old file versions with `VACUUM`

### Scalability
- Current setup: Single-node PySpark (good for POC and moderate datasets)
- Production: Deploy on Spark cluster (Databricks, EMR, etc.)
- Concurrency: Multiple API requests create separate Spark jobs

## Common Development Tasks

### Adding New Database Type
1. Add driver to `requirements.txt` (e.g., `cx_Oracle` for Oracle)
2. Update connection string logic in `execution_service.py`
3. Test connectivity with new driver
4. Update backend connection types

### Adding New Transformation Type
1. Define new type in backend `column_mappings` schema
2. Add transformation logic in `execution_service._transform_data()`
3. Update frontend UI for new transformation
4. Write tests for transformation

### Debugging Failed Executions
1. Check execution response `error_message`
2. Inspect Spark logs: Look for Java stack traces
3. Verify MongoDB configuration: Check mapping, connection, schema docs
4. Test source database manually: Run SQL query outside service
5. Validate Delta Lake: Check `_delta_log/` for transaction issues

### Monitoring
- Health check: `curl http://localhost:8001/health`
- Logs: `docker-compose logs execution-service`
- Spark UI: http://localhost:4040 (when Spark job running)

## Integration with Other Services

### Backend Service
- **Dependency:** Reads MongoDB configurations created by backend
- **Shared Database:** Same MongoDB instance (`etl_engine` database)
- **Shared Encryption:** Same `ENCRYPTION_KEY` for password decryption
- **Port:** Backend on 8000, Execution on 8001

### Frontend
- **Interaction:** Frontend calls backend, backend configurations used by execution service
- **Execution Trigger:** Frontend may call execution service directly or via backend proxy
- **Results Display:** Frontend shows execution status and row counts

## Known Limitations

- **Synchronous Execution** - Each execution blocks until complete (no async jobs)
- **No Scheduling** - Executions are on-demand only (no cron-based triggers yet)
- **Single Node** - PySpark runs locally (not distributed)
- **Local Storage** - Delta Lake stored on local filesystem (not cloud storage)
- **No Execution History** - Results not persisted to database
- **No Retry Logic** - Failed executions require manual retry
- **No Incremental Loads** - Full data extraction each time

## Future Enhancements

- Add execution history tracking in MongoDB
- Implement async execution with Celery/Airflow
- Support incremental loads (CDC, watermarks)
- Add data quality validation rules
- Integrate with cloud storage (S3, ADLS, GCS)
- Add metrics and monitoring (Prometheus, Grafana)
- Implement retry logic with exponential backoff
- Support more source types (APIs, files, NoSQL)
- Add data profiling and statistics
- Implement partition strategies for large tables

## Troubleshooting

### Common Issues

**Spark Session Fails to Start:**
- Check Java is installed: `java -version`
- Verify Delta Lake packages downloaded
- Check `PYSPARK_PYTHON` and `PYSPARK_DRIVER_PYTHON` env vars

**Delta Lake Write Fails:**
- Verify `DELTA_LAKE_BASE_PATH` directory exists and is writable
- Check for schema validation errors in logs
- Ensure sufficient disk space

**Source Connection Fails:**
- Verify source database is accessible from execution service container
- Check MongoDB connection details are correct
- Ensure password decryption works (correct `ENCRYPTION_KEY`)

**Schema Evolution Blocked:**
- Delta Lake prevents type changes by design
- Check if existing schema conflicts with new data types
- Consider creating new table version or manual schema migration

**Performance Issues:**
- Increase Spark memory: `spark.driver.memory=4g`
- Optimize Delta tables: Run `OPTIMIZE` command
- Check for data skew in partitions
