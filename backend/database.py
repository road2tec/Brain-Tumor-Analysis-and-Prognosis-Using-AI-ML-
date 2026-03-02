from pymongo import MongoClient
from config import settings

client = MongoClient(settings.MONGO_URI)
db = client[settings.DB_NAME]

# Collections
users_collection = db["users"]
predictions_collection = db["predictions"]
doctors_collection = db["doctors"]
appointments_collection = db["appointments"]
availability_collection = db["availability"]
hospitals_collection = db["hospitals"]

# Ensure unique indexes
users_collection.create_index("email", unique=True)
doctors_collection.create_index("email", unique=True)
hospitals_collection.create_index("registration_number", unique=True)
