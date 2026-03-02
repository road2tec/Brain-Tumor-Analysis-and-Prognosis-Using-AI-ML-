from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from typing import List, Optional
from bson import ObjectId
import os

import models, auth, database, ml_model, gemini_service, requests
from config import settings

app = FastAPI(title="Brain Tumor Detection API")

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    # Allow local network access
    "http://10.18.77.2:3000",
    "http://192.168.1.100:3000", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@app.on_event("startup")
async def startup_event():
    ml_model.load_model_at_startup()
    # Create default admin if doesn't exist
    if not database.users_collection.find_one({"email": "admin@neuroscout.com"}):
        admin_user = {
            "name": "Admin",
            "email": "admin@neuroscout.com",
            "hashed_password": auth.get_password_hash("admin123"),
            "role": "admin",
            "is_active": True
        }
        database.users_collection.insert_one(admin_user)
        print("Default admin created: admin@neuroscout.com / admin123")

# ============ DEPENDENCIES ============

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
        role: str = payload.get("role", "user")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Check in users collection first
    user = database.users_collection.find_one({"email": email})
    if user:
        return {**user, "_id": str(user["_id"]), "role": user.get("role", "user")}
    
    # Check in doctors collection
    doctor = database.doctors_collection.find_one({"email": email})
    if doctor:
        return {**doctor, "_id": str(doctor["_id"]), "role": "doctor"}
    
    raise credentials_exception

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def get_doctor_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Doctor access required")
    return current_user

# ============ AUTH ROUTES ============

@app.post("/auth/signup", response_model=models.Token)
async def signup(user: models.UserCreate):
    if database.users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    user_in_db = {
        "name": user.name,
        "email": user.email,
        "hashed_password": hashed_password,
        "role": "user",
        "is_active": True
    }
    result = database.users_collection.insert_one(user_in_db)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": "user"}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": "user",
        "user_id": str(result.inserted_id)
    }

@app.post("/auth/login", response_model=models.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Check in users collection
    user = database.users_collection.find_one({"email": form_data.username})
    if user:
        if not user.get("is_active", True):
            raise HTTPException(status_code=403, detail="Account deactivated")
        if not auth.verify_password(form_data.password, user['hashed_password']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        role = user.get("role", "user")
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": user['email'], "role": role}, expires_delta=access_token_expires
        )
        return {
            "access_token": access_token, 
            "token_type": "bearer", 
            "role": role,
            "user_id": str(user["_id"])
        }
    
    # Check in doctors collection
    doctor = database.doctors_collection.find_one({"email": form_data.username})
    if doctor:
        if not doctor.get("is_active", True):
            raise HTTPException(status_code=403, detail="Account deactivated")
        if not auth.verify_password(form_data.password, doctor['hashed_password']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": doctor['email'], "role": "doctor"}, expires_delta=access_token_expires
        )
        return {
            "access_token": access_token, 
            "token_type": "bearer", 
            "role": "doctor",
            "user_id": str(doctor["_id"])
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user.get("role", "user"),
        "is_active": current_user.get("is_active", True),
        "phone": current_user.get("phone"),
        "age": current_user.get("age"),
        "gender": current_user.get("gender"),
        "location": current_user.get("location")
    }

@app.patch("/users/me")
async def update_user_profile(profile_update: models.UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Update user profile including location"""
    update_data = {}
    
    if profile_update.name is not None:
        update_data["name"] = profile_update.name
    if profile_update.phone is not None:
        update_data["phone"] = profile_update.phone
    if profile_update.age is not None:
        update_data["age"] = profile_update.age
    if profile_update.gender is not None:
        update_data["gender"] = profile_update.gender
    if profile_update.location is not None:
        update_data["location"] = profile_update.location.dict()
    
    if update_data:
        database.users_collection.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": update_data}
        )
    
    return {"message": "Profile updated successfully"}


# ============ ADMIN ROUTES ============

@app.get("/admin/dashboard", response_model=models.DashboardStats)
async def get_dashboard_stats(admin: dict = Depends(get_admin_user)):
    total_users = database.users_collection.count_documents({"role": "user"})
    active_users = database.users_collection.count_documents({"role": "user", "is_active": True})
    total_doctors = database.doctors_collection.count_documents({})
    active_doctors = database.doctors_collection.count_documents({"is_active": True})
    total_hospitals = database.hospitals_collection.count_documents({})
    active_hospitals = database.hospitals_collection.count_documents({"is_active": True})
    total_appointments = database.appointments_collection.count_documents({})
    pending_appointments = database.appointments_collection.count_documents({"status": "pending"})
    total_predictions = database.predictions_collection.count_documents({})
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_doctors": total_doctors,
        "active_doctors": active_doctors,
        "total_hospitals": total_hospitals,
        "active_hospitals": active_hospitals,
        "total_appointments": total_appointments,
        "pending_appointments": pending_appointments,
        "total_predictions": total_predictions
    }

@app.post("/admin/doctors", response_model=models.DoctorPasswordResponse)
async def create_doctor(doctor: models.DoctorCreate, admin: dict = Depends(get_admin_user)):
    # Check if email already exists
    if database.doctors_collection.find_one({"email": doctor.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate random password
    password = auth.generate_random_password()
    hashed_password = auth.get_password_hash(password)
    
    # Validate hospital
    hospital = database.hospitals_collection.find_one({"_id": ObjectId(doctor.hospital_id)})
    if not hospital:
        print(f"DEBUG: Hospital not found for ID: {doctor.hospital_id}")
        raise HTTPException(status_code=400, detail="Invalid hospital ID")
    
    print(f"DEBUG: Linking doctor to hospital: {hospital.get('hospital_name')}")
    
    h_name = hospital.get("hospital_name")
    if not h_name:
        # Fallback if hospital_name is missing for some reason
        h_name = "Unknown Hospital"
    
    doctor_in_db = {
        "name": doctor.name,
        "email": doctor.email,
        "hashed_password": hashed_password,
        "temp_password": password,  # Store for admin viewing
        "role": "doctor",
        "speciality": doctor.speciality,
        "experience": doctor.experience,
        "expert_in": doctor.expert_in,
        "hospital_id": str(hospital["_id"]),
        "hospital_name": h_name,
        "is_active": True
    }
    
    print(f"DEBUG: Saving doctor with hospital_name: {h_name}")
    database.doctors_collection.insert_one(doctor_in_db)
    
    return {
        "email": doctor.email,
        "password": password,
        "message": "Doctor created successfully. Please share these credentials securely."
    }

@app.get("/admin/doctors", response_model=List[models.DoctorResponse])
async def get_all_doctors(admin: dict = Depends(get_admin_user)):
    doctors = []
    for doc in database.doctors_collection.find():
        h_id = doc.get("hospital_id")
        h_name = doc.get("hospital_name")
        
        if h_id and not h_name:
            # Try to fetch hospital name if it was missing (for older records)
            try:
                h_doc = database.hospitals_collection.find_one({"_id": ObjectId(h_id)})
                if h_doc:
                    h_name = h_doc.get("hospital_name")
                    # Optionally update the record for future efficiency
                    database.doctors_collection.update_one({"_id": doc["_id"]}, {"$set": {"hospital_name": h_name}})
            except:
                pass
        
        doctors.append({
            "id": str(doc["_id"]),
            "name": doc["name"],
            "email": doc["email"],
            "speciality": doc["speciality"],
            "experience": doc.get("experience", 0),
            "expert_in": doc.get("expert_in", []),
            "hospital_id": h_id,
            "hospital_name": h_name,
            "is_active": doc.get("is_active", True),
            "temp_password": doc.get("temp_password", None)  # Include password for viewing
        })
    return doctors

@app.patch("/admin/doctors/{doctor_id}/status")
async def update_doctor_status(doctor_id: str, status_update: models.UserStatusUpdate, admin: dict = Depends(get_admin_user)):
    result = database.doctors_collection.update_one(
        {"_id": ObjectId(doctor_id)},
        {"$set": {"is_active": status_update.is_active}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"message": "Doctor status updated"}

@app.patch("/admin/doctors/{doctor_id}/reset-password", response_model=models.DoctorPasswordResponse)
async def reset_doctor_password(doctor_id: str, admin: dict = Depends(get_admin_user)):
    """Reset doctor password and return new credentials"""
    doctor = database.doctors_collection.find_one({"_id": ObjectId(doctor_id)})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Generate new random password
    new_password = auth.generate_random_password()
    hashed_password = auth.get_password_hash(new_password)
    
    # Update password in database
    database.doctors_collection.update_one(
        {"_id": ObjectId(doctor_id)},
        {"$set": {
            "hashed_password": hashed_password,
            "temp_password": new_password  # Store for admin viewing
        }}
    )
    
    return {
        "email": doctor["email"],
        "password": new_password,
        "message": "Password reset successfully. Please share these credentials securely."
    }

@app.get("/admin/users")
async def get_all_users(admin: dict = Depends(get_admin_user)):
    users = []
    for user in database.users_collection.find({"role": "user"}):
        users.append({
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "is_active": user.get("is_active", True)
        })
    return users

@app.patch("/admin/users/{user_id}/status")
async def update_user_status(user_id: str, status_update: models.UserStatusUpdate, admin: dict = Depends(get_admin_user)):
    result = database.users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": status_update.is_active}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User status updated"}

@app.get("/admin/appointments", response_model=List[models.AppointmentResponse])
async def get_all_appointments(admin: dict = Depends(get_admin_user)):
    appointments = []
    for apt in database.appointments_collection.find().sort("created_at", -1):
        patient = database.users_collection.find_one({"_id": ObjectId(apt["patient_id"])})
        doctor = database.doctors_collection.find_one({"_id": ObjectId(apt["doctor_id"])})
        
        appointments.append({
            "id": str(apt["_id"]),
            "patient_id": apt["patient_id"],
            "patient_name": patient["name"] if patient else "Unknown",
            "patient_email": patient["email"] if patient else "Unknown",
            "doctor_id": apt["doctor_id"],
            "doctor_name": doctor["name"] if doctor else "Unknown",
            "appointment_date": apt["appointment_date"],
            "slot": apt["slot"],
            "status": apt["status"],
            "reason": apt.get("reason"),
            "tumor_type": apt.get("tumor_type"),
            "created_at": apt["created_at"]
        })
    return appointments

# ============ DOCTOR ROUTES ============

@app.get("/doctor/profile")
async def get_doctor_profile(doctor: dict = Depends(get_doctor_user)):
    return {
        "id": doctor["_id"],
        "name": doctor["name"],
        "email": doctor["email"],
        "speciality": doctor.get("speciality"),
        "experience": doctor.get("experience", 0),
        "expert_in": doctor.get("expert_in", []),
        "is_active": doctor.get("is_active", True)
    }

@app.patch("/doctor/profile")
async def update_doctor_profile(update: models.DoctorUpdate, doctor: dict = Depends(get_doctor_user)):
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        database.doctors_collection.update_one(
            {"_id": ObjectId(doctor["_id"])},
            {"$set": update_data}
        )
    return {"message": "Profile updated successfully"}

@app.post("/doctor/availability")
async def add_availability(availability: models.AvailabilityCreate, doctor: dict = Depends(get_doctor_user)):
    # Override doctor_id with authenticated doctor
    availability_data = {
        "doctor_id": doctor["_id"],
        "day_of_week": availability.day_of_week,
        "slots": [slot.dict() for slot in availability.slots]
    }
    
    # Remove existing availability for this day
    database.availability_collection.delete_many({
        "doctor_id": doctor["_id"],
        "day_of_week": availability.day_of_week
    })
    
    database.availability_collection.insert_one(availability_data)
    return {"message": "Availability updated successfully"}

@app.get("/doctor/availability")
async def get_doctor_availability(doctor: dict = Depends(get_doctor_user)):
    availabilities = []
    for avail in database.availability_collection.find({"doctor_id": doctor["_id"]}):
        availabilities.append({
            "id": str(avail["_id"]),
            "doctor_id": avail["doctor_id"],
            "doctor_name": doctor["name"],
            "day_of_week": avail["day_of_week"],
            "slots": avail["slots"]
        })
    return availabilities

@app.get("/doctor/appointments", response_model=List[models.AppointmentResponse])
async def get_doctor_appointments(doctor: dict = Depends(get_doctor_user)):
    appointments = []
    for apt in database.appointments_collection.find({"doctor_id": doctor["_id"]}).sort("created_at", -1):
        patient = database.users_collection.find_one({"_id": ObjectId(apt["patient_id"])})
        
        appointments.append({
            "id": str(apt["_id"]),
            "patient_id": apt["patient_id"],
            "patient_name": patient["name"] if patient else "Unknown",
            "patient_email": patient["email"] if patient else "Unknown",
            "doctor_id": apt["doctor_id"],
            "doctor_name": doctor["name"],
            "appointment_date": apt["appointment_date"],
            "slot": apt["slot"],
            "status": apt["status"],
            "reason": apt.get("reason"),
            "tumor_type": apt.get("tumor_type"),
            "created_at": apt["created_at"]
        })
    return appointments

@app.patch("/doctor/appointments/{appointment_id}")
async def update_appointment_status(
    appointment_id: str, 
    update: models.AppointmentUpdate, 
    doctor: dict = Depends(get_doctor_user)
):
    # Verify the appointment belongs to this doctor
    appointment = database.appointments_collection.find_one({
        "_id": ObjectId(appointment_id),
        "doctor_id": doctor["_id"]
    })
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    database.appointments_collection.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": update.status}}
    )
    
    return {"message": "Appointment status updated"}

@app.get("/doctor/patients")
async def get_doctor_patients(doctor: dict = Depends(get_doctor_user)):
    # Get unique patient IDs from appointments
    # Sort by created_at descending to get latest appointment first
    appointments = list(database.appointments_collection.find({"doctor_id": doctor["_id"]}).sort("created_at", -1))
    
    # Store patients using a dict to keep unique entries, prioritizing the latest appointment
    unique_patients = {}
    
    for apt in appointments:
        patient_id = apt["patient_id"]
        if patient_id not in unique_patients:
            patient = database.users_collection.find_one({"_id": ObjectId(patient_id)})
            if patient:
                # Get latest prediction for this patient
                prediction = database.predictions_collection.find_one(
                    {"user_email": patient["email"]},
                    sort=[("timestamp", -1)]
                )
                
                prediction_data = None
                if prediction:
                    prediction_data = {
                        "class": prediction.get("prediction"),
                        "confidence": prediction.get("confidence")
                    }

                unique_patients[patient_id] = {
                    "id": str(patient["_id"]),
                    "patient_name": patient["name"],
                    "patient_email": patient["email"],
                    "tumor_type": apt.get("tumor_type"),
                    "appointment_date": apt.get("appointment_date"),
                    "prediction": prediction_data
                }
    
    return list(unique_patients.values())

# ============ USER/PATIENT ROUTES ============

import math

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates using Haversine formula (in km)"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return round(distance, 2)

@app.get("/doctors", response_model=List[models.DoctorResponse])
async def get_available_doctors(tumor_type: str = None, current_user: dict = Depends(get_current_user)):
    query = {"is_active": True}
    if tumor_type:
        query["expert_in"] = tumor_type
    
    doctors = []
    for doc in database.doctors_collection.find(query):
        doctors.append({
            "id": str(doc["_id"]),
            "name": doc["name"],
            "email": doc["email"],
            "speciality": doc["speciality"],
            "experience": doc.get("experience", 0),
            "expert_in": doc.get("expert_in", []),
            "is_active": doc.get("is_active", True)
        })
    return doctors

@app.get("/doctors/nearby", response_model=List[models.DoctorWithDistance])
async def get_nearby_doctors(
    tumor_type: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get doctors sorted by distance from user's location with hospital information"""
    
    # Get user location from params or profile
    user_lat = latitude if latitude is not None else current_user.get("location", {}).get("latitude")
    user_lon = longitude if longitude is not None else current_user.get("location", {}).get("longitude")
    
    query = {"is_active": True}
    if tumor_type:
        query["expert_in"] = tumor_type
    
    doctors_with_distance = []
    
    for doc in database.doctors_collection.find(query):
        doctor_data = {
            "id": str(doc["_id"]),
            "name": doc["name"],
            "email": doc["email"],
            "speciality": doc["speciality"],
            "experience": doc.get("experience", 0),
            "expert_in": doc.get("expert_in", []),
            "hospital_id": doc.get("hospital_id"),
            "hospital_name": doc.get("hospital_name"),
            "is_active": doc.get("is_active", True),
            "distance_km": None,
            "hospital_address": None,
            "hospital_city": None,
            "hospital_location": None
        }
        
        # Get hospital information
        if doc.get("hospital_id"):
            try:
                hospital = database.hospitals_collection.find_one({"_id": ObjectId(doc["hospital_id"])})
                if hospital:
                    location = hospital.get("location", {})
                    doctor_data["hospital_location"] = location
                    doctor_data["hospital_address"] = location.get("address_line1", "")
                    doctor_data["hospital_city"] = location.get("city", "")
                    
                    # Calculate distance if user location is available
                    if user_lat is not None and user_lon is not None:
                        hosp_lat = location.get("latitude")
                        hosp_lon = location.get("longitude")
                        if hosp_lat is not None and hosp_lon is not None:
                            doctor_data["distance_km"] = calculate_distance(user_lat, user_lon, hosp_lat, hosp_lon)
            except Exception as e:
                print(f"Error fetching hospital info: {e}")
        
        doctors_with_distance.append(doctor_data)
    
    # Sort by distance if available
    if user_lat is not None and user_lon is not None:
        doctors_with_distance.sort(key=lambda x: x["distance_km"] if x["distance_km"] is not None else float('inf'))
    
    return doctors_with_distance

@app.get("/doctors/{doctor_id}/availability")
async def get_specific_doctor_availability(doctor_id: str, current_user: dict = Depends(get_current_user)):
    availabilities = []
    for avail in database.availability_collection.find({"doctor_id": doctor_id}):
        doctor = database.doctors_collection.find_one({"_id": ObjectId(doctor_id)})
        availabilities.append({
            "id": str(avail["_id"]),
            "doctor_id": avail["doctor_id"],
            "doctor_name": doctor["name"] if doctor else "Unknown",
            "day_of_week": avail["day_of_week"],
            "slots": avail["slots"]
        })
    return availabilities

@app.post("/appointments", response_model=models.AppointmentResponse)
async def create_appointment(appointment: models.AppointmentCreate, current_user: dict = Depends(get_current_user)):
    # Verify doctor exists and is active
    doctor = database.doctors_collection.find_one({"_id": ObjectId(appointment.doctor_id)})
    if not doctor or not doctor.get("is_active", True):
        raise HTTPException(status_code=404, detail="Doctor not found or inactive")
    
    # Check if slot is available
    existing = database.appointments_collection.find_one({
        "doctor_id": appointment.doctor_id,
        "appointment_date": appointment.appointment_date,
        "slot.start_time": appointment.slot.start_time,
        "status": {"$in": ["pending", "confirmed"]}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Slot already booked")
    
    appointment_data = {
        "patient_id": current_user["_id"],
        "doctor_id": appointment.doctor_id,
        "appointment_date": appointment.appointment_date,
        "slot": appointment.slot.dict(),
        "status": "pending",
        "reason": appointment.reason,
        "tumor_type": appointment.tumor_type,
        "created_at": datetime.utcnow()
    }
    
    result = database.appointments_collection.insert_one(appointment_data)
    
    return {
        "id": str(result.inserted_id),
        "patient_id": current_user["_id"],
        "patient_name": current_user["name"],
        "patient_email": current_user["email"],
        "doctor_id": appointment.doctor_id,
        "doctor_name": doctor["name"],
        "appointment_date": appointment.appointment_date,
        "slot": appointment.slot,
        "status": "pending",
        "reason": appointment.reason,
        "tumor_type": appointment.tumor_type,
        "created_at": appointment_data["created_at"]
    }

@app.get("/appointments/my", response_model=List[models.AppointmentResponse])
async def get_my_appointments(current_user: dict = Depends(get_current_user)):
    appointments = []
    for apt in database.appointments_collection.find({"patient_id": current_user["_id"]}).sort("created_at", -1):
        doctor = database.doctors_collection.find_one({"_id": ObjectId(apt["doctor_id"])})
        
        appointments.append({
            "id": str(apt["_id"]),
            "patient_id": apt["patient_id"],
            "patient_name": current_user["name"],
            "patient_email": current_user["email"],
            "doctor_id": apt["doctor_id"],
            "doctor_name": doctor["name"] if doctor else "Unknown",
            "appointment_date": apt["appointment_date"],
            "slot": apt["slot"],
            "status": apt["status"],
            "reason": apt.get("reason"),
            "tumor_type": apt.get("tumor_type"),
            "created_at": apt["created_at"]
        })
    return appointments

# ============ PREDICTION ROUTES ============

@app.post("/predict", response_model=models.PredictionResponse)
async def predict_tumor(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    
    try:
        classifier = ml_model.get_model()
        result = classifier.predict(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    
    # Get suggested doctors based on tumor type
    suggested_doctors = []
    if result['class_name'] != "No Tumor":
        doctors = database.doctors_collection.find({
            "is_active": True,
            "expert_in": result['class_name']
        }).limit(3)
        
        for doc in doctors:
            suggested_doctors.append({
                "id": str(doc["_id"]),
                "name": doc["name"],
                "speciality": doc.get("speciality"),
                "experience": doc.get("experience", 0)
            })
    
    prediction_record = {
        "user_email": current_user["email"],
        "filename": file.filename,
        "prediction": result['class_name'],
        "confidence": result['confidence'],
        "timestamp": datetime.utcnow()
    }
    
    res = database.predictions_collection.insert_one(prediction_record)
    
    return {
        "id": str(res.inserted_id),
        "filename": prediction_record['filename'],
        "prediction": prediction_record['prediction'],
        "confidence": prediction_record['confidence'],
        "timestamp": prediction_record['timestamp'],
        "suggested_doctors": suggested_doctors
    }

@app.get("/history", response_model=List[models.PredictionResponse])
async def get_history(current_user: dict = Depends(get_current_user)):
    cursor = database.predictions_collection.find({"user_email": current_user["email"]}).sort("timestamp", -1)
    history = []
    for doc in cursor:
        history.append({
            "id": str(doc["_id"]),
            "filename": doc["filename"],
            "prediction": doc["prediction"],
            "confidence": doc["confidence"],
            "timestamp": doc["timestamp"],
            "suggested_doctors": []
        })
    return history

@app.post("/treatment", response_model=models.TreatmentResponse)
async def get_treatment_plan(request: models.TreatmentRequest, current_user: dict = Depends(get_current_user)):
    details = gemini_service.get_analysis_details(request.disease)
    return models.TreatmentResponse(
        disease=request.disease,
        treatment_plan=details.get("treatment_plan"),
        symptoms=details.get("symptoms"),
        prevention=details.get("prevention"),
        guidelines=details.get("guidelines")
    )


# ============ HOSPITAL ROUTES ============

from fastapi import Form, File, UploadFile
from fastapi.staticfiles import StaticFiles
import shutil
import json
import os

# Ensure static directory exists
os.makedirs("static/hospitals", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/admin/hospitals", response_model=models.HospitalResponse)
async def create_hospital(
    hospital_name: str = Form(...),
    hospital_type: str = Form(...),
    registration_number: str = Form(...),
    emergency_available: bool = Form(...),
    is_24x7: bool = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address_line1: Optional[str] = Form(None),
    address_line2: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    pincode: Optional[str] = Form(None),
    total_beds: int = Form(0),
    icu_beds: int = Form(0),
    ventilators: int = Form(0),
    other_info: Optional[str] = Form(None),
    hospital_image: Optional[UploadFile] = File(None),
    admin: dict = Depends(get_admin_user)
):
    # Check if registration number already exists
    if database.hospitals_collection.find_one({"registration_number": registration_number}):
        raise HTTPException(status_code=400, detail="Registration number already exists")

    image_path = None
    if hospital_image:
        file_extension = hospital_image.filename.split(".")[-1]
        filename = f"{registration_number}_{datetime.now().timestamp()}.{file_extension}"
        file_path = f"static/hospitals/{filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(hospital_image.file, buffer)
        image_path = file_path

    hospital_data = {
        "hospital_name": hospital_name,
        "hospital_type": hospital_type,
        "registration_number": registration_number,
        "emergency_available": emergency_available,
        "is_24x7": is_24x7,
        "location": {
            "latitude": latitude,
            "longitude": longitude,
            "address_line1": address_line1,
            "address_line2": address_line2,
            "city": city,
            "state": state,
            "country": country,
            "pincode": pincode
        },
        "infrastructure": {
            "total_beds": total_beds,
            "icu_beds": icu_beds,
            "ventilators": ventilators
        },
        "hospital_image": image_path,
        "other_info": other_info,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = database.hospitals_collection.insert_one(hospital_data)
    
    return {
        **hospital_data,
        "id": str(result.inserted_id)
    }

@app.get("/hospitals", response_model=List[models.HospitalResponse])
async def get_hospitals(
    skip: int = 0,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    hospitals = []
    cursor = database.hospitals_collection.find({"is_active": True}).sort("created_at", -1).skip(skip).limit(limit)
    
    for h in cursor:
        hospitals.append({
            "id": str(h["_id"]),
            **h
        })
    return hospitals

@app.get("/hospitals/{hospital_id}", response_model=models.HospitalResponse)
async def get_hospital(hospital_id: str, current_user: dict = Depends(get_current_user)):
    hospital = database.hospitals_collection.find_one({"_id": ObjectId(hospital_id), "is_active": True})
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    return {
        "id": str(hospital["_id"]),
        **hospital
    }

@app.delete("/admin/hospitals/{hospital_id}")
async def delete_hospital(hospital_id: str, admin: dict = Depends(get_admin_user)):
    result = database.hospitals_collection.update_one(
        {"_id": ObjectId(hospital_id)},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    return {"message": "Hospital deleted successfully"}

