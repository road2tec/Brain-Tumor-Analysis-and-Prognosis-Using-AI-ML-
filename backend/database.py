from pymongo import MongoClient
from .config import settings

client = MongoClient(settings.MONGO_URI)
db = client[settings.DB_NAME]
users_collection = db["users"]
predictions_collection = db["predictions"]

# Ensure unique index on email
users_collection.create_index("email", unique=True)
