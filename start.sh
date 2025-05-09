#!/bin/bash

# Exit on error
set -e

echo "Starting Smart Note Organizer Application..."

# Check if the required utilities are installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install Node.js and npm."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "python3 is not installed. Please install Python 3.8 or later."
    exit 1
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
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Start frontend server in the background
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Smart Note Organizer is running!"
echo "Frontend available at: http://localhost:5173"
echo "Backend API available at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C to properly kill both services
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Wait for both processes
wait 