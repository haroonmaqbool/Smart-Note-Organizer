from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import os
from dotenv import load_dotenv
import tempfile
from werkzeug.utils import secure_filename
import PyPDF2
import pytesseract
from PIL import Image
import io
import re

# Set Tesseract path for Windows - modify this path to match your installation
tesseract_cmd = os.environ.get('TESSERACT_CMD', r'C:\Program Files\Tesseract-OCR\tesseract.exe')
if os.path.exists(tesseract_cmd):
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading spaCy model...")
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Initialize summarization pipeline with BART
bart_summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# Configure Hugging Face authentication if token is provided
HF_TOKEN = os.environ.get('HUGGINGFACE_TOKEN')
if HF_TOKEN:
    print("Using Hugging Face authentication token")
    os.environ["HUGGINGFACE_TOKEN"] = HF_TOKEN
    
# Initialize Llama model from Hugging Face
LLAMA_MODEL_NAME = os.environ.get('LLAMA_MODEL_NAME', 'TinyLlama/TinyLlama-1.1B-Chat-v1.0')
print(f"Loading Llama model: {LLAMA_MODEL_NAME}")

try:
    # Use token if available - needed for protected models like meta-llama/Llama-2-7b-hf
    if HF_TOKEN and "meta-llama" in LLAMA_MODEL_NAME:
        llama_tokenizer = AutoTokenizer.from_pretrained(
            LLAMA_MODEL_NAME, 
            use_auth_token=HF_TOKEN
        )
        llama_model = AutoModelForCausalLM.from_pretrained(
            LLAMA_MODEL_NAME, 
            torch_dtype="auto",
            device_map="auto",
            use_auth_token=HF_TOKEN
        )
    else:
        llama_tokenizer = AutoTokenizer.from_pretrained(LLAMA_MODEL_NAME)
        llama_model = AutoModelForCausalLM.from_pretrained(
            LLAMA_MODEL_NAME, 
            torch_dtype="auto",
            device_map="auto"
        )
    print("Llama model loaded successfully")
except Exception as e:
    print(f"Error loading Llama model: {str(e)}")
    print("Make sure you have the right access permissions and token if using meta-llama models")
    llama_tokenizer = None
    llama_model = None

# Default to BART if Llama fails to load
AI_MODEL = os.environ.get('AI_MODEL', 'bart')
if AI_MODEL == 'llama' and llama_model is None:
    print("Falling back to BART model as Llama failed to load")
    AI_MODEL = 'bart'

print(f"Using AI model: {AI_MODEL}")

# Mock database for now
mock_database = {
    "notes": [
        {
            "id": "note1",
            "title": "Machine Learning Basics",
            "content": "Machine learning is a branch of artificial intelligence (AI) and computer science which focuses on the use of data and algorithms to imitate the way that humans learn, gradually improving its accuracy.",
            "summary": "Introduction to machine learning concepts including supervised and unsupervised learning.",
            "tags": ["ML", "AI", "data science"],
            "createdAt": "2025-05-01T10:00:00Z",
            "updatedAt": "2025-05-01T10:00:00Z"
        },
        {
            "id": "note2",
            "title": "Neural Networks",
            "content": "Neural networks are computing systems with interconnected nodes that work much like neurons in the human brain. Using algorithms, they can recognize hidden patterns and correlations in raw data, cluster and classify it, and continuously learn and improve over time.",
            "summary": "Deep dive into neural network architectures and training methods.",
            "tags": ["deep learning", "ML", "neural networks"],
            "createdAt": "2025-05-02T10:00:00Z",
            "updatedAt": "2025-05-02T10:00:00Z"
        },
        {
            "id": "note3",
            "title": "Python for Data Science",
            "content": "Python has become the standard language for data science due to its ease of use and powerful libraries like NumPy, Pandas, and Matplotlib. It allows for fast prototyping and has a vibrant community.",
            "summary": "Overview of Python libraries and tools for data analysis and machine learning.",
            "tags": ["Python", "data science", "programming"],
            "createdAt": "2025-05-03T10:00:00Z",
            "updatedAt": "2025-05-03T10:00:00Z"
        }
    ],
    "flashcards": [
        {
            "id": "flash1",
            "title": "ML Algorithms",
            "question": "What are the three main types of machine learning?",
            "answer": "Supervised learning, unsupervised learning, and reinforcement learning",
            "tags": ["ML", "algorithms"],
            "createdAt": "2025-05-04T10:00:00Z"
        },
        {
            "id": "flash2",
            "title": "Python Data Libraries",
            "question": "What are the primary Python libraries used for data manipulation?",
            "answer": "NumPy and Pandas",
            "tags": ["Python", "data science"],
            "createdAt": "2025-05-05T10:00:00Z"
        }
    ]
}

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "ai_model": AI_MODEL
    })

def generate_llama_response(prompt, max_length=100):
    """Generate a response using the Llama model"""
    if llama_model is None or llama_tokenizer is None:
        raise Exception("Llama model not available")
    
    inputs = llama_tokenizer(prompt, return_tensors="pt").to(llama_model.device)
    
    # Generate with some reasonable parameters
    outputs = llama_model.generate(
        inputs.input_ids,
        max_length=max_length,
        num_return_sequences=1,
        temperature=0.7,
        top_p=0.9,
        do_sample=True
    )
    
    response = llama_tokenizer.decode(outputs[0], skip_special_tokens=True)
    # Strip the prompt from the response
    if response.startswith(prompt):
        response = response[len(prompt):].strip()
    
    return response

@app.route('/api/summarize', methods=['POST'])
def summarize_text():
    data = request.json
    text = data.get('text', '')
    ai_model = data.get('ai_model', AI_MODEL)  # Allow override in request
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        if ai_model == 'llama':
            if llama_model is None:
                return jsonify({"error": "Llama model not available"}), 500
                
            prompt = f"Please summarize the following text:\n\n{text}\n\nSummary:"
            summary = generate_llama_response(prompt, max_length=min(len(text)//2, 150))
            return jsonify({"summary": summary, "model_used": "llama"})
        else:
            # Use BART (default)
            summary = bart_summarizer(text, max_length=130, min_length=30, do_sample=False)
            return jsonify({"summary": summary[0]['summary_text'], "model_used": "bart"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tag', methods=['POST'])
def tag_text():
    data = request.json
    text = data.get('text', '')
    ai_model = data.get('ai_model', AI_MODEL)  # Allow override in request
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        if ai_model == 'llama' and llama_model is not None:
            prompt = f"Extract relevant tags and keywords from this text. Return only a comma-separated list of tags:\n\n{text}\n\nTags:"
            tags_text = generate_llama_response(prompt)
            # Clean and parse the response
            tags = [tag.strip() for tag in tags_text.split(',') if tag.strip()]
            return jsonify({"tags": tags, "model_used": "llama"})
        else:
            # Use spaCy (default)
            doc = nlp(text)
            tags = [ent.text for ent in doc.ents] + [chunk.text for chunk in doc.noun_chunks]
            return jsonify({"tags": list(set(tags)), "model_used": "spacy"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/search', methods=['GET'])
def global_search():
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({"results": []}), 200
    
    try:
        # In a production app, this would search in a database
        # For now, we'll search through our mock database
        
        results = []
        query = query.lower()
        
        # Search notes
        for note in mock_database["notes"]:
            score = calculate_search_score(note, query)
            if score > 0:
                results.append({
                    "id": note["id"],
                    "title": note["title"],
                    "summary": note["summary"],
                    "tags": note["tags"],
                    "type": "note",
                    "matchScore": score
                })
        
        # Search flashcards
        for card in mock_database["flashcards"]:
            score = calculate_flashcard_score(card, query)
            if score > 0:
                results.append({
                    "id": card["id"],
                    "title": card["title"],
                    "question": card["question"],
                    "answer": card["answer"],
                    "tags": card["tags"],
                    "type": "flashcard",
                    "matchScore": score
                })
        
        # Sort results by match score (descending)
        results = sorted(results, key=lambda x: x["matchScore"], reverse=True)
        
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def calculate_search_score(note, query):
    """Calculate a search relevance score for a note based on query."""
    score = 0
    
    # Check title match (highest weight)
    if query in note["title"].lower():
        score += 0.4
    
    # Check tag matches
    for tag in note["tags"]:
        if query in tag.lower():
            score += 0.25
            break
    
    # Check content match
    if query in note["content"].lower():
        score += 0.2
    
    # Check summary match
    if query in note["summary"].lower():
        score += 0.15
    
    # Additional scoring based on keyword density could be implemented here
    
    return score

def calculate_flashcard_score(card, query):
    """Calculate a search relevance score for a flashcard based on query."""
    score = 0
    
    # Check title match
    if query in card["title"].lower():
        score += 0.3
    
    # Check question match (high weight)
    if query in card["question"].lower():
        score += 0.4
    
    # Check answer match
    if query in card["answer"].lower():
        score += 0.2
    
    # Check tag matches
    for tag in card["tags"]:
        if query in tag.lower():
            score += 0.1
            break
    
    return score

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    try:
        filename = secure_filename(file.filename)
        file_ext = os.path.splitext(filename)[1].lower()
        
        if file_ext == '.pdf':
            # Process PDF file
            text = extract_text_from_pdf(file)
        elif file_ext == '.txt' or file_ext == '.md':
            # Process text file
            text = file.read().decode('utf-8')
        else:
            return jsonify({"error": "Unsupported file type. Please upload .txt, .md, or .pdf file"}), 400
            
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def extract_text_from_pdf(file):
    """Extract text from a PDF file, including scanned documents using OCR if needed."""
    text = ""
    
    # Create a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
        file.save(temp_file.name)
        
        # Try to extract text directly
        with open(temp_file.name, 'rb') as pdf_file:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                
                # If page has no text (might be a scanned page), try OCR
                if not page_text or len(page_text.strip()) < 20:
                    try:
                        # Convert PDF page to image
                        images = convert_pdf_to_images(temp_file.name, page_num)
                        
                        # Perform OCR on the image if Tesseract is available
                        if hasattr(pytesseract.pytesseract, 'tesseract_cmd') and \
                           os.path.exists(pytesseract.pytesseract.tesseract_cmd):
                            for img in images:
                                page_text += pytesseract.image_to_string(img)
                        else:
                            page_text += "[OCR unavailable: Tesseract not installed]"
                    except Exception as e:
                        print(f"OCR error: {str(e)}")
                
                text += page_text + "\n\n"
        
        # Remove the temporary file
        os.unlink(temp_file.name)
        
    return text

def convert_pdf_to_images(pdf_path, page_num):
    """Convert a PDF page to images for OCR processing."""
    # This is a placeholder function
    # In a real implementation, you would use a library like pdf2image
    # For simplicity, we're returning an empty list here
    try:
        # Check if pdf2image is available (optional enhancement)
        import importlib.util
        if importlib.util.find_spec("pdf2image") is not None:
            # Use pdf2image if available
            from pdf2image import convert_from_path
            return convert_from_path(pdf_path, first_page=page_num+1, last_page=page_num+1)
        else:
            return []
    except ImportError:
        return []

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 