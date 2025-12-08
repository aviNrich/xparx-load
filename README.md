# ETL Engine - Source Connection Manager

Phase 1 of a modern ETL (Extract, Transform, Load) system with an impressive UI for management pitch.

## Features

- **Source Connection Management**: Create, read, update, and delete database connections
- **Supported Databases**: MySQL and PostgreSQL
- **Connection Testing**: Test-before-save functionality with real-time feedback
- **Modern UI**: Purple & grey color scheme with smooth animations
- **Secure Storage**: Encrypted password storage using Fernet encryption
- **REST API**: Full CRUD API with FastAPI

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **MongoDB**: Document database for configuration storage
- **PyMongo**: MongoDB driver
- **SQLAlchemy**: Database connection testing
- **Cryptography**: Password encryption

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

## Alternative: Docker Compose

```bash
# Generate encryption key
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())" > .env

# Start all services
docker-compose up --build
```

## Project Structure

```
etl-engine-3/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # Application entry
│   │   ├── config.py       # Configuration
│   │   ├── database.py     # MongoDB connection
│   │   ├── schemas/        # Pydantic models
│   │   ├── services/       # Business logic
│   │   ├── routers/        # API endpoints
│   │   └── utils/          # Utilities (encryption, etc.)
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API client
│   │   ├── hooks/          # Custom hooks
│   │   └── types/          # TypeScript types
│   └── package.json
└── SPECIFICATION.md        # Detailed specification
```

## API Endpoints

- `POST /api/v1/connections/` - Create connection
- `GET /api/v1/connections/` - List all connections
- `GET /api/v1/connections/{id}` - Get single connection
- `PUT /api/v1/connections/{id}` - Update connection
- `DELETE /api/v1/connections/{id}` - Delete connection
- `POST /api/v1/connections/test` - Test new connection
- `POST /api/v1/connections/{id}/test` - Test existing connection

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

## Next Steps (Phase 2)

- Add more database types (Oracle, SQL Server, Redshift, Snowflake)
- Implement ETL pipeline configuration
- Add scheduling and monitoring
- User authentication and permissions
- Connection health dashboard
- Automated testing schedules

## License

MIT

## Version

1.0.0 - Phase 1 POC
