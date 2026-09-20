# Windows Defender Exclusion Setup for Irfan Medical Center HMS
# Run this script as Administrator to add Windows Defender exclusions

Write-Host "Setting up Windows Defender exclusions for Irfan Medical Center HMS..." -ForegroundColor Green

# Get the current directory and common installation paths
$currentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDataPath = "$env:LOCALAPPDATA\Programs\Irfan Medical Center HMS"
$programFilesPath = "$env:PROGRAMFILES\Irfan Medical Center HMS"

# Add exclusions for development and installed app
$exclusionPaths = @(
    $currentDir,
    "$currentDir\..",
    $appDataPath,
    $programFilesPath,
    "$env:TEMP\electron-*",
    "$env:USERPROFILE\AppData\Roaming\Irfan Medical Center HMS"
)

foreach ($path in $exclusionPaths) {
    try {
        Add-MpPreference -ExclusionPath $path -ErrorAction SilentlyContinue
        Write-Host "Added exclusion for: $path" -ForegroundColor Yellow
    } catch {
        Write-Host "Could not add exclusion for: $path" -ForegroundColor Red
    }
}

# Add process exclusions
$processExclusions = @(
    "Irfan Medical Center HMS.exe",
    "node.exe",
    "electron.exe"
)

foreach ($process in $processExclusions) {
    try {
        Add-MpPreference -ExclusionProcess $process -ErrorAction SilentlyContinue
        Write-Host "Added process exclusion for: $process" -ForegroundColor Yellow
    } catch {
        Write-Host "Could not add process exclusion for: $process" -ForegroundColor Red
    }
}

Write-Host "Windows Defender exclusions setup completed!" -ForegroundColor Green
Write-Host "Note: You may need to run this script as Administrator for changes to take effect." -ForegroundColor Cyan
