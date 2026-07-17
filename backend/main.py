# backend/main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import json
import re
import os
from dotenv import load_dotenv

load_dotenv()

# ---  GEMINI CONFIGURATION ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
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
    scan_type: str = Form("X-Ray"),
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
        Current target diagnostic modality: {scan_type}.
        """
        if scan_type == "PET Scan":
            system_prompt += """
        CRITICAL DIRECTIVE: The asset provided is a metabolic Positron Emission Tomography array. 
        Focus your spatial analysis on areas showing hyper-metabolic activity or extreme radiotracer accumulation (e.g., FDG avid tracking regions).
        Correlate metabolic concentrations with structural anatomy. If a region indicates abnormal uptake, estimate its bounding box coordinates.
        """
        elif scan_type == "MRI":
            system_prompt += "\nFocus analysis on soft-tissue structural detail, contrast modifications, and fluid accumulations."
        elif scan_type == "X-Ray":
            system_prompt += "\nFocus analysis on bone structural density, pulmonary opacities, and standard macro skeleton anatomy."
        else:
            system_prompt += "\nThe user has provided a medical document, lab report, or general text inquiry. Do NOT perform image-based modality analysis. Focus purely on the data/text provided."
        # 4. Enforce strict JSON output (Crucial for the React frontend)
        system_prompt += """
        
        CRITICAL INSTRUCTION: You MUST return your final response strictly as a valid JSON object. 
        Do NOT include any comments (like //) in the JSON.
        Do NOT use raw line breaks or unescaped double quotes inside your "reply" string. Use the literal characters \\n for newlines and use single quotes ('') for quotations.
        
        If an image is provided, analyze it based on the modality instructions above. If you detect a specific pathology or anomaly, estimate its bounding box coordinates as percentages (0-100).
        
        JSON Format Required:
        {
            "reply": "Your detailed clinical analysis here... Use \\n for new lines. Do not use actual line breaks.",
            "box": {"top": 30, "left": 40, "width": 25, "height": 20},
            "confidence": 94.5
        }
        
        If there is no anomaly detected, or if the user uploaded a standard text document, set "box" and "confidence" to null.
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
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        try:
            data = json.loads(raw_text.strip())
            return data
        except json.JSONDecodeError as e:
            # If Gemini ruins the JSON formatting, print it to the terminal so you can see what went wrong...
            print(f"\n--- JSON FORMATTING ERROR ---")
            print(f"Raw output from Gemini:\n{raw_text}")
            print(f"-----------------------------\n")
            
            # ...but return a safe fallback message to the frontend so your app DOES NOT CRASH!
            return {
                "reply": "⚠️ **Analysis Processed but Formatting Failed.** The AI generated a response, but it contained an invalid character that couldn't be parsed. Please hit send to try again.",
                "box": None,
                "confidence": None
            }

    except Exception as e:
        error_msg = str(e)
        print(f"Error: {error_msg}")
        if "429" in error_msg or "Quota" in error_msg:
            return {
                "reply": "⚠️ **Server Cooldown Active:** DiagnoSys is currently handling maximum capacity requests to prevent server overload. Please wait approximately 40 seconds and try your request again.",
                "box": None,
                "confidence": None
            }
        raise HTTPException(status_code=500, detail="Failed to process the request with DiagnoSys.")


