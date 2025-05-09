# Smart Note Organizer

A tool to organize, search, and summarize academic notes with AI-powered features like automatic tagging, summarization, and full-text search.

## Features

- **Rich-Text & PDF Import**: Upload text files or PDFs (including scanned documents with OCR support)
- **Auto-Tagging & Linking**: Automatically generate relevant tags using natural language processing
- **AI-Powered Summaries**: Generate concise summaries of lengthy notes
- **Hugging Face Llama Integration**: Option to use Llama models for tagging and summarization
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

### Configuration

Copy the example environment file and customize settings as needed:

```bash
cd backend
cp example.env .env
```

Key configuration options:
- `AI_MODEL`: Choose between 'bart' (default) or 'llama'
- `LLAMA_MODEL_NAME`: Specify which Hugging Face Llama model to use
- `HUGGINGFACE_TOKEN`: Add your Hugging Face token if using restricted models

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
3. **Select AI model**: Choose between BART or Llama model for AI operations
4. **Upload files**: Use the file upload button in the editor
5. **Auto-generate tags**: Write content and use the auto-tag feature or upload files
6. **Search notes**: Use the search page to find notes by tag or content

## AI Models

The application supports two AI models for summarization and tagging:

1. **BART** (default): Faster, lightweight model for general text processing
2. **Llama**: More powerful model from Meta AI, available in different sizes

To use Llama models:
- For public models like TinyLlama, no additional setup is needed
- For Meta's Llama models, you'll need a Hugging Face access token
- Set your token in the `.env` file as `HUGGINGFACE_TOKEN=your_token_here`

## Tech Stack

- **Frontend**: React, TypeScript, Material UI, CodeMirror
- **Backend**: Python, Flask, spaCy, Transformers, Hugging Face Models
- **Text Processing**: OCR (via Tesseract), PDF processing

## Development

### Backend API Endpoints

- `GET /api/health` - Check API status and current AI model
- `POST /api/summarize` - Generate summary from text, accepts `ai_model` parameter
- `POST /api/tag` - Extract tags from text, accepts `ai_model` parameter
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