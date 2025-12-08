from cryptography.fernet import Fernet
from ..config import get_settings
import base64

settings = get_settings()


def get_cipher():
    """Get Fernet cipher instance"""
    key = settings.encryption_key.encode()
    return Fernet(key)


def encrypt_password(password: str) -> str:
    """Encrypt password for storage"""
    cipher = get_cipher()
    encrypted = cipher.encrypt(password.encode())
    return base64.b64encode(encrypted).decode()


def decrypt_password(encrypted_password: str) -> str:
    """Decrypt password for use"""
    cipher = get_cipher()
    decoded = base64.b64decode(encrypted_password.encode())
    return cipher.decrypt(decoded).decode()
