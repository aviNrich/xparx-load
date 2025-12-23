from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pymongo.database import Database
from bson import ObjectId
from typing import List
import os
import shutil
from pathlib import Path
from ..database import get_database
from ..schemas.connection import (
    ConnectionCreate, ConnectionUpdate, ConnectionResponse,
    TestConnectionRequest, TestConnectionResponse
)
from ..services.connection_service import ConnectionService
from ..services.test_connection_service import test_database_connection
from ..utils.exceptions import ConnectionNotFoundError, DuplicateConnectionError

router = APIRouter(prefix="/connections", tags=["connections"])


def get_connection_service(db: Database = Depends(get_database)) -> ConnectionService:
    return ConnectionService(db)


@router.post("/", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
def create_connection(
    connection: ConnectionCreate,
    service: ConnectionService = Depends(get_connection_service)
):
    """Create a new source connection"""
    try:
        return service.create_connection(connection)
    except DuplicateConnectionError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/", response_model=List[ConnectionResponse])
def list_connections(
    include_archived: bool = False,
    service: ConnectionService = Depends(get_connection_service)
):
    """List all source connections"""
    return service.list_connections(include_archived=include_archived)


@router.get("/{connection_id}", response_model=ConnectionResponse)
def get_connection(
    connection_id: str,
    service: ConnectionService = Depends(get_connection_service)
):
    """Get a specific connection by ID"""
    try:
        return service.get_connection(connection_id)
    except ConnectionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{connection_id}", response_model=ConnectionResponse)
def update_connection(
    connection_id: str,
    update: ConnectionUpdate,
    service: ConnectionService = Depends(get_connection_service)
):
    """Update an existing connection"""
    try:
        return service.update_connection(connection_id, update)
    except ConnectionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DuplicateConnectionError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/{connection_id}/archive", response_model=ConnectionResponse)
def archive_connection(
    connection_id: str,
    service: ConnectionService = Depends(get_connection_service)
):
    """Archive a connection (soft delete)"""
    try:
        return service.archive_connection(connection_id)
    except ConnectionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{connection_id}/restore", response_model=ConnectionResponse)
def restore_connection(
    connection_id: str,
    service: ConnectionService = Depends(get_connection_service)
):
    """Restore an archived connection"""
    try:
        return service.restore_connection(connection_id)
    except ConnectionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/test", response_model=TestConnectionResponse)
def test_connection(
    connection: TestConnectionRequest,
    service: ConnectionService = Depends(get_connection_service)
):
    """Test a database connection before saving"""
    result = test_database_connection(connection)
    return result


@router.post("/{connection_id}/test", response_model=TestConnectionResponse)
def test_existing_connection(
    connection_id: str,
    service: ConnectionService = Depends(get_connection_service)
):
    """Test an existing connection"""
    try:
        # Get the connection
        connection = service.get_connection(connection_id)

        # Decrypt password for testing
        from ..utils.encryption import decrypt_password
        test_request = TestConnectionRequest(
            name=connection.name,
            db_type=connection.db_type,
            host=connection.host,
            port=connection.port,
            database=connection.database,
            username=connection.username,
            password=decrypt_password(connection.password)
        )

        result = test_database_connection(test_request)

        # Update test status
        service.update_test_status(
            connection_id,
            "success" if result.success else "failed"
        )

        return result
    except ConnectionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/upload", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def upload_files(
    name: str = Form(...),
    file_type: str = Form(...),
    files: List[UploadFile] = File(...),
    service: ConnectionService = Depends(get_connection_service),
    db: Database = Depends(get_database)
):
    """Upload files and create a file-based connection"""
    file_paths = []
    try:
        # Validate file type
        if file_type not in ["csv", "json", "excel"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file_type: {file_type}"
            )

        # Create upload directory
        upload_dir = Path("/tmp/uploaded-files")
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Save uploaded files
        for file in files:
            # Generate unique filename
            file_id = str(ObjectId())
            file_extension = Path(file.filename).suffix
            file_path = upload_dir / f"{file_id}{file_extension}"

            # Save file
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            file_paths.append(str(file_path))

        # Create connection object
        connection_data = ConnectionCreate(
            name=name,
            db_type="file",
            file_type=file_type,
            file_paths=file_paths
        )

        return service.create_connection(connection_data)

    except DuplicateConnectionError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        # Clean up uploaded files on error
        for path in file_paths:
            if os.path.exists(path):
                os.remove(path)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
