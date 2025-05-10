Write-Host "Starting Smart Note Organizer..." -ForegroundColor Cyan

# Function to run a command in a directory
function Invoke-CommandInDirectory {
    param (
        [string]$Directory,
        [string]$Command
    )
    
    Push-Location $Directory
    try {
        Invoke-Expression $Command
    }
    finally {
        Pop-Location
    }
}

# Start backend
Write-Host "Starting backend service..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PWD\backend"
    npm run dev
}

# Wait a moment to let backend initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend service..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PWD\frontend"
    npm run dev
}

# Display status
Write-Host "`nServices are starting..." -ForegroundColor Cyan
Write-Host "Access the frontend at http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API is running at http://localhost:5000" -ForegroundColor Yellow

# Wait for jobs and show output
Write-Host "`nShowing backend output:" -ForegroundColor Magenta
Receive-Job -Job $backendJob -Wait -AutoRemoveJob

Write-Host "`nShowing frontend output:" -ForegroundColor Magenta
Receive-Job -Job $frontendJob -Wait -AutoRemoveJob

Write-Host "`nServices have stopped." -ForegroundColor Red 