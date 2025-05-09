from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
from transformers import pipeline
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading spaCy model...")
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Initialize summarization pipeline
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

@app.route('/api/summarize', methods=['POST'])
def summarize_text():
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        summary = summarizer(text, max_length=130, min_length=30, do_sample=False)
        return jsonify({"summary": summary[0]['summary_text']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tag', methods=['POST'])
def tag_text():
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        doc = nlp(text)
        # Extract named entities and noun phrases as tags
        tags = [ent.text for ent in doc.ents] + [chunk.text for chunk in doc.noun_chunks]
        return jsonify({"tags": list(set(tags))})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 