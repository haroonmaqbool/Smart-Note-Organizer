#!/bin/bash

# Exit on error
set -e

# Detect OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    IS_WINDOWS=true
    echo "Detected Windows environment"
else
    IS_WINDOWS=false
    echo "Detected Unix-like environment"
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
if [ "$IS_WINDOWS" = true ]; then
    # On Windows
    echo "Activating Windows virtual environment..."
    # Try different activation scripts since paths can vary
    if [ -f "./venv/Scripts/activate" ]; then
        source ./venv/Scripts/activate
    elif [ -f "./venv/bin/activate" ]; then
        source ./venv/bin/activate
    else
        echo "Warning: Could not find activation script. Continuing anyway..."
    fi
else
    # On Unix-like systems
    echo "Activating Unix virtual environment..."
    source venv/bin/activate
fi

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

# Download spaCy model
echo "Downloading spaCy model..."
python -m spacy download en_core_web_sm

if [ "$IS_WINDOWS" = true ]; then
    echo "Setup complete! Run 'venv\\Scripts\\activate.bat && python app.py' to start the backend server."
else
    echo "Setup complete! Run 'source venv/bin/activate && python app.py' to start the backend server."
fi 

