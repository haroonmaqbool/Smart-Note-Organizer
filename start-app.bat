@echo off
echo Starting Smart Note Organizer...

:: Install concurrently if not already installed
call npm install

:: Start both services using concurrently
call npm run dev

:: If the above fails, try starting services individually
if %ERRORLEVEL% NEQ 0 (
  echo Concurrently failed, starting services individually...
  start cmd /k "cd backend && npm run dev"
  start cmd /k "cd frontend && npm start"
)

echo Services started. Access the application at http://localhost:5173 