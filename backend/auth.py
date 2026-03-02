from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import secrets
import string
from config import settings

def verify_password(plain_password, hashed_password):
    # Check if hashed_password is str, convert to bytes
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    
    password_byte_enc = plain_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password)

def get_password_hash(password):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    # Return as string for storage
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def generate_random_password(length: int = 12) -> str:
    """Generate a secure random password"""
    characters = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(characters) for _ in range(length))
    return password
