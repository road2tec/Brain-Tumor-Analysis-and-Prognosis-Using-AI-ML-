# Brain Tumor Analysis and Prognosis using AI & ML

A sophisticated, full-stack web application designed to assist medical professionals and patients in the early detection and analysis of brain tumors using advanced Deep Learning models. The system features a comprehensive role-based dashboard for Admins, Doctors, and Patients.

---

## 🚀 Key Features

### 🧠 Advanced AI Analysis
- **Deep Learning Model**: Utilizes a pre-trained ResNet (ResNet18/34) architecture for high-accuracy tumor classification.
- **Tumor Classes**: Detects and classifies tumors into four categories:
  - Glioma
  - Meningioma
  - Pituitary
  - No Tumor
- **Real-time Prediction**: Instant analysis of uploaded MRI scans with confidence scores.
- **Generative AI Integration**: Powered by Google Gemini to provide detailed explanations and context for the analysis results.

### 👥 Role-Based Access Control
The application provides distinct interfaces and functionalities for different user roles:

#### 1. 🏥 Admin Panel
- **Dashboard Overview**: Real-time statistics on users, doctors, appointments, and predictions.
- **Doctor Management**: Add, verify, and manage doctor profiles with specific expertise.
- **User Management**: Monitor and manage patient accounts.
- **Appointment Oversight**: View system-wide appointment schedules.

#### 2. 👨‍⚕️ Doctor Portal
- **Dashboard**: personalized view of upcoming appointments and patient requests.
- **Availability Management**: Set and update consultation hours and availability slots.
- **Patient Review**: Access patient MRI history and prediction reports.
- **Appointment Handling**: confirm, reject, or mark appointments as completed.

#### 3. 👤 Patient Portal
- **MRI Upload & Analysis**: Easy-to-use interface for uploading MRI scans for immediate AI analysis.
- **Smart Recommendations**: Get automated doctor recommendations based on the tumor type detected.
- **Appointment Booking**: Browse available specialists and book appointments seamlessly.
- **Medical History**: Securely store and view past predictions and appointment history.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: custom components with [Lucide React](https://lucide.dev/) icons
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth interactions
- **State Management**: React Hooks & Context API

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Machine Learning**: [PyTorch](https://pytorch.org/), Torchvision
- **AI Integration**: Google Generative AI (Gemini)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) (via PyMongo)
- **Authentication**: JWT (JSON Web Tokens) with `python-jose` and `passlib`

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18 or higher
- **Python**: v3.9 or higher
- **MongoDB Atlas Account**: You will need a connection string.
- **Google Gemini API Key**: For the generative AI features.

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Brain-Tumor-Analysis-and-Prognosis-Using-AI-ML-.git
cd Brain-Tumor-Analysis-and-Prognosis-Using-AI-ML-
```

### 2. Backend Setup
Navigate to the backend directory and set up the Python environment.

```bash
# Move to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload
```


**Configuration**:
Create a `.env` file in the `backend` directory (or update `backend/config.py`) with your credentials:
```env
MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GEMINI_API_KEY=your_gemini_api_key
```

**Run the Backend Server**:
```bash
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory.

```bash
# Move to frontend directory
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
The application will be available at `http://localhost:3000`.

---

## 📖 Usage Guide

### Admin Access
- **Default Login**: Use the pre-configured admin credentials (likely created on first run or seeded in database).
- **Manage Doctors**: Create new doctor accounts. The system will generate a temporary password for them.

### Doctor Workflow
1. Log in with credentials provided by the Admin.
2. Go to **Profile** to update details and specialization.
3. Set **Availability** slots for appointments.
4. Monitor the **Dashboard** for new appointment requests.

### Patient Workflow
1. Sign up for a new account.
2. Navigate to **Analysis** to upload an MRI image.
3. View the AI prediction results.
4. If a tumor is detected, use the **Book Appointment** feature to find a specialist.

---

## 📂 Project Structure

```
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── ml_model.py          # PyTorch model loading and inference logic
│   ├── models.py            # Pydantic models & Database schemas
│   ├── auth.py              # Authentication logic (JWT)
│   ├── gemini_service.py    # Google Gemini AI integration
│   ├── requirements.txt     # Python dependencies
│   └── ...
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   │   ├── admin/           # Admin dashboard pages
│   │   ├── doctor/          # Doctor dashboard pages
│   │   ├── dashboard/       # Patient dashboard pages
│   │   └── page.tsx         # Landing page
│   ├── components/          # Reusable UI components
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   └── ...
├── image_classifier.pth     # Trained PyTorch Model
└── README.md                # Project Documentation
```

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

