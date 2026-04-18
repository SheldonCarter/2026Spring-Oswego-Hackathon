from transformers import pipeline
from PIL import Image
from fastapi import FastAPI


app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hi"}



# 1. Initialize the classifier with a specific ResNet-50 model
# This will download the model automatically the first time you run it
classifier = pipeline("image-classification", model="microsoft/resnet-50")

# 2. Load your image (replace with your file path)
image = Image.open("/home/sheldon/Documents/GitHub/2026Spring-Oswego-Hackathon/images/Image.png")

# 3. Run the scan
results = classifier(image)

# 4. Print the top results
for result in results:
    print(f"Material: {result['label']}, Confidence: {result['score']:.4f}")

