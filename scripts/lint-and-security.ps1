# ============================================================================
# LINT AND SECURITY CHECK SCRIPT
# ============================================================================
# Runs linting and security checks for both frontend and backend

param(
    [Parameter(Mandatory = $false)]
    [switch]$Fix = $false,
    
    [Parameter(Mandatory = $false)]
    [switch]$SecurityOnly = $false,
    
    [Parameter(Mandatory = $false)]
    [switch]$LintOnly = $false
)

Write-Host ""
Write-Host "Cloud Defenders - Code Quality & Security Checks" -ForegroundColor Magenta
Write-Host "===================================================" -ForegroundColor Magenta
Write-Host ""

$hasErrors = $false

# Frontend checks
Write-Host "Frontend Checks" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

Set-Location "frontend"

if (-not $SecurityOnly) {
    Write-Host ""
    Write-Host "Running ESLint..." -ForegroundColor Yellow
    
    if ($Fix) {
        npm run lint:fix
    }
    else {
        npm run lint:check
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Frontend linting failed" -ForegroundColor Red
        $hasErrors = $true
    }
    else {
        Write-Host "Frontend linting passed" -ForegroundColor Green
    }
}

if (-not $LintOnly) {
    Write-Host ""
    Write-Host "Running security audit..." -ForegroundColor Yellow
    
    if ($Fix) {
        npm run security:fix
    }
    else {
        npm run security
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Frontend security issues found" -ForegroundColor Yellow
        # Don't fail on security warnings, just notify
    }
    else {
        Write-Host "Frontend security audit passed" -ForegroundColor Green
    }
}

Set-Location ".."

# Backend checks
Write-Host ""
Write-Host "Backend Checks" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

Set-Location "backend"

if (-not $SecurityOnly) {
    Write-Host ""
    Write-Host "Running ESLint..." -ForegroundColor Yellow
    
    if ($Fix) {
        npm run lint
    }
    else {
        npm run lint:check
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Backend linting failed" -ForegroundColor Red
        $hasErrors = $true
    }
    else {
        Write-Host "Backend linting passed" -ForegroundColor Green
    }
}

if (-not $LintOnly) {
    Write-Host ""
    Write-Host "Running security audit..." -ForegroundColor Yellow
    
    if ($Fix) {
        npm run security:fix
    }
    else {
        npm run security
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Backend security issues found" -ForegroundColor Yellow
        # Don't fail on security warnings, just notify
    }
    else {
        Write-Host "Backend security audit passed" -ForegroundColor Green
    }
}

Set-Location ".."

# Summary
Write-Host ""
Write-Host "Summary" -ForegroundColor Magenta
Write-Host "==========" -ForegroundColor Magenta

if ($hasErrors) {
    Write-Host "Some linting issues found, but continuing..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To fix linting issues:" -ForegroundColor Blue
    Write-Host "  • Run .\scripts\fix-lint-issues.ps1 for auto-fixes" -ForegroundColor White
    Write-Host "  • Run .\scripts\lint-and-security.ps1 -Fix for auto-fix" -ForegroundColor White
    Write-Host "  • Check error messages for manual fixes needed" -ForegroundColor White
    Write-Host ""
    Write-Host "Code quality and security checks completed with warnings!" -ForegroundColor Magenta
}
else {
    Write-Host "All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Code quality and security checks completed successfully!" -ForegroundColor Magenta
}

Write-Host ""
Write-Host "Available options:" -ForegroundColor Blue
Write-Host "  .\scripts\lint-and-security.ps1           # Run all checks" -ForegroundColor White
Write-Host "  .\scripts\lint-and-security.ps1 -Fix      # Run all checks and auto-fix" -ForegroundColor White
Write-Host "  .\scripts\lint-and-security.ps1 -LintOnly # Run only linting checks" -ForegroundColor White
Write-Host "  .\scripts\lint-and-security.ps1 -SecurityOnly # Run only security checks" -ForegroundColor White
Write-Host ""