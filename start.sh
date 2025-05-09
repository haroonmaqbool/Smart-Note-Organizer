#!/bin/bash

# Start backend server
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!

# Start frontend server
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

# Register the cleanup function for when the script receives a termination signal
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 