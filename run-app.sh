#!/bin/bash

echo "Starting Smart Note Organizer..."

# Function to check if a port is in use
function is_port_in_use() {
  if command -v lsof &> /dev/null; then
    lsof -i:"$1" &> /dev/null
    return $?
  elif command -v netstat &> /dev/null; then
    netstat -tuln | grep ":$1 " &> /dev/null
    return $?
  else
    echo "Warning: Cannot check if port is in use (lsof/netstat not available)"
    return 1
  fi
}

# Check if ports are already in use
BACKEND_PORT=5000
FRONTEND_PORT=5173

if is_port_in_use $BACKEND_PORT; then
  echo "Warning: Port $BACKEND_PORT is already in use. Backend may not start correctly."
fi

if is_port_in_use $FRONTEND_PORT; then
  echo "Warning: Port $FRONTEND_PORT is already in use. Frontend may not start correctly."
fi

# Start backend in a separate terminal
echo "Starting backend service..."
if command -v gnome-terminal &> /dev/null; then
  gnome-terminal -- bash -c "cd backend && npm run dev; exec bash"
elif command -v xterm &> /dev/null; then
  xterm -e "cd backend && npm run dev" &
elif command -v open &> /dev/null; then
  # macOS
  osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/backend && npm run dev"'
else
  # Fallback: start in background
  echo "No terminal emulator found, starting backend in background..."
  cd backend && npm run dev &
  cd ..
fi

# Wait for backend to initialize
echo "Waiting for backend to initialize..."
sleep 3

# Start frontend in a separate terminal
echo "Starting frontend service..."
if command -v gnome-terminal &> /dev/null; then
  gnome-terminal -- bash -c "cd frontend && npm start; exec bash"
elif command -v xterm &> /dev/null; then
  xterm -e "cd frontend && npm start" &
elif command -v open &> /dev/null; then
  # macOS
  osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/frontend && npm start"'
else
  # Fallback: start in background
  echo "No terminal emulator found, starting frontend in background..."
  cd frontend && npm start &
  cd ..
fi

echo ""
echo "Services are starting..."
echo "Access the frontend at http://localhost:5173"
echo "Backend API is running at http://localhost:5000"
echo ""
echo "Press Ctrl+C in each terminal window to stop the services when done." 