# ETL Engine - Complete ETL System

A modern ETL (Extract, Transform, Load) system with mapping configuration and execution capabilities.

## Features

- **Source Connection Management**: Create, read, update, and delete database connections (MySQL, PostgreSQL)
- **Mapping Configuration**: Define ETL mappings with source queries and column transformations
- **Column Transformations**: Support for direct, split, and join mappings
- **Schema Management**: Define target table schemas
- **ETL Execution**: Execute mappings and write to Delta Lake with schema evolution
- **Modern UI**: Purple & grey color scheme with smooth animations
- **Secure Storage**: Encrypted password storage using Fernet encryption
- **REST API**: Full CRUD API with FastAPI
- **Delta Lake**: ACID transactions with automatic schema evolution

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **MongoDB**: Document database for configuration storage
- **PyMongo**: MongoDB driver
- **SQLAlchemy**: Database connection testing
- **Cryptography**: Password encryption

### Execution Service
- **FastAPI**: REST API for execution
- **PySpark**: Distributed data processing
- **Delta Lake**: ACID-compliant data lake storage
- **Pandas**: Data transformations

### Frontend
- **React** with TypeScript
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Beautiful UI components
- **React Hook Form + Zod**: Form management and validation

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker (for MongoDB)

### 1. Start MongoDB
```bash
docker run -d -p 27017:27017 --name etl-mongodb mongo:7.0
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with encryption key
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())" > .env
echo "MONGODB_URL=mongodb://localhost:27017" >> .env
echo "MONGODB_DB_NAME=etl_engine" >> .env
echo 'CORS_ORIGINS=["http://localhost:5173"]' >> .env

# Run backend
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env.local

# Run frontend
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Alternative: Docker Compose (Recommended)

```bash
# Generate encryption key
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())" > .env

# Start all services (MongoDB, Backend, Frontend, Execution Service)
docker-compose up --build
```

**Services:**
- MongoDB: `localhost:27017`
- Backend API: `localhost:8000`
- Execution Service: `localhost:8001`
- Frontend: `localhost:5173`

## Project Structure

```
etl-engine-3/
├── backend/                 # FastAPI backend (port 8000)
│   ├── app/
│   │   ├── main.py         # Application entry
│   │   ├── config.py       # Configuration
│   │   ├── database.py     # MongoDB connection
│   │   ├── schemas/        # Pydantic models
│   │   ├── services/       # Business logic
│   │   ├── routers/        # API endpoints (connections, mappings, schemas)
│   │   └── utils/          # Utilities (encryption, etc.)
│   └── requirements.txt
├── execution-service/       # ETL execution service (port 8001)
│   ├── app/
│   │   ├── main.py         # Application entry
│   │   ├── config.py       # Configuration
│   │   ├── database.py     # MongoDB connection
│   │   ├── routers/        # API endpoints (executions)
│   │   ├── services/       # Execution & Delta Lake logic
│   │   ├── schemas/        # Pydantic models
│   │   └── utils/          # Utilities (encryption, exceptions)
│   ├── requirements.txt
│   └── README.md           # Execution service docs
├── frontend/               # React frontend (port 5173)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API client
│   │   ├── hooks/          # Custom hooks
│   │   └── types/          # TypeScript types
│   └── package.json
├── docker-compose.yml      # All services orchestration
└── README.md               # This file
```

## API Endpoints

### Backend (port 8000)
**Connections:**
- `POST /api/v1/connections/` - Create connection
- `GET /api/v1/connections/` - List all connections
- `GET /api/v1/connections/{id}` - Get single connection
- `PUT /api/v1/connections/{id}` - Update connection
- `DELETE /api/v1/connections/{id}` - Delete connection
- `POST /api/v1/connections/test` - Test new connection

**Mappings:**
- `POST /api/v1/mappings/` - Create mapping
- `GET /api/v1/mappings/` - List all mappings
- `GET /api/v1/mappings/{id}` - Get mapping
- `PUT /api/v1/mappings/{id}` - Update mapping
- `DELETE /api/v1/mappings/{id}` - Delete mapping
- `POST /api/v1/mappings/preview` - Preview SQL query
- `POST /api/v1/mappings/{id}/column-mappings` - Create column mappings
- `GET /api/v1/mappings/{id}/column-mappings` - Get column mappings

**Schemas:**
- `POST /api/v1/schemas/` - Create table schema
- `GET /api/v1/schemas/` - List all schemas
- `GET /api/v1/schemas/{id}` - Get schema

### Execution Service (port 8001)
- `POST /api/v1/executions/run` - Execute ETL mapping
- `GET /health` - Health check

## UI Features

### Purple & Grey Theme
- Professional color scheme perfect for presentations
- Dark purple gradient sidebar
- Smooth hover animations and transitions
- Clear visual status indicators

### Connection Management
- Beautiful card grid layout
- Test-before-save workflow
- Real-time connection testing feedback
- Success/failure status with database version info

## Security

- **Password Encryption**: All passwords encrypted using Fernet symmetric encryption
- **Environment-based Keys**: Encryption key stored in environment variables
- **Input Validation**: Pydantic schemas validate all inputs
- **SQL Injection Prevention**: SQLAlchemy parameterized queries

## ETL Execution Flow

1. **Configure Connection**: Create database connection in UI
2. **Create Mapping**: Define source SQL query and target schema
3. **Column Mappings**: Configure transformations (direct, split, join)
4. **Execute**: Call execution service API to run ETL
5. **Delta Lake**: Data written to Delta Lake with schema evolution

## Column Mapping Types

- **Direct**: 1:1 column mapping (e.g., `source_col` → `target_field`)
- **Split**: Split one column into multiple fields by delimiter (e.g., `"John,Doe"` → `first_name`, `last_name`)
- **Join**: Join multiple columns into one with separator (e.g., `first_name + last_name` → `"John Doe"`)

## Delta Lake Features

- **Schema Evolution**: Automatically adds new columns
- **Type Safety**: Prevents type changes (e.g., string → integer)
- **ACID Transactions**: Rollback on failure, no partial writes
- **Metadata Tracking**: Automatic `mapping_id` and `execution_time` columns

## Next Steps

- Add more database types (Oracle, SQL Server, Redshift, Snowflake)
- Implement ETL scheduling (currently on-demand only)
- Add execution history and monitoring
- User authentication and permissions
- Data quality validation rules
- Incremental load strategies

## License

MIT

## Version

1.0.0 - Phase 1 POC
