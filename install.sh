#!/bin/bash

echo "========================================"
echo "Installing Smart Note Organizer with Llama Support"
echo "========================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
fi

# Create and activate Python virtual environment
echo "Setting up Python virtual environment..."
cd backend
python3 -m venv venv

# Activate virtual environment based on platform
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Download spaCy model
echo "Downloading spaCy language model..."
python -m spacy download en_core_web_sm

# Create environment file
echo "Creating environment configuration..."
if [ ! -f .env ]; then
    cp example.env .env
    echo "Created .env file. You may want to edit it to configure Llama model options."
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm install

echo "========================================"
echo "Installation complete!"
echo ""
echo "To start the application:"
echo "1. In one terminal: cd backend && source venv/bin/activate && python app.py"
echo "2. In another terminal: cd frontend && npm run dev"
echo ""
echo "For Llama model configuration, edit the backend/.env file"
echo "========================================" 