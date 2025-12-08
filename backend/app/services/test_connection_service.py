from sqlalchemy import create_engine, text
from ..schemas.connection import TestConnectionRequest, TestConnectionResponse
from ..utils.encryption import decrypt_password
import traceback


def build_connection_string(connection: TestConnectionRequest, decrypt: bool = False) -> str:
    """Build SQLAlchemy connection string"""
    password = connection.password if not decrypt else decrypt_password(connection.password)

    if connection.db_type == "mysql":
        return f"mysql+pymysql://{connection.username}:{password}@{connection.host}:{connection.port}/{connection.database}"
    elif connection.db_type == "postgresql":
        return f"postgresql+psycopg2://{connection.username}:{password}@{connection.host}:{connection.port}/{connection.database}"

    raise ValueError(f"Unsupported database type: {connection.db_type}")


def test_database_connection(connection: TestConnectionRequest) -> TestConnectionResponse:
    """Test database connection using SQLAlchemy"""
    try:
        connection_string = build_connection_string(connection)

        # Create engine with connection timeout
        engine = create_engine(
            connection_string,
            connect_args={
                "connect_timeout": 5
            },
            pool_pre_ping=True
        )

        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()

        # Get database version
        with engine.connect() as conn:
            if connection.db_type == "mysql":
                version_result = conn.execute(text("SELECT VERSION()"))
                version = version_result.fetchone()[0]
            else:  # postgresql
                version_result = conn.execute(text("SELECT version()"))
                version = version_result.fetchone()[0]

        engine.dispose()

        return TestConnectionResponse(
            success=True,
            message="Connection successful",
            details={
                "db_type": connection.db_type,
                "version": version
            }
        )

    except Exception as e:
        return TestConnectionResponse(
            success=False,
            message=f"Connection failed: {str(e)}",
            details={
                "error_type": type(e).__name__,
                "traceback": traceback.format_exc()
            }
        )
