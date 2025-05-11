# Simple script to update the logo.jpeg file in your project
# This will use the existing brain_logo HTML files you've created

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   Brain Network Logo Update Utility" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# First, find HTML files for logo generation
$htmlFiles = @()
if (Test-Path "brain_logo.html") {
    $htmlFiles += "brain_logo.html"
}
if (Test-Path "brain_logo_simple.html") {
    $htmlFiles += "brain_logo_simple.html"
}
if (Test-Path "brain_logo_sidebar.html") {
    $htmlFiles += "brain_logo_sidebar.html"
}

if ($htmlFiles.Count -eq 0) {
    Write-Host "No logo generator HTML files found in the current directory." -ForegroundColor Yellow
    Write-Host "Would you like to:"
    Write-Host "[1] Proceed with logo update using existing file only" -ForegroundColor White
    Write-Host "[2] Exit" -ForegroundColor White
    
    $choice = Read-Host "Select an option"
    if ($choice -ne "1") {
        exit
    }
}
else {
    Write-Host "Found the following logo generator files:" -ForegroundColor Green
    foreach ($file in $htmlFiles) {
        Write-Host "- $file" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Would you like to:"
    Write-Host "[1] Open a logo generator in browser" -ForegroundColor White
    Write-Host "[2] Use existing logo.jpeg file" -ForegroundColor White
    Write-Host "[3] Exit" -ForegroundColor White
    
    $choice = Read-Host "Select an option"
    
    if ($choice -eq "1") {
        if ($htmlFiles.Count -eq 1) {
            Start-Process $htmlFiles[0]
        }
        else {
            Write-Host "Which logo generator would you like to open?" -ForegroundColor Cyan
            for ($i = 0; $i -lt $htmlFiles.Count; $i++) {
                Write-Host "[$i] $($htmlFiles[$i])" -ForegroundColor Yellow
            }
            
            $htmlChoice = Read-Host "Select a generator by number"
            if ([int]::TryParse($htmlChoice, [ref]$null) -and [int]$htmlChoice -ge 0 -and [int]$htmlChoice -lt $htmlFiles.Count) {
                Start-Process $htmlFiles[[int]$htmlChoice]
            }
            else {
                Write-Host "Invalid selection. Exiting script." -ForegroundColor Red
                exit
            }
        }
        
        Write-Host ""
        Write-Host "After generating and saving your logo:" -ForegroundColor Yellow
        Write-Host "1. Make sure the saved logo file is in your Downloads folder" -ForegroundColor Yellow
        Write-Host "2. Run this script again and choose option 2" -ForegroundColor Yellow
        exit
    }
    elseif ($choice -ne "2") {
        exit
    }
}

# Find all project directories with logo.jpeg
$projectPaths = Get-ChildItem -Path $HOME -Recurse -Filter "logo.jpeg" -File -ErrorAction SilentlyContinue |
    Where-Object { $_.DirectoryName -like "*\public*" } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 5 FullName,DirectoryName

if ($projectPaths.Count -eq 0) {
    Write-Host "No project directories with logo.jpeg were found." -ForegroundColor Yellow
    $customPath = Read-Host "Please enter the full path to your project's logo.jpeg file"
    if (-not (Test-Path $customPath)) {
        Write-Host "Invalid path. Exiting script." -ForegroundColor Red
        exit
    }
    $logoPath = $customPath
    $logoDir = Split-Path -Parent $customPath
}
else {
    Write-Host "Found the following logo files:" -ForegroundColor Green
    for ($i = 0; $i -lt $projectPaths.Count; $i++) {
        Write-Host "[$i] $($projectPaths[$i].FullName)" -ForegroundColor Yellow
    }
    Write-Host "[C] Enter a custom path" -ForegroundColor Yellow
    
    $dirChoice = Read-Host "Select a logo file to update by number or 'C' for custom path"
    
    if ($dirChoice -eq "C" -or $dirChoice -eq "c") {
        $customPath = Read-Host "Please enter the full path to your project's logo.jpeg file"
        if (-not (Test-Path $customPath)) {
            Write-Host "Invalid path. Exiting script." -ForegroundColor Red
            exit
        }
        $logoPath = $customPath
        $logoDir = Split-Path -Parent $customPath
    }
    elseif ([int]::TryParse($dirChoice, [ref]$null) -and [int]$dirChoice -ge 0 -and [int]$dirChoice -lt $projectPaths.Count) {
        $logoPath = $projectPaths[[int]$dirChoice].FullName
        $logoDir = $projectPaths[[int]$dirChoice].DirectoryName
    }
    else {
        Write-Host "Invalid selection. Exiting script." -ForegroundColor Red
        exit
    }
}

# Now get the new logo file
$downloadsFolder = (New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path
$defaultNewLogoPath = Join-Path -Path $downloadsFolder -ChildPath "logo.jpeg"

if (Test-Path $defaultNewLogoPath) {
    Write-Host "Found logo.jpeg in your Downloads folder." -ForegroundColor Green
    $newLogoPath = $defaultNewLogoPath
}
else {
    # Use file browser to select file
    Add-Type -AssemblyName System.Windows.Forms
    $openFileDialog = New-Object System.Windows.Forms.OpenFileDialog
    $openFileDialog.Filter = "JPEG Files (*.jpeg;*.jpg)|*.jpeg;*.jpg"
    $openFileDialog.Title = "Select the new logo file"
    $openFileDialog.InitialDirectory = $downloadsFolder
    
    if ($openFileDialog.ShowDialog() -eq 'OK') {
        $newLogoPath = $openFileDialog.FileName
    }
    else {
        Write-Host "No file selected. Exiting script." -ForegroundColor Red
        exit
    }
}

# Backup the existing logo
$backupPath = $logoPath + ".backup"
if (Test-Path $logoPath) {
    Write-Host "Backing up existing logo to $backupPath" -ForegroundColor Gray
    Copy-Item -Path $logoPath -Destination $backupPath -Force
}

# Copy the new logo
Write-Host "Copying new logo to $logoPath" -ForegroundColor Gray
Copy-Item -Path $newLogoPath -Destination $logoPath -Force

Write-Host ""
Write-Host "Logo update complete!" -ForegroundColor Green
Write-Host "Please refresh your application to see the changes." -ForegroundColor Green 