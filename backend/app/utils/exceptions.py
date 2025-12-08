class ConnectionNotFoundError(Exception):
    """Raised when a connection is not found"""
    pass


class DuplicateConnectionError(Exception):
    """Raised when trying to create a connection with duplicate name"""
    pass


class ConnectionTestError(Exception):
    """Raised when connection test fails"""
    pass
