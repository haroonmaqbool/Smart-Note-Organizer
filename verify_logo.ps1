# Script to verify and fix logo file issues
Write-Host "Logo File Verification Tool" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check if we can find the logo file in public directory
$logoPath = ".\frontend\public\logo.jpeg"
if (Test-Path $logoPath) {
    Write-Host "✓ Found logo.jpeg in public directory" -ForegroundColor Green
    $logoFile = Get-Item $logoPath
    Write-Host "  - Size: $($logoFile.Length) bytes" -ForegroundColor Gray
    Write-Host "  - Last modified: $($logoFile.LastWriteTime)" -ForegroundColor Gray
} else {
    Write-Host "✗ Could not find logo.jpeg in public directory!" -ForegroundColor Red
    
    # Check if we have a logo.jpeg in the root directory
    if (Test-Path ".\logo.jpeg") {
        Write-Host "→ Found logo.jpeg in root directory" -ForegroundColor Yellow
        Write-Host "Do you want to copy this logo to the public directory? (y/n)" -ForegroundColor Yellow
        $copyLogo = Read-Host
        
        if ($copyLogo -eq "y") {
            # Create public directory if it doesn't exist
            if (-not (Test-Path ".\frontend\public")) {
                New-Item -Path ".\frontend\public" -ItemType Directory -Force | Out-Null
            }
            
            # Copy logo to public directory
            Copy-Item -Path ".\logo.jpeg" -Destination $logoPath -Force
            Write-Host "✓ Copied logo.jpeg to public directory" -ForegroundColor Green
        }
    } else {
        # Try to find any logo files in the project
        $logoFiles = Get-ChildItem -Path . -Recurse -Filter "logo.*" -File -ErrorAction SilentlyContinue | 
            Where-Object { $_.Extension -match "\.(jpeg|jpg|png)$" }
        
        if ($logoFiles.Count -gt 0) {
            Write-Host "Found these logo files in the project:" -ForegroundColor Yellow
            foreach ($file in $logoFiles) {
                Write-Host "  - $($file.FullName)" -ForegroundColor Yellow
            }
            
            Write-Host "Please select a file to use as logo.jpeg (enter the number):" -ForegroundColor Yellow
            for ($i = 0; $i -lt $logoFiles.Count; $i++) {
                Write-Host "[$i] $($logoFiles[$i].Name)" -ForegroundColor White
            }
            
            $selection = Read-Host
            if ([int]::TryParse($selection, [ref]$null) -and [int]$selection -ge 0 -and [int]$selection -lt $logoFiles.Count) {
                $selectedFile = $logoFiles[[int]$selection]
                
                # Create public directory if it doesn't exist
                if (-not (Test-Path ".\frontend\public")) {
                    New-Item -Path ".\frontend\public" -ItemType Directory -Force | Out-Null
                }
                
                # Copy selected logo to public directory
                Copy-Item -Path $selectedFile.FullName -Destination $logoPath -Force
                Write-Host "✓ Copied $($selectedFile.Name) to public directory as logo.jpeg" -ForegroundColor Green
            }
        } else {
            Write-Host "✗ No logo files found in the project" -ForegroundColor Red
            Write-Host "Please create brain_logo_combined.html in your browser to generate a new logo," -ForegroundColor Yellow
            Write-Host "then save it as logo.jpeg in the frontend/public directory." -ForegroundColor Yellow
        }
    }
}

# Check the image path in Layout.tsx
$layoutPath = ".\frontend\src\components\Layout.tsx"
if (Test-Path $layoutPath) {
    $layoutContent = Get-Content $layoutPath -Raw
    
    # Check if image paths have leading slashes
    if ($layoutContent -match 'src="/logo\.jpeg"') {
        Write-Host "✗ Found incorrect image path with leading slash in Layout.tsx" -ForegroundColor Red
        Write-Host "Would you like to fix the image paths? (y/n)" -ForegroundColor Yellow
        $fixPaths = Read-Host
        
        if ($fixPaths -eq "y") {
            $updatedContent = $layoutContent -replace 'src="/logo\.jpeg"', 'src="logo.jpeg"'
            Set-Content -Path $layoutPath -Value $updatedContent
            Write-Host "✓ Updated image paths in Layout.tsx" -ForegroundColor Green
        }
    } else {
        Write-Host "✓ Image paths in Layout.tsx look correct" -ForegroundColor Green
    }
} else {
    Write-Host "✗ Could not find Layout.tsx file!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Verification complete. If you made changes, please refresh your application." -ForegroundColor Cyan 