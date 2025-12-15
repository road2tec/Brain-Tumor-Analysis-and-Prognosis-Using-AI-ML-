from pymongo import MongoClient
from backend.config import settings
import sys

# Print specific parts to verify without printing full URI if sensitive (though user pasted it)
print(f"Testing connection to DB: {settings.DB_NAME}")

try:
    client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
    # Trigger a connection
    info = client.server_info()
    print("MongoDB Atlas Connected Successfully!")
    print(f"Server version: {info.get('version')}")
except Exception as e:
    print(f"Connection Failed: {e}")
    sys.exit(1)
