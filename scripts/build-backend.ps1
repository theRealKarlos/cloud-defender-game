# Build script for Cloud Defenders Backend
# Creates a lean deployment package for AWS Lambda

param(
    [string]$Environment = "production"
)

Write-Host "Building Cloud Defenders Backend for $Environment environment..." -ForegroundColor Green

# Configuration
$BackendDir = "backend"
$DistDir = "dist"
$StagingDir = "$DistDir/backend_staging"
$OutputZip = "$DistDir/score_api.zip"

# Get the script directory to determine the project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = $ScriptDir

# Since the script is called from the backend directory, we need to go up one level
$BackendDir = "."
$DistDir = "../dist"
$StagingDir = "$DistDir/backend_staging"
$OutputZip = "$DistDir/score_api.zip"

# Step 1: Clean previous build artifacts
Write-Host "Cleaning previous build artifacts..." -ForegroundColor Yellow
if (Test-Path $DistDir) {
    Remove-Item -Path $DistDir -Recurse -Force
    Write-Host "   Removed existing dist directory"
}
if (Test-Path $OutputZip) {
    Remove-Item -Path $OutputZip -Force
    Write-Host "   Removed existing zip file"
}

# Step 2: Create distribution directory
Write-Host "Creating distribution directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
New-Item -ItemType Directory -Path $StagingDir -Force | Out-Null

# Step 3: Copy source files
Write-Host "Copying source files..." -ForegroundColor Yellow
Copy-Item -Path "$BackendDir/index.js" -Destination $StagingDir -Force
Copy-Item -Path "$BackendDir/src" -Destination $StagingDir -Recurse -Force
Copy-Item -Path "$BackendDir/package.json" -Destination $StagingDir -Force

# Step 4: Install production dependencies only
Write-Host "Installing production dependencies..." -ForegroundColor Yellow
Push-Location $StagingDir
try {
    npm install --omit=dev --silent
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed with exit code $LASTEXITCODE"
    }
    Write-Host "   Dependencies installed successfully"
}
catch {
    Write-Host "Failed to install dependencies: $_" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}

# Step 5: Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
try {
    Compress-Archive -Path "$StagingDir/*" -DestinationPath $OutputZip -Force
    $zipSize = (Get-Item $OutputZip).Length / 1MB
    $sizeMB = [math]::Round($zipSize, 2)
    Write-Host "   Package created: $OutputZip ($sizeMB MB)"
}
catch {
    Write-Host "Failed to create zip file: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Clean up staging directory
Write-Host "Cleaning up staging directory..." -ForegroundColor Yellow
Remove-Item -Path $StagingDir -Recurse -Force

# Step 7: Display build summary
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "Deployment package: $OutputZip" -ForegroundColor Cyan
Write-Host "Package size: $sizeMB MB" -ForegroundColor Cyan

# Optional: Show what's included in the package
if ($Environment -eq "development") {
    Write-Host "Package contents:" -ForegroundColor Yellow
    $tempDir = "$DistDir/temp_inspect"
    Expand-Archive -Path $OutputZip -DestinationPath $tempDir -Force
    Get-ChildItem -Path $tempDir -Recurse | ForEach-Object {
        Write-Host "   $($_.FullName.Replace($tempDir, ''))"
    }
    Remove-Item -Path $tempDir -Recurse -Force
}

Write-Host "Ready for deployment!" -ForegroundColor Green 