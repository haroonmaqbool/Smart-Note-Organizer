# Script to update the logo in Smart-Note-Organizer projects
$projectPaths = @(
    "C:\Users\Lenovo\repo2\Smart-Note-Organizer-3",
    "C:\Users\Lenovo\repo2\Smart-Note-Organizer-2",
    "C:\Users\Lenovo\repo2\Smart-Note-Organizer-1",
    "C:\Users\Lenovo\repo2\Smart-Note-Organizer"
)

# First, verify the brain_logo.html exists
if (-not (Test-Path "brain_logo.html")) {
    Write-Host "Error: brain_logo.html not found in the current directory." -ForegroundColor Red
    exit
}

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Smart Note Organizer Logo Update Utility" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will help you update the logo in your project."
Write-Host "Steps to follow:"
Write-Host ""
Write-Host "1. Open the brain_logo.html file in your browser" -ForegroundColor Yellow
Write-Host "2. Click the 'Save Logo' button to download the new logo.jpeg" -ForegroundColor Yellow
Write-Host "3. After downloading, run this script again and select 'Update Logo Files'" -ForegroundColor Yellow
Write-Host ""
Write-Host "Options:"
Write-Host "1. Open the logo generator in your browser"
Write-Host "2. Update logo files in your projects"
Write-Host "3. Exit"
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        # Open the HTML file in the default browser
        Write-Host "Opening logo generator in your browser..." -ForegroundColor Green
        Start-Process "brain_logo.html"
    }
    "2" {
        # Check if the new logo exists
        if (-not (Test-Path "logo.jpeg")) {
            Write-Host "Error: logo.jpeg not found. Please generate and save it first." -ForegroundColor Red
            exit
        }
        
        Write-Host "Found logo.jpeg file. Ready to update projects." -ForegroundColor Green
        Write-Host ""
        
        # For each project, backup the old logo and copy the new one
        foreach ($path in $projectPaths) {
            $logoPath = Join-Path -Path $path -ChildPath "frontend\public\logo.jpeg"
            $rootLogoPath = Join-Path -Path $path -ChildPath "logo.jpeg"
            
            if (Test-Path $path) {
                Write-Host "Processing project: $path" -ForegroundColor Cyan
                
                # Update public/logo.jpeg
                if (Test-Path $logoPath) {
                    $backupPath = $logoPath + ".backup"
                    Write-Host "  - Backing up $logoPath to $backupPath"
                    Copy-Item -Path $logoPath -Destination $backupPath -Force
                    
                    Write-Host "  - Updating $logoPath"
                    Copy-Item -Path "logo.jpeg" -Destination $logoPath -Force
                }
                
                # Update root logo.jpeg if it exists
                if (Test-Path $rootLogoPath) {
                    $backupRootPath = $rootLogoPath + ".backup"
                    Write-Host "  - Backing up $rootLogoPath to $backupRootPath"
                    Copy-Item -Path $rootLogoPath -Destination $backupRootPath -Force
                    
                    Write-Host "  - Updating $rootLogoPath"
                    Copy-Item -Path "logo.jpeg" -Destination $rootLogoPath -Force
                }
                
                Write-Host "  ✓ Project updated successfully" -ForegroundColor Green
            } else {
                Write-Host "Project not found: $path" -ForegroundColor Yellow
            }
        }
        
        Write-Host ""
        Write-Host "Logo update complete! All projects have been updated with the new logo." -ForegroundColor Green
    }
    "3" {
        Write-Host "Exiting script. No changes were made." -ForegroundColor Yellow
    }
    default {
        Write-Host "Invalid choice. No changes were made." -ForegroundColor Red
    }
} 