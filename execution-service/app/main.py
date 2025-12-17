from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import connect_to_mongo, close_mongo_connection
from .routers import executions, delta_tables, mapping_runs
from .config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    connect_to_mongo()
    yield
    # Shutdown
    close_mongo_connection()


app = FastAPI(
    title="ETL Execution Service",
    description="Microservice for executing ETL mappings and writing to Delta Lake",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(executions.router, prefix=settings.api_v1_prefix)
app.include_router(delta_tables.router, prefix=settings.api_v1_prefix)
app.include_router(mapping_runs.router, prefix=settings.api_v1_prefix)


@app.get("/health")
async def health_check():
    """Root health check endpoint"""
    return {
        "status": "healthy",
        "service": "ETL Execution Service",
        "version": "1.0.0"
    }
