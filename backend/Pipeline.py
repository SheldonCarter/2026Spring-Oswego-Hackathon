from transformers import pipeline
from PIL import Image
from fastapi import FastAPI


app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hi"}




classifier = pipeline("image-classification", model="microsoft/resnet-50")


image = Image.open("/Users/minphonemaw/Developer/Hack/2026Spring-Oswego-Hackathon/photos/Image.png")


results = classifier(image)

for result in results:
    print(f"Material: {result['label']}, Confidence: {result['score']:.4f}")