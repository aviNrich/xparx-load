from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .config import get_settings
from .database import connect_to_mongo, close_mongo_connection
from .routers import connections, schemas

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    connect_to_mongo()
    yield
    # Shutdown
    close_mongo_connection()


app = FastAPI(
    title="ETL Source Connection Manager",
    description="API for managing ETL source database connections",
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
app.include_router(connections.router, prefix=settings.api_v1_prefix)
app.include_router(schemas.router, prefix=settings.api_v1_prefix)


@app.get("/")
def root():
    return {"message": "ETL Source Connection Manager API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
