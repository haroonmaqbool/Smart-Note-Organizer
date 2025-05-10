# Smart Note Organizer Backend

This is the Node.js backend for the Smart Note Organizer application. It provides API endpoints for note management, text summarization, tagging, and file uploads.

## Setup Instructions

1. Install dependencies:
```
npm install
```

2. Create a `.env` file in the backend directory with the following content:
```
PORT=5000
AI_MODEL=bart
# LLAMA_MODEL_NAME=Xenova/TinyLlama-1.1B-Chat-v1.0
# HUGGINGFACE_TOKEN=your_token_here
```

3. Start the development server:
```
npm run dev
```

4. For production use:
```
npm start
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/summarize` - Summarize text content
- `POST /api/tag` - Extract tags from text content
- `GET /api/search?q=query` - Search notes and flashcards
- `POST /api/upload` - Upload and process files (PDF, TXT, MD)

## Technologies Used

- Express.js - Web framework
- Natural - NLP library for text processing
- Transformers.js - Machine learning models for text generation and summarization
- PDF-lib - PDF processing
- Tesseract.js - OCR for scanned documents 