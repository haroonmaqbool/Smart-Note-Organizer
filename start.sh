#!/bin/bash

# Exit on error
set -e

echo "Starting Smart Note Organizer Application..."

# Check if the required utilities are installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install Node.js and npm."
    exit 1
fi

if ! command -v python &> /dev/null; then
    echo "python is not installed. Please install Python 3.8 or later."
    exit 1
fi

# Detect OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    IS_WINDOWS=true
else
    IS_WINDOWS=false
fi

# Setup backend
echo "Setting up backend..."
cd backend
bash setup.sh
cd ..

# Setup frontend
echo "Setting up frontend..."
cd frontend
npm install
cd ..

# Start backend server in the background
echo "Starting backend server..."
cd backend
if [ "$IS_WINDOWS" = true ]; then
    # On Windows, start in a new window/terminal
    if command -v powershell &> /dev/null; then
        powershell -Command "Start-Process python -ArgumentList 'app.py'"
    else
        start cmd /c "venv\Scripts\activate.bat && python app.py"
    fi
else
    # On Unix-like systems
    source venv/bin/activate
    python app.py &
    BACKEND_PID=$!
fi
cd ..

# Start frontend server in the background
echo "Starting frontend server..."
cd frontend
if [ "$IS_WINDOWS" = true ]; then
    # On Windows, start in a new window/terminal
    if command -v powershell &> /dev/null; then
        powershell -Command "Start-Process npm -ArgumentList 'run', 'dev'"
    else
        start cmd /c "npm run dev"
    fi
else
    # On Unix-like systems
    npm run dev &
    FRONTEND_PID=$!
fi
cd ..

echo "Smart Note Organizer is running!"
echo "Frontend available at: http://localhost:5173"
echo "Backend API available at: http://localhost:5000"
echo ""

if [ "$IS_WINDOWS" = true ]; then
    echo "Press any key to exit (this will not stop the servers, which are running in separate windows)"
    read -n 1
else
    echo "Press Ctrl+C to stop all services"
    # Trap Ctrl+C to properly kill both services
    trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
    # Wait for both processes
    wait
fi 