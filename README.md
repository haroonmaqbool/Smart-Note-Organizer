# Smart Note Organizer

A full-stack application for organizing notes, creating flashcards, and managing study materials with AI-powered features.

## Features

- Rich text editor for creating and editing notes
- AI-powered summarization and tagging
- Flashcard generation from notes
- OCR for extracting text from images and PDFs
- Search functionality across notes and flashcards

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Smart-Note-Organizer.git
   cd Smart-Note-Organizer
   ```

2. Quick setup (installs all dependencies):
   ```
   npm run setup
   ```

   Or install dependencies manually:
   ```
   npm run install:all
   ```

### Running the Application

We provide several ways to run the application based on your operating system and preferences:

#### Option 1: Simple Batch File (Windows) - Recommended

Run the simplified batch file (works on all Windows systems):
```
simple-start.bat
```

#### Option 2: PowerShell Script (Windows)

For PowerShell users:
```
.\start-dev.ps1
```

#### Option 3: Using npm

Start backend and frontend separately:

For the backend:
```
cd backend
npm run dev
```

For the frontend (in a separate terminal):
```
cd frontend
npm run dev
```

### Accessing the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Architecture

- **Frontend**: React with TypeScript, Material UI, and Vite
- **Backend**: Node.js with Express
- **AI Features**: Natural language processing using Transformers.js

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/summarize` - Summarize text content
- `POST /api/tag` - Extract tags from text content
- `GET /api/search?q=query` - Search notes and flashcards
- `POST /api/upload` - Upload and process files (PDF, TXT, MD)
- `POST /api/chatbot` - Process content with AI to generate tags, flashcards, and summaries

## Troubleshooting

### Windows PowerShell Execution Policy

If you encounter issues running PowerShell scripts, you may need to adjust the execution policy:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### Command Syntax Errors

If you see errors related to command syntax (`&&` not working):
- Use the `simple-start.bat` script which uses simpler syntax
- Or run the commands separately in different terminals

### Port Already in Use

If you see a warning about ports already being in use:

1. Find the process using the port:
   - Windows: `netstat -ano | findstr :5000` or `netstat -ano | findstr :5173`
   - Linux/macOS: `lsof -i :5000` or `lsof -i :5173`

2. Stop the process:
   - Windows: `taskkill /PID <PID> /F`
   - Linux/macOS: `kill -9 <PID>`

3. Try running the application again

### Backend and Frontend Not Connecting

1. Make sure both services are running
2. Check if the backend is accessible at http://localhost:5000/api/health
3. Verify that the Vite proxy configuration is correct in `frontend/vite.config.ts`