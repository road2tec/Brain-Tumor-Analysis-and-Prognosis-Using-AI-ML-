import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SECRET_KEY: str = "your-secret-key-keep-it-secret"  # Change in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    MONGO_URI: str = os.getenv("MONGO_URI")
    DB_NAME: str = "campusconnect"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")

settings = Settings()
