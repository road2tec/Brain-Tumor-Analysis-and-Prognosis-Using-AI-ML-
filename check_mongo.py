from pymongo import MongoClient
try:
    client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
    print(client.server_info())
    print("MongoDB Connected.")
except Exception as e:
    print(f"MongoDB Not Connected: {e}")
