# Brain Network Logo Update Script
# This script helps you update the logo.jpeg file in your project

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlPath = Join-Path -Path $scriptPath -ChildPath "brain_logo_simple.html"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   Brain Network Logo Update Utility" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if the HTML generator exists
if (-not (Test-Path $htmlPath)) {
    Write-Host "Error: Could not find brain_logo_simple.html in the current directory." -ForegroundColor Red
    Write-Host "Please make sure you have the HTML file in the same directory as this script." -ForegroundColor Red
    exit
}

# Get list of possible project paths
Write-Host "Searching for project locations..." -ForegroundColor Gray

$possiblePaths = Get-ChildItem -Path $HOME -Filter "public" -Directory -Recurse -Depth 4 -ErrorAction SilentlyContinue |
    Where-Object { Test-Path (Join-Path $_.FullName "logo.jpeg") } |
    Sort-Object -Property LastWriteTime -Descending |
    Select-Object -First 10

if ($possiblePaths.Count -eq 0) {
    Write-Host "No project public directories with logo.jpeg were found." -ForegroundColor Yellow
    $customPath = Read-Host "Please enter the path to your project's public directory"
    if (-not (Test-Path $customPath)) {
        Write-Host "Invalid path. Exiting script." -ForegroundColor Red
        exit
    }
    $targetDir = $customPath
}
else {
    Write-Host "Found the following possible project directories:" -ForegroundColor Green
    for ($i = 0; $i -lt $possiblePaths.Count; $i++) {
        Write-Host "[$i] $($possiblePaths[$i].FullName)" -ForegroundColor Yellow
    }
    Write-Host "[C] Enter a custom path" -ForegroundColor Yellow
    
    $choice = Read-Host "Select a directory by number or 'C' for custom path"
    
    if ($choice -eq "C" -or $choice -eq "c") {
        $customPath = Read-Host "Please enter the path to your project's public directory"
        if (-not (Test-Path $customPath)) {
            Write-Host "Invalid path. Exiting script." -ForegroundColor Red
            exit
        }
        $targetDir = $customPath
    }
    elseif ([int]::TryParse($choice, [ref]$null) -and [int]$choice -ge 0 -and [int]$choice -lt $possiblePaths.Count) {
        $targetDir = $possiblePaths[[int]$choice].FullName
    }
    else {
        Write-Host "Invalid selection. Exiting script." -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "Selected target directory: $targetDir" -ForegroundColor Green
Write-Host ""

# Present options to the user
Write-Host "How would you like to proceed?" -ForegroundColor Cyan
Write-Host "[1] Open the logo generator in browser" -ForegroundColor White
Write-Host "[2] Select an existing logo.jpeg file" -ForegroundColor White
Write-Host "[3] Exit" -ForegroundColor White
$action = Read-Host "Select an option"

switch ($action) {
    "1" {
        # Open HTML in browser
        Write-Host "Opening logo generator in your default browser..." -ForegroundColor Gray
        Start-Process $htmlPath
        Write-Host ""
        Write-Host "After generating and saving your logo:" -ForegroundColor Yellow
        Write-Host "1. Make sure the saved 'logo.jpeg' is in your Downloads folder" -ForegroundColor Yellow
        Write-Host "2. Run this script again and choose option 2 to select the file" -ForegroundColor Yellow
    }
    "2" {
        # Get the default Downloads folder
        $downloadsFolder = (New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path
        
        # Look for logo.jpeg in the Downloads folder
        $defaultLogoPath = Join-Path -Path $downloadsFolder -ChildPath "logo.jpeg"
        
        if (Test-Path $defaultLogoPath) {
            Write-Host "Found logo.jpeg in your Downloads folder." -ForegroundColor Green
            $logoPath = $defaultLogoPath
        }
        else {
            # Open file browser dialog to select the logo file
            Add-Type -AssemblyName System.Windows.Forms
            $openFileDialog = New-Object System.Windows.Forms.OpenFileDialog
            $openFileDialog.Filter = "JPEG Files (*.jpeg;*.jpg)|*.jpeg;*.jpg"
            $openFileDialog.Title = "Select the logo.jpeg file"
            $openFileDialog.InitialDirectory = $downloadsFolder
            
            if ($openFileDialog.ShowDialog() -eq 'OK') {
                $logoPath = $openFileDialog.FileName
            }
            else {
                Write-Host "No file selected. Exiting script." -ForegroundColor Red
                exit
            }
        }
        
        # Backup the existing logo
        $targetLogoPath = Join-Path -Path $targetDir -ChildPath "logo.jpeg"
        $backupPath = Join-Path -Path $targetDir -ChildPath "logo.jpeg.backup"
        
        if (Test-Path $targetLogoPath) {
            Write-Host "Backing up existing logo to $backupPath" -ForegroundColor Gray
            Copy-Item -Path $targetLogoPath -Destination $backupPath -Force
        }
        
        # Copy the new logo
        Write-Host "Copying new logo to $targetLogoPath" -ForegroundColor Gray
        Copy-Item -Path $logoPath -Destination $targetLogoPath -Force
        
        Write-Host ""
        Write-Host "Logo update complete!" -ForegroundColor Green
        Write-Host "Please refresh your application to see the changes." -ForegroundColor Green
    }
    "3" {
        Write-Host "Exiting script. No changes were made." -ForegroundColor Yellow
    }
    default {
        Write-Host "Invalid option. Exiting script." -ForegroundColor Red
    }
} 