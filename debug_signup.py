import sys
from backend import models, auth, database
from backend.models import UserCreate, UserInDB

try:
    print("Simulating Signup...")
    user = UserCreate(name="DebugUser", email="debug@test.com", password="password")
    
    print("Checking DB...")
    if database.users_collection.find_one({"email": user.email}):
        print("User already exists, deleting...")
        database.users_collection.delete_one({"email": user.email})
        
    print("Hashing password...")
    hashed_password = auth.get_password_hash(user.password)
    print(f"Hashed: {hashed_password[:10]}...")
    
    user_in_db = UserInDB(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password
    )
    
    print("Inserting into DB...")
    # This might be where it fails if using Atlas and there's a connection issue or IP whitelist issue
    # But check_atlas.py passed.
    database.users_collection.insert_one(user_in_db.dict())
    print("Signup Simulation Successful!")
    
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Error: {e}")
