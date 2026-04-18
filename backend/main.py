import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
from PIL import Image

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

        # Run the classification model
        results = classifier(image)

        # Return results to the frontend
        return {
            "filename": file.filename,
            "predictions": results
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Start the server on http://localhost:8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
