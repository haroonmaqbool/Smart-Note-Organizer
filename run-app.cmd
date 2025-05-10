@echo off
echo Starting Smart Note Organizer...

echo Starting backend service...
start "Backend Service" cmd /k "cd backend & python run_django.py"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting frontend service...
start "Frontend Service" cmd /k "cd frontend & npm run dev"

echo.
echo Services are starting...
echo Access the frontend at http://localhost:5174
echo Backend API is running at http://localhost:8000
echo.
echo Press Ctrl+C in each terminal window to stop the services when done. 