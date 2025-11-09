from flask import Flask, request, jsonify, render_template
from transformers import pipeline
from PIL import Image
from io import BytesIO
import requests
from werkzeug.utils import secure_filename

app = Flask(__name__)

text_classifier = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")
image_classifier = pipeline("image-classification", model="google/vit-base-patch16-224")

OPENWEATHER_API = "f6de11094e2d691ea6d78bb2e38e4348"

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/resqforce")
def resqforce():
    return render_template("resqforce.html")

@app.route("/tmobile")
def tmobile():
    return render_template("tmobile.html")

@app.route("/analyze-text", methods=["POST"])
def analyze_text():
    text = request.json["text"]
    result = text_classifier(text)[0]
    return jsonify({"label": result["label"], "score": round(result["score"], 3)})

@app.route("/analyze-image", methods=["POST"])
def analyze_image():
    image_url = request.json["image_url"]
    response = requests.get(image_url)
    response.raise_for_status()
    image = Image.open(BytesIO(response.content))
    result = image_classifier(image)[0]
    return jsonify({"label": result["label"], "score": round(result["score"], 3)})

@app.route("/analyze-image-file", methods=["POST"])
def analyze_image_file():
    file = request.files["image_file"]
    image = Image.open(file.stream)
    result = image_classifier(image)[0]
    return jsonify({
        "label": result["label"],
        "score": round(result["score"], 3)
    })    

@app.route("/predict-risk", methods=["GET"])
def predict_risk():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    weather = requests.get(f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API}").json()
    rainfall = weather.get("rain", {}).get("1h", 0)
    risk = "LOW"
    if rainfall > 10:
        risk = "HIGH"
    elif rainfall > 5:
        risk = "MEDIUM"
    return jsonify({"location": [lat, lon], "rainfall": rainfall, "predicted_risk": risk})

if __name__ == "__main__":
    app.run(debug=True)
