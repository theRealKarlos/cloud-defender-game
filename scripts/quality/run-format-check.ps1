# Run Prettier Formatting Checks
# Validates code formatting across frontend and backend projects

param(
    [switch]$Fix,
    [switch]$Verbose
)

Write-Host "Running Prettier Formatting Checks..." -ForegroundColor Green

# Function to run formatting check for a project
function Invoke-FormatCheck {
    param(
        [string]$ProjectPath,
        [string]$ProjectName
    )
    
    Write-Host "Checking $ProjectName formatting..." -ForegroundColor Yellow
    
    Push-Location $ProjectPath
    try {
        if ($Fix) {
            Write-Host "  Running format with auto-fix..." -ForegroundColor Cyan
            npm run format
        }
        else {
            Write-Host "  Running format check..." -ForegroundColor Cyan
            npm run format:check
        }
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Formatting check failed for $ProjectName!" -ForegroundColor Red
            if (-not $Fix) {
                Write-Host "  Run 'npm run format' in $ProjectPath to fix formatting issues" -ForegroundColor Yellow
            }
            return $false
        }
        
        Write-Host "  Formatting check passed for $ProjectName" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  Error running format check for $ProjectName`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

# Main execution
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptRoot)

$frontendPath = Join-Path $projectRoot "frontend"
$backendPath = Join-Path $projectRoot "backend"

$allPassed = $true

# Check if projects exist
if (-not (Test-Path $frontendPath)) {
    Write-Host "Frontend directory not found: $frontendPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $backendPath)) {
    Write-Host "Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

# Run formatting checks
Write-Host ""
$frontendFormatPassed = Invoke-FormatCheck -ProjectPath $frontendPath -ProjectName "Frontend"
Write-Host ""
$backendFormatPassed = Invoke-FormatCheck -ProjectPath $backendPath -ProjectName "Backend"

if (-not $frontendFormatPassed -or -not $backendFormatPassed) {
    $allPassed = $false
}

# Summary
Write-Host ""
Write-Host "Formatting Check Summary:" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "  All formatting checks passed!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "  Some formatting checks failed. Please review the output above." -ForegroundColor Red
    Write-Host "  Run this script with -Fix parameter to automatically fix formatting issues:" -ForegroundColor Yellow
    Write-Host "  .\scripts\quality\run-format-check.ps1 -Fix" -ForegroundColor White
    exit 1
}
