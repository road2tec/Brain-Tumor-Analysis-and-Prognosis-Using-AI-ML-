from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PredictionResponse(BaseModel):
    id: str
    filename: str
    prediction: str
    confidence: float
    timestamp: datetime

class UserInDB(BaseModel):
    name: str
    email: str
    hashed_password: str
