@echo off
echo Starting Smart Note Organizer...

:: Check for Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python not found. Please install Python 3.8 or later.
    exit /b 1
)

:: Check for Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js not found. Please install Node.js.
    exit /b 1
)

:: Start backend in a new window
echo Starting backend service...
start "Smart Note Organizer Backend" cmd /c "cd backend && python run_django.py"

:: Wait for backend to initialize
echo Waiting for backend to initialize...
timeout /t 5 /nobreak

:: Start frontend in a new window
echo Starting frontend service...
start "Smart Note Organizer Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo Access the frontend at http://localhost:5174
echo Backend API is running at http://localhost:8000
echo.
echo Press Ctrl+C in each terminal window to stop the services when done.

:: Keep this window open
pause 