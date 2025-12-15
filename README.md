# Brain Tumor Detection System

A full-stack web application for detecting brain tumors from MRI scans using Deep Learning.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS v4, Framer Motion
- **Backend**: FastAPI, PyTorch (ResNet)
- **Database**: MongoDB Atlas
- **Model**: Pre-trained ResNet18/34

## Prerequisites
1. Node.js (v18+)
2. Python 3.9+
3. MongoDB Atlas Connection String (configured in `backend/config.py`)

## Quick Start

### 1. Backend Setup
The backend runs the FastAPI server and PyTorch model.

```bash
# Navigate to project root
cd /Users/abhijeetgolhar/Documents/Road2Tech/P8/Brain-Tumor-Detection

# Create/Activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies (first time only)
pip install -r backend/requirements.txt
# Ensure email-validator is installed
pip install email-validator

# Run the server
uvicorn backend.main:app --reload
```
Reference: Backend runs on `http://localhost:8000`

### 2. Frontend Setup
The frontend is built with Next.js.

```bash
# Open a new terminal
cd frontend

# Install dependencies (first time only)
npm install

# Run the development server
npm run dev
```
Reference: Frontend runs on `http://localhost:3000`

## Features
- **Secure Authentication**: User signup/login with JWT & MongoDB Atlas.
- **MRI Analysis**: Drag & drop MRI scans for instant tumor detection.
- **History Tracking**: View past predictions and confidence scores.
- **Premium UI**: Modern dark-themed interface with glassmorphism.

## Configuration
- **Database**: Connection string is in `backend/config.py`.
- **Model**: `image_classifier.pth` must be present in the root directory.
