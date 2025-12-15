import os

class Settings:
    SECRET_KEY: str = "your-secret-key-keep-it-secret"  # Change in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    MONGO_URI: str = "mongodb+srv://vishalroad2tech_db_user:vishal%40123@p1.qshu0ys.mongodb.net/campusconnect?retryWrites=true&w=majority"
    DB_NAME: str = "campusconnect"

settings = Settings()
