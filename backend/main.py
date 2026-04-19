import io
import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
from PIL import Image
from google import genai

from dotenv import load_dotenv
load_dotenv()

# The client gets the API key from the environment variable `GEMINI_API_KEY`.
client = genai.Client()

# 1. Initialize FastAPI
app = FastAPI(title="Recycling Identification API")

# 2. Add CORS Middleware (Crucial for React/Vite)
# This allows your frontend at port 5173 to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace "*" with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Load the AI Model (Load once at startup for speed)
print("Loading model...")
classifier = pipeline("image-classification", model="microsoft/resnet-50")
print("Model loaded successfully!")

# Category mapping and instructions
CATEGORY_MAPPING = {
    "recyclable": {
        "keywords": ["bottle", "can", "aluminum", "plastic", "glass", "cardboard", "box", "paper", "tin"],
        "instructions": "Rinse and place in your recycling bin. Make sure it's clean and dry."
    },
    "compost": {
        "keywords": ["banana", "peel", "fruit", "vegetable", "leaf", "leaves", "coffee", "grounds", "organic"],
        "instructions": "Place in your compost bin. Great for your garden or compost pile."
    },
    "landfill": {
        "keywords": ["chip", "bag", "plastic bag", "styrofoam", "foam", "wrapper", "laminated", "mixed material"],
        "instructions": "Most mixed materials go to landfill. Dispose in your regular trash bin."
    },
    "hazardous": {
        "keywords": ["battery", "chemical", "oil", "paint", "solvent", "hazard", "toxic", "electronic", "bulb"],
        "instructions": "Take to a hazardous waste collection facility. Do not dispose in regular trash."
    }
}

def classify_item(label: str) -> tuple[str, str]:
    """Map item label to category and get instructions"""
    label_lower = label.lower()
    response = client.models.generate_content(
        model="gemini-3-flash-preview", contents=f'Explain how to recycle {label} properly in no more than 2 sentences'
    )
    
    response = "responseresponseresponse"
    for category, data in CATEGORY_MAPPING.items():
        if any(keyword in label_lower for keyword in data["keywords"]):
            print(response)
            return category, response
    
    # Default to landfill if no match
    return "landfill", response

@app.get("/")
def home():
    return {"status": "Backend is running!"}

@app.post("/identify")
async def identify_material(file: UploadFile = File(...)):
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        # Read the file contents into memory
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        response = client.models.generate_content(
            model="gemini-3-flash-preview", contents=["Identify this object as a recyclable/non-recycleable category, in no more than 2 sentences", image]
        )
        response = "iamtexiamtexiamtexiamtexiamtex"
        print(response)

        # Run the classification model
        results = classifier(image)

        # Extract top prediction
        if results and len(results) > 0:
            top_prediction = results[0]
            item_label = top_prediction["label"]
            confidence_score = top_prediction["score"]
            
            # Classify into category
            category, instructions = classify_item(item_label)
            
            # Return formatted result to frontend
            return {
                "category": category,
                "item": item_label,
                "confidence": int(confidence_score * 100),  # Convert to percentage
                "instructions": instructions
            }
        else:
            raise HTTPException(status_code=400, detail="Could not classify image")
            
    except Exception as e:
        import traceback
        traceback.print_exc()  # prints full stack trace to terminal
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Start the server on http://localhost:8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
