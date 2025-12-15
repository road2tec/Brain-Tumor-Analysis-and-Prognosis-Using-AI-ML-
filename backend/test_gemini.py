import google.generativeai as genai

# Using the key provided by the user
GENAI_API_KEY = "AIzaSyCXvZUEE3ZjwEA57PayMNdduQ4Edl3o-G8"

genai.configure(api_key=GENAI_API_KEY)

try:
    print("Listing models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
            
    print("\nAttempting generation with gemini-flash-latest...")
    model = genai.GenerativeModel('gemini-flash-latest')
    response = model.generate_content("Hello, can you hear me?")
    print("Success:")
    print(response.text)
except Exception as e:
    print("\nError occurred:")
    print(e)
