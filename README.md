# Smart Note Organizer

A web-based application for importing, organizing, searching, and summarizing academic notes using OCR, NLP, and LLM technologies.

## Features

- 📝 Rich-text and PDF import with OCR support
- 🏷️ Automatic tagging and linking of related notes
- 🤖 AI-powered summaries using Hugging Face Transformers
- 🔍 Global search across tags and content
- 📚 Flashcard export for spaced repetition learning

## Tech Stack

### Frontend
- React.js with TypeScript
- Material-UI for components
- CodeMirror for rich text editing
- Tesseract.js for OCR
- PDF.js for PDF handling

### Backend
- Python Flask
- spaCy for NLP
- Hugging Face Transformers
- Local storage with IndexedDB

## Setup Instructions

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Download spaCy model:
   ```bash
   python -m spacy download en_core_web_sm
   ```
5. Start the Flask server:
   ```bash
   python app.py
   ```

## Development

- Frontend runs on `http://localhost:5173`
- Backend API runs on `http://localhost:5000`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License