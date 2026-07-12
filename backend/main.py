# backend/main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import json
import re

# --- CONFIGURE GEMINI ---
# Replace this with your actual Gemini API Key
GEMINI_API_KEY = "AQ.Ab8RN6KVYC6VbyDpS5F4Wu95bBfd-lxri3OnCtd88W7W4lnS8g" 
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="DiagnoSys Backend")

# --- CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat")
async def chat_endpoint(
    message: str = Form(...),
    patient_data: str = Form(...),
    file: UploadFile = File(None)
):
    try:
        # 1. Parse the patient context sent from the React modal
        patient = json.loads(patient_data)
        
        # 2. Construct the system prompt forcing a strict JSON output
        system_prompt = f"""
        You are DiagnoSys, a highly advanced medical AI.
        Patient Context: {patient['name']}, Age {patient['age']}, Sex: {patient['gender']}.
        Conditions: {patient.get('conditions', 'None')}. Meds: {patient.get('medications', 'None')}.
        
        CRITICAL INSTRUCTION: You MUST return your final response strictly as a valid JSON object. Do not include markdown code blocks.
        
        If an image (X-ray/scan) is provided, analyze it. If you detect a specific pathology or anomaly, estimate its bounding box coordinates as percentages (0-100) relative to the image dimensions. Also, provide a confidence score (0-100) for your detection.
        
        JSON Format Required:
        {{
            "reply": "Your detailed clinical markdown analysis here...",
            "box": {{"top": 30, "left": 40, "width": 25, "height": 20}}, // null if no anomaly
            "confidence": 94.5 // null if no anomaly
        }}
        """

        # 3. Dynamic Model Selector to bypass deprecation errors
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        
        if not available_models:
             raise Exception("No active generative models found.")
             
        target_model = next((name for name in available_models if 'flash' in name), available_models[0])
        model = genai.GenerativeModel(target_model)
        
        prompt_parts = [system_prompt, f"User Request: {message}"]

        # 4. Attach file if uploaded
        if file:
            file_bytes = await file.read()
            prompt_parts.append({
                "mime_type": file.content_type,
                "data": file_bytes
            })
            
        # 5. Send to Gemini
        response = model.generate_content(
            prompt_parts,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # 6. Safely parse the JSON out of Gemini's response
        
        data = json.loads(response.text)
        return data

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process the request with DiagnoSys.")



