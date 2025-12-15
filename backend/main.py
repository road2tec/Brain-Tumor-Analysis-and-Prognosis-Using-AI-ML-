from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from typing import List

from . import models, auth, database, ml_model, gemini_service
from .config import settings

app = FastAPI(title="Brain Tumor Detection API")

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@app.on_event("startup")
async def startup_event():
    ml_model.load_model_at_startup()

# Dependency to get current user
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        from jose import jwt, JWTError
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = database.users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return models.UserInDB(**user)

# Auth Routes
@app.post("/auth/signup", response_model=models.Token)
async def signup(user: models.UserCreate):
    if database.users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    user_in_db = models.UserInDB(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password
    )
    database.users_collection.insert_one(user_in_db.dict())
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=models.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = database.users_collection.find_one({"email": form_data.username})
    if not user or not auth.verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user['email']}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=models.UserCreate) # Responding with UserCreate for simplicity, should separate schemas
async def read_users_me(current_user: models.UserInDB = Depends(get_current_user)):
    return models.UserCreate(name=current_user.name, email=current_user.email, password="")

# Prediction Routes
@app.post("/predict", response_model=models.PredictionResponse)
async def predict_tumor(file: UploadFile = File(...), current_user: models.UserInDB = Depends(get_current_user)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    
    try:
        classifier = ml_model.get_model()
        result = classifier.predict(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    
    prediction_record = {
        "user_email": current_user.email,
        "filename": file.filename,
        "prediction": result['class_name'],
        "confidence": result['confidence'],
        "timestamp": datetime.utcnow()
    }
    
    # Insert and get ID
    res = database.predictions_collection.insert_one(prediction_record)
    
    return {
        "id": str(res.inserted_id),
        "filename": prediction_record['filename'],
        "prediction": prediction_record['prediction'],
        "confidence": prediction_record['confidence'],
        "timestamp": prediction_record['timestamp']
    }

@app.get("/history", response_model=List[models.PredictionResponse])
async def get_history(current_user: models.UserInDB = Depends(get_current_user)):
    cursor = database.predictions_collection.find({"user_email": current_user.email}).sort("timestamp", -1)
    history = []
    for doc in cursor:
        history.append({
            "id": str(doc["_id"]),
            "filename": doc["filename"],
            "prediction": doc["prediction"],
            "confidence": doc["confidence"],
            "timestamp": doc["timestamp"]
        })
    return history

@app.post("/treatment", response_model=models.TreatmentResponse)
async def get_treatment_plan(request: models.TreatmentRequest, current_user: models.UserInDB = Depends(get_current_user)):
    treatment_plan = gemini_service.get_treatment_plan(request.disease)
    return models.TreatmentResponse(disease=request.disease, treatment_plan=treatment_plan)
