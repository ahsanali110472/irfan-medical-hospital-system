# Complete Setup and Build Script for Irfan Medical Center HMS
# This script handles Windows Defender exclusions and builds the app

Write-Host "=== Irfan Medical Center HMS - Complete Setup ===" -ForegroundColor Green

# Step 1: Add Windows Defender Exclusions
Write-Host "Adding Windows Defender exclusions..." -ForegroundColor Yellow
$currentDir = Get-Location
$exclusionPaths = @(
    $currentDir.Path,
    "$env:LOCALAPPDATA\Programs\Irfan Medical Center HMS",
    "$env:PROGRAMFILES\Irfan Medical Center HMS",
    "$env:TEMP\electron-*",
    "$env:USERPROFILE\AppData\Roaming\Irfan Medical Center HMS"
)

foreach ($path in $exclusionPaths) {
    try {
        Add-MpPreference -ExclusionPath $path -ErrorAction SilentlyContinue
        Write-Host "  ✓ Added path exclusion: $path" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Could not add path exclusion: $path" -ForegroundColor Yellow
    }
}

$processExclusions = @("Irfan Medical Center HMS.exe", "node.exe", "electron.exe")
foreach ($process in $processExclusions) {
    try {
        Add-MpPreference -ExclusionProcess $process -ErrorAction SilentlyContinue
        Write-Host "  ✓ Added process exclusion: $process" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Could not add process exclusion: $process" -ForegroundColor Yellow
    }
}

# Step 2: Install Dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install root dependencies" -ForegroundColor Red
    exit 1
}

# Step 3: Build Frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build frontend" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Step 4: Install Backend Dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install --production
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Step 5: Build Electron App
Write-Host "Building Electron app..." -ForegroundColor Yellow
npx electron-builder --win
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build Electron app" -ForegroundColor Red
    exit 1
}

Write-Host "=== Build completed successfully! ===" -ForegroundColor Green
Write-Host "Check the 'dist' folder for your executable files." -ForegroundColor Cyan
Write-Host "To run the app in development mode: npm run dev" -ForegroundColor Cyan
