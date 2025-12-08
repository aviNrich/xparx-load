# Quick Start Guide

Get the ETL Source Connection Manager running in 5 minutes!

## Option 1: Local Development (Recommended for Testing)

### Step 1: Start MongoDB
```bash
docker run -d -p 27017:27017 --name etl-mongodb mongo:7.0
```

### Step 2: Setup Backend
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Generate encryption key and create .env
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())" > .env
echo "MONGODB_URL=mongodb://localhost:27017" >> .env
echo "MONGODB_DB_NAME=etl_engine" >> .env
echo "API_V1_PREFIX=/api/v1" >> .env
echo 'CORS_ORIGINS=["http://localhost:5173"]' >> .env

# Start backend server
uvicorn app.main:app --reload
```

Backend will be running at: **http://localhost:8000**
API Documentation at: **http://localhost:8000/docs**

### Step 3: Setup Frontend (New Terminal)
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env.local

# Start frontend dev server
npm run dev
```

Frontend will be running at: **http://localhost:5173**

## Option 2: Docker Compose (Full Stack)

```bash
# Generate encryption key
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())" > .env

# Start all services
docker-compose up --build
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- MongoDB: localhost:27017

## Testing the Application

### 1. Create a Test MySQL Connection
If you don't have MySQL running, you can start a test instance:
```bash
docker run -d --name test-mysql \
  -e MYSQL_ROOT_PASSWORD=password123 \
  -e MYSQL_DATABASE=testdb \
  -p 3307:3306 \
  mysql:8.0
```

Then create a connection in the UI:
- **Name**: Test MySQL
- **Type**: MySQL
- **Host**: localhost
- **Port**: 3307
- **Database**: testdb
- **Username**: root
- **Password**: password123

### 2. Create a Test PostgreSQL Connection
For PostgreSQL:
```bash
docker run -d --name test-postgres \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=testdb \
  -p 5433:5432 \
  postgres:15
```

Then create a connection:
- **Name**: Test PostgreSQL
- **Type**: PostgreSQL
- **Host**: localhost
- **Port**: 5433
- **Database**: testdb
- **Username**: postgres
- **Password**: password123

## Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError`
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**Problem**: `Connection refused` to MongoDB
```bash
# Check if MongoDB is running
docker ps | grep mongo

# If not running, start it
docker start etl-mongodb
```

**Problem**: `ENCRYPTION_KEY not set`
```bash
# Generate and add to .env
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())" >> backend/.env
```

### Frontend Issues

**Problem**: Port 5173 already in use
```bash
# Kill the process using the port (Linux/Mac)
lsof -ti:5173 | xargs kill -9

# Or change the port in vite.config.ts
```

**Problem**: `npm install` fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Problem**: Cannot connect to backend
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check .env.local has correct API URL
cat frontend/.env.local
```

### Connection Test Issues

**Problem**: Connection test fails with timeout
- Ensure the database is accessible from your machine
- Check firewall rules
- Verify host and port are correct
- For Docker databases, use `localhost` (not `127.0.0.1`)

**Problem**: Authentication failed
- Double-check username and password
- For MySQL root user, ensure you're using the correct password
- For PostgreSQL, default user is `postgres`

## Management Pitch Demo Flow

1. **Show Empty State**: Fresh load with no connections
2. **Create Connection**: Click "New Connection", fill form
3. **Test Connection**: Click "Test Connection", show success with version
4. **Save Connection**: Save and see it appear in grid
5. **Show Card Details**: Hover effects, status indicators
6. **Edit Connection**: Modify and re-test
7. **Show Multiple Connections**: Create MySQL and PostgreSQL
8. **Delete Connection**: Demonstrate delete with confirmation

## Next Steps

- See [README.md](README.md) for full documentation
- See [SPECIFICATION.md](SPECIFICATION.md) for detailed spec
- API docs available at http://localhost:8000/docs
- Explore the code in `backend/app/` and `frontend/src/`

## Need Help?

- Check logs: Backend terminal and Frontend terminal
- Backend logs show API requests and errors
- Frontend console (F12) shows client-side errors
- MongoDB logs: `docker logs etl-mongodb`
