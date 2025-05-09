from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
from transformers import pipeline
import os
from dotenv import load_dotenv
import tempfile
from werkzeug.utils import secure_filename
import PyPDF2
import pytesseract
from PIL import Image
import io

# Set Tesseract path for Windows - modify this path to match your installation
tesseract_cmd = os.environ.get('TESSERACT_CMD', r'C:\Program Files\Tesseract-OCR\tesseract.exe')
if os.path.exists(tesseract_cmd):
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

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
    app.run(debug=True, port=5000) 