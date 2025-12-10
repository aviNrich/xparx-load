class MappingNotFoundError(Exception):
    """Raised when mapping is not found in database"""
    pass


class ConnectionNotFoundError(Exception):
    """Raised when connection is not found in database"""
    pass


class ColumnMappingNotFoundError(Exception):
    """Raised when column mapping configuration is not found"""
    pass


class SchemaNotFoundError(Exception):
    """Raised when target schema is not found"""
    pass


class SourceConnectionError(Exception):
    """Raised when unable to connect to source database"""
    pass


class SourceQueryError(Exception):
    """Raised when source SQL query fails"""
    pass


class TransformationError(Exception):
    """Raised when data transformation fails"""
    pass


class SchemaValidationError(Exception):
    """Raised when schema validation fails (e.g., type mismatch)"""
    pass


class DeltaWriteError(Exception):
    """Raised when Delta Lake write operation fails"""
    pass
