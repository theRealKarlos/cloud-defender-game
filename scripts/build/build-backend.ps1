# Build script for Cloud Defenders Backend
# Creates a lean deployment package for AWS Lambda

Write-Host "Building Cloud Defenders Backend..." -ForegroundColor Green

# Determine project root and set paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)

$BackendDir = Join-Path $ProjectRoot "backend"
$DistDir = Join-Path $ProjectRoot "dist"
$StagingDir = Join-Path $DistDir "backend_staging"
$OutputZip = Join-Path $DistDir "score_api.zip"

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
Write-Host "Installing dependencies..." -ForegroundColor Yellow
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

# Step 4.5: Remove unnecessary files from deployment package
Write-Host "Removing unnecessary files..." -ForegroundColor Yellow
$filesToRemove = @("package.json", "package-lock.json")
foreach ($file in $filesToRemove) {
    $filePath = Join-Path $StagingDir $file
    if (Test-Path $filePath) {
        Remove-Item -Path $filePath -Force
        Write-Host "   Removed $file"
    }
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

Write-Host "Ready for deployment!" -ForegroundColor Green 