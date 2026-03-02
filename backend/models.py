from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, time
from enum import Enum

# User Models
class UserLocation(BaseModel):
    latitude: float
    longitude: float
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[UserLocation] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = "user"
    user_id: Optional[str] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = "user"

class PredictionResponse(BaseModel):
    id: str
    filename: str
    prediction: str
    confidence: float
    timestamp: datetime
    suggested_doctors: Optional[List[dict]] = []

class UserInDB(BaseModel):
    name: str
    email: str
    hashed_password: str
    role: str = "user"  # user, doctor, admin
    is_active: bool = True

class TreatmentRequest(BaseModel):
    disease: str

class TreatmentResponse(BaseModel):
    disease: str
    treatment_plan: List[str]
    symptoms: Optional[List[str]] = None
    prevention: Optional[List[str]] = None
    guidelines: Optional[List[str]] = None

# Doctor Models
class DoctorCreate(BaseModel):
    name: str
    email: EmailStr
    speciality: str
    experience: int
    expert_in: List[str] = []  # ["Glioma", "Meningioma", "Pituitary"]
    hospital_id: str

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    speciality: Optional[str] = None
    experience: Optional[int] = None
    expert_in: Optional[List[str]] = None
    hospital_id: Optional[str] = None

class DoctorResponse(BaseModel):
    id: str
    name: str
    email: str
    speciality: str
    experience: int
    expert_in: List[str]
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    is_active: bool
    temp_password: Optional[str] = None  # For admin to view password

class DoctorInDB(BaseModel):
    name: str
    email: str
    hashed_password: str
    role: str = "doctor"
    speciality: str
    experience: int
    expert_in: List[str] = []
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    is_active: bool = True

class DoctorWithDistance(BaseModel):
    id: str
    name: str
    email: str
    speciality: str
    experience: int
    expert_in: List[str]
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    hospital_city: Optional[str] = None
    hospital_location: Optional[dict] = None
    distance_km: Optional[float] = None
    is_active: bool


# Availability Models
class TimeSlot(BaseModel):
    start_time: str  # "09:00"
    end_time: str    # "10:00"

class AvailabilityCreate(BaseModel):
    doctor_id: Optional[str] = None
    day_of_week: int  # 0=Monday, 6=Sunday
    slots: List[TimeSlot]

class AvailabilityResponse(BaseModel):
    id: str
    doctor_id: str
    doctor_name: str
    day_of_week: int
    slots: List[TimeSlot]

# Appointment Models
class AppointmentCreate(BaseModel):
    doctor_id: str
    appointment_date: str  # "2024-02-10"
    slot: TimeSlot
    reason: Optional[str] = None
    tumor_type: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: str  # pending, confirmed, rejected, completed

class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    patient_email: str
    doctor_id: str
    doctor_name: str
    appointment_date: str
    slot: TimeSlot
    status: str
    reason: Optional[str] = None
    tumor_type: Optional[str] = None
    created_at: datetime

# Admin Models
class UserStatusUpdate(BaseModel):
    is_active: bool

class DoctorPasswordResponse(BaseModel):
    email: str
    password: str
    message: str


class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    total_doctors: int
    active_doctors: int
    total_hospitals: int
    active_hospitals: int
    total_appointments: int
    pending_appointments: int
    total_predictions: int

# Hospital Models
# Hospital Models
class HospitalType(str, Enum):
    GOVERNMENT = "Government"
    PRIVATE = "Private"
    TRUST = "Trust"

class HospitalLocation(BaseModel):
    latitude: float
    longitude: float
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None

class HospitalInfrastructure(BaseModel):
    total_beds: Optional[int] = 0
    icu_beds: Optional[int] = 0
    ventilators: Optional[int] = 0

class HospitalCreate(BaseModel):
    hospital_name: str
    hospital_type: HospitalType
    registration_number: str
    emergency_available: bool = False
    is_24x7: bool = False
    location: HospitalLocation
    infrastructure: HospitalInfrastructure
    ip_address: Optional[str] = None # Keeping for legacy support if needed
    other_info: Optional[str] = None

class HospitalResponse(BaseModel):
    id: str
    hospital_name: str
    hospital_type: HospitalType
    registration_number: str
    emergency_available: bool
    is_24x7: bool
    hospital_image: Optional[str] = None
    location: HospitalLocation
    infrastructure: HospitalInfrastructure
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    other_info: Optional[str] = None


