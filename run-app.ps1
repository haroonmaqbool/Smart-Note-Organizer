Write-Host "Starting Smart Note Organizer..." -ForegroundColor Cyan

# Function to check if a port is in use
function Test-PortInUse {
    param(
        [int]$Port
    )
    
    $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | 
                  Where-Object { $_.LocalPort -eq $Port }
    
    return ($null -ne $connections)
}

# Check if ports are already in use
$backendPort = 8000
$frontendPort = 5174

if (Test-PortInUse -Port $backendPort) {
    Write-Host "Warning: Port $backendPort is already in use. Backend may not start correctly." -ForegroundColor Yellow
}

if (Test-PortInUse -Port $frontendPort) {
    Write-Host "Warning: Port $frontendPort is already in use. Frontend may not start correctly." -ForegroundColor Yellow
}

# Start backend in a new window
Write-Host "`nStarting backend service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path './backend'; python run_django.py"

# Wait a moment to let backend initialize
Start-Sleep -Seconds 2

# Start frontend in a new window
Write-Host "`nStarting frontend service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path './frontend'; npm run dev"

Write-Host "`nServices are starting..." -ForegroundColor Cyan
Write-Host "Access the frontend at http://localhost:5174" -ForegroundColor Yellow
Write-Host "Backend API is running at http://localhost:8000" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C in each terminal window to stop the services when done." -ForegroundColor Magenta 