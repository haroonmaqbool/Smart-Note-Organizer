Write-Host "Starting Smart Note Organizer..." -ForegroundColor Cyan

# Install dependencies if needed
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Create a function to start a service in a new window
function Start-Service {
    param (
        [string]$Directory,
        [string]$Command,
        [string]$Name
    )
    
    Write-Host "Starting $Name service..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$Directory'; $Command`""
}

# Start backend service
Start-Service -Directory "$PSScriptRoot\backend" -Command "npm run dev" -Name "Backend"

# Wait a moment to let backend initialize
Start-Sleep -Seconds 2

# Start frontend service
Start-Service -Directory "$PSScriptRoot\frontend" -Command "npm start" -Name "Frontend"

Write-Host "`nServices started successfully!" -ForegroundColor Cyan
Write-Host "Access the application at http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API is running at http://localhost:5000" -ForegroundColor Yellow 