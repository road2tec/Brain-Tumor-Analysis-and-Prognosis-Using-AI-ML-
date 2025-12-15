import google.generativeai as genai
from .config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

def get_treatment_plan(disease: str) -> str:
    """
    Generates a treatment plan for the given disease using Gemini API.
    """
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        prompt = f"Provide a comprehensive treatment plan for a patient diagnosed with {disease}. Include potential medical treatments, lifestyle changes, and follow-up care. Keep it concise but informative for a non-medical user."
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating treatment plan: {e}")
        return f"Unable to generate treatment plan at this time. Error: {str(e)}"
