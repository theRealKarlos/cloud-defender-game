# ============================================================================
# PRE-DEPLOYMENT CHECKS SCRIPT
# ============================================================================
# Comprehensive checks to run before deployment

Write-Host ""
Write-Host "Pre-Deployment Checks" -ForegroundColor Magenta
Write-Host "=========================" -ForegroundColor Magenta
Write-Host ""

$startTime = Get-Date
$hasErrors = $false

# Step 1: Code Quality & Security
Write-Host "Step 1: Code Quality & Security Checks..." -ForegroundColor Cyan
& "$PSScriptRoot/run-lint.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Code quality checks failed" -ForegroundColor Red
    $hasErrors = $true
}

# Step 2: Run Tests
Write-Host ""
Write-Host "Step 2: Running Tests..." -ForegroundColor Cyan

# Frontend tests
Write-Host "Running frontend tests..." -ForegroundColor Yellow
Set-Location "frontend"
npm test -- --passWithNoTests --silent

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend tests failed" -ForegroundColor Red
    $hasErrors = $true
}
else {
    Write-Host "Frontend tests passed" -ForegroundColor Green
}

Set-Location ".."

# Backend tests
Write-Host "Running backend tests..." -ForegroundColor Yellow
Set-Location "backend"
npm test -- --passWithNoTests --silent

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests failed" -ForegroundColor Red
    $hasErrors = $true
}
else {
    Write-Host "Backend tests passed" -ForegroundColor Green
}

Set-Location ".."

# Step 3: Configuration Validation
Write-Host ""
Write-Host "Step 3: Configuration Validation..." -ForegroundColor Cyan

# Check if required files exist
$requiredFiles = @(
    "frontend/config.json",
    "frontend/js/api-service.js",
    "backend/index.js",
    "infra/main.tf"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "$file exists" -ForegroundColor Green
    }
    else {
        Write-Host "$file missing" -ForegroundColor Red
        $hasErrors = $true
    }
}

# Step 4: Terraform Validation
Write-Host ""
Write-Host "Step 4: Terraform Validation..." -ForegroundColor Cyan

Set-Location "infra"

Write-Host "Validating Terraform configuration..." -ForegroundColor Yellow
terraform validate

if ($LASTEXITCODE -ne 0) {
    Write-Host "Terraform validation failed" -ForegroundColor Red
    $hasErrors = $true
}
else {
    Write-Host "Terraform validation passed" -ForegroundColor Green
}

Set-Location ".."

# Summary
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "Pre-Deployment Check Results" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Total Time: $($duration.ToString('mm\:ss'))" -ForegroundColor Yellow

if ($hasErrors) {
    Write-Host ""
    Write-Host "PRE-DEPLOYMENT CHECKS FAILED" -ForegroundColor Red
    Write-Host "Please fix the issues above before deploying." -ForegroundColor Red
    Write-Host ""
    Write-Host "Quick fixes:" -ForegroundColor Yellow
    Write-Host "  • Run .\scripts\lint-and-security.ps1 -Fix to auto-fix linting" -ForegroundColor White
    Write-Host "  • Check test output for specific test failures" -ForegroundColor White
    Write-Host "  • Verify all required files are present" -ForegroundColor White
    exit 1
}
else {
    Write-Host ""
    Write-Host "ALL PRE-DEPLOYMENT CHECKS PASSED!" -ForegroundColor Green
    Write-Host "Ready for deployment!" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Blue
    Write-Host "  .\scripts\deploy-all.ps1    # Deploy everything" -ForegroundColor White
    Write-Host "  .\scripts\deploy-infra.ps1  # Deploy infrastructure only" -ForegroundColor White
}

Write-Host ""