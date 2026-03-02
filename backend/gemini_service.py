import time
import json
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import google.api_core.exceptions
from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

# Fallback data for common tumor types in case API fails
FALLBACK_DATA = {
    "Meningioma": {
        "symptoms": [
            "Slow-growing, often asymptomatic initially",
            "Headaches that worsen over time",
            "Vision changes (blurring or double vision)",
            "Hearing loss or ringing in ears",
            "Memory loss or personality changes"
        ],
        "treatment_plan": [
            "Observation (for small, asymptomatic tumors)",
            "Surgical resection (primary treatment)",
            "Radiation therapy (for residual or aggressive tumors)",
            "Regular follow-up MRI scans"
        ],
        "prevention": [
            "Limit unnecessary exposure to ionizing radiation (especially to the head)",
            "Maintain a healthy lifestyle and regular check-ups",
            "Monitor any sudden neurological changes"
        ],
        "guidelines": [
            "Consult a neurosurgeon for surgical evaluation",
            "Join a support group for brain tumor patients",
            "Keep a symptom diary to track changes"
        ]
    },
    "Glioma": {
        "symptoms": [
            "Frequent and severe headaches",
            "Seizures",
            "Nausea or vomiting",
            "Cognitive decline (confusion, memory issues)",
            "Difficulty with balance or coordination"
        ],
        "treatment_plan": [
            "Maximal safe surgical resection",
            "Chemotherapy (e.g., Temozolomide)",
            "Radiation therapy",
            "Targeted drug therapies and clinical trials"
        ],
        "prevention": [
            "Avoid exposure to high-level radiation",
            "Genetic counseling for family history of brain tumors",
            "Early diagnostic testing if persistent symptoms occur"
        ],
        "guidelines": [
            "Work with a multidisciplinary oncology team",
            "Prioritize rest and nutritional support",
            "Discuss long-term care and rehabilitation options"
        ]
    },
    "Pituitary": {
        "symptoms": [
            "Hormonal imbalances (irregular periods, growth issues)",
            "Vision loss (especially peripheral vision)",
            "Unexplained weight gain or loss",
            "Fatigue and weakness",
            "Persistent headaches"
        ],
        "treatment_plan": [
            "Transsphenoidal surgery (through the nose)",
            "Hormone replacement therapy",
            "Medication to shrink the tumor (e.g., Dopamine agonists)",
            "Stereotactic Radiosurgery"
        ],
        "prevention": [
            "Regular screenings if there is a family history of MEN1 syndrome",
            "Promptly address any sudden hormonal or vision changes"
        ],
        "guidelines": [
            "Regular consultations with an Endocrinologist",
            "Annual vision testing and hormone level checks",
            "Wear a medical alert bracelet if on hormone replacement"
        ]
    }
}

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((google.api_core.exceptions.ResourceExhausted, google.api_core.exceptions.ServiceUnavailable)),
    reraise=True
)
def fetch_from_gemini(disease: str):
    """Internal function to call Gemini with retries."""
    model = genai.GenerativeModel('gemini-flash-latest')
    prompt = f"""
    Provide detailed medical information for a patient diagnosed with {disease} Brain Tumor. 
    Return the information in valid JSON format with the following keys:
    "symptoms": ["symptom 1", "symptom 2", ...],
    "treatment_plan": ["step 1", "step 2", ...],
    "prevention": ["tip 1", "tip 2", ...],
    "guidelines": ["guideline 1", "guideline 2", ...]
    
    Keep each item concise but informative. Do not use markdown formatting (like **) inside the strings.
    Ensure the response is a valid JSON object.
    """
    response = model.generate_content(prompt)
    return response.text

def get_analysis_details(disease: str) -> dict:
    """
    Generates a comprehensive analysis for the given disease using Gemini API,
    with retries and static fallbacks for reliability.
    """
    try:
        # Step 1: Attempt to fetch from Gemini
        text = fetch_from_gemini(disease)
        
        # Step 2: Parse the response
        # Clean up code blocks if Gemini returns them
        clean_text = text.replace('```json', '').replace('```', '').strip()
        
        try:
            details = json.loads(clean_text)
        except json.JSONDecodeError:
            # If JSON parsing fails, log it and throw to trigger fallback
            print(f"Failed to parse JSON from Gemini: {text}")
            raise Exception("Invalid JSON response")

        # Ensure all keys exist
        required_keys = ["symptoms", "treatment_plan", "prevention", "guidelines"]
        for key in required_keys:
            if key not in details:
                details[key] = ["Information not available."]
            elif isinstance(details[key], str):
                # Handle case where Gemini might return a single string instead of list
                details[key] = [details[key]]
                
        return details
        
    except (google.api_core.exceptions.ResourceExhausted, Exception) as e:
        print(f"Gemini API Error (using fallback if available): {e}")
        
        # Step 3: Check for fallback for common diseases
        for key in FALLBACK_DATA:
            if key.lower() in disease.lower():
                print(f"Using static fallback for {key}")
                return FALLBACK_DATA[key]
        
        # Step 4: Final generic error response
        return {
            "symptoms": ["Gemini API is currently at capacity or unavailable."],
            "treatment_plan": ["Please consult a medical professional for a detailed plan."],
            "prevention": ["Stay informed through verified medical journals."],
            "guidelines": ["Monitor your symptoms closely and report changes to your doctor."]
        }
