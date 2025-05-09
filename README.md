# Smart Note Organizer

A tool to organize, search, and summarize academic notes with AI-powered features like automatic tagging, summarization, and full-text search.

## Features

- **Rich-Text & PDF Import**: Upload text files or PDFs (including scanned documents with OCR support)
- **Auto-Tagging & Linking**: Automatically generate relevant tags using natural language processing
- **AI-Powered Summaries**: Generate concise summaries of lengthy notes
- **Global Search**: Search across tags, keywords, and summaries in one interface
- **Flashcard Export**: Export key note highlights for better studying

## Setup and Installation

### Prerequisites

- Node.js (v16 or newer)
- Python 3.8+ with pip
- Git

### Clone the Repository

```bash
git clone https://github.com/yourusername/Smart-Note-Organizer.git
cd Smart-Note-Organizer
```

### Running the Application

The easiest way to run the application is with the provided start script:

```bash
# Make the script executable (on Linux/Mac)
chmod +x start.sh

# Run the application
./start.sh
```

On Windows, you might need to run:

```bash
bash start.sh
```

### Manual Setup

If you prefer to set up each part manually:

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python app.py
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. **Access the application**: Open `http://localhost:5173` in your browser
2. **Create a new note**: Navigate to the Editor page
3. **Upload files**: Use the file upload button in the editor
4. **Auto-generate tags**: Write content and use the auto-tag feature or upload files
5. **Search notes**: Use the search page to find notes by tag or content

## Tech Stack

- **Frontend**: React, TypeScript, Material UI, CodeMirror
- **Backend**: Python, Flask, spaCy, Transformers
- **Text Processing**: OCR (via Tesseract), PDF processing

## Development

### Backend API Endpoints

- `GET /api/health` - Check API status
- `POST /api/summarize` - Generate summary from text
- `POST /api/tag` - Extract tags from text
- `POST /api/upload` - Process uploaded files

### Frontend Development

```bash
cd frontend
npm run dev
```

### Backend Development

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

## License

MIT