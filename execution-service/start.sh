#!/bin/bash

# ETL Execution Service Startup Script

echo "Starting ETL Execution Service..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Check if MongoDB is running
echo "Checking MongoDB connection..."
if ! nc -z localhost 27017 2>/dev/null; then
    echo "Warning: MongoDB doesn't appear to be running on localhost:27017"
    echo "Make sure MongoDB is started before running this service."
fi

# Start the service
echo "Starting FastAPI server on port 8001..."
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
