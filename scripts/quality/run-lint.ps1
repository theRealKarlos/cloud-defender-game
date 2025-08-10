# Run Linting and Code Quality Checks
# Consolidates linting, security, and code quality checks

param(
    [switch]$Fix,
    [switch]$SecurityOnly,
    [switch]$LintOnly,
    [switch]$Verbose
)

Write-Host "Running Cloud Defenders Code Quality Checks..." -ForegroundColor Green

# Function to run linting for a project
function Invoke-Linting {
    param(
        [string]$ProjectPath,
        [string]$ProjectName
    )
    
    Write-Host "Checking $ProjectName..." -ForegroundColor Yellow
    
    Push-Location $ProjectPath
    try {
        if ($Fix) {
            Write-Host "  Running lint with auto-fix..." -ForegroundColor Cyan
            npm run lint
        }
        else {
            Write-Host "  Running lint check..." -ForegroundColor Cyan
            npm run lint:check
        }
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Linting failed for $ProjectName!" -ForegroundColor Red
            return $false
        }
        
        Write-Host "  Linting passed for $ProjectName" -ForegroundColor Green
        return $true
    }
    catch {
        # Output error message if linting fails, using British English spelling
        Write-Host "  Error running lint for $ProjectName $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

# YAML validation is now handled by the comprehensive validate-yaml.ps1 script
# This function has been removed to avoid duplication

# Function to run security audit
function Invoke-SecurityAudit {
    param(
        [string]$ProjectPath,
        [string]$ProjectName
    )
    
    Write-Host "Running security audit for $ProjectName..." -ForegroundColor Yellow
    
    Push-Location $ProjectPath
    try {
        Write-Host "  Running npm audit..." -ForegroundColor Cyan
        npm audit
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Security audit failed for $ProjectName!" -ForegroundColor Red
            return $false
        }
        
        Write-Host "  Security audit passed for $ProjectName" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  Error running security audit for $ProjectName $($_.Exception.Message)" -ForegroundColor Red
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

# YAML validation is now handled by the comprehensive validate-yaml.ps1 script
# This call has been removed to avoid duplication

# Run linting checks
if (-not $SecurityOnly) {
    Write-Host "`nRunning Linting Checks..." -ForegroundColor Cyan
    
    $frontendLintPassed = Invoke-Linting -ProjectPath $frontendPath -ProjectName "Frontend"
    $backendLintPassed = Invoke-Linting -ProjectPath $backendPath -ProjectName "Backend"
    
    if (-not $frontendLintPassed -or -not $backendLintPassed) {
        $allPassed = $false
    }
}

# Run security audits
if (-not $LintOnly) {
    Write-Host "`nRunning Security Audits..." -ForegroundColor Cyan
    
    $frontendSecurityPassed = Invoke-SecurityAudit -ProjectPath $frontendPath -ProjectName "Frontend"
    $backendSecurityPassed = Invoke-SecurityAudit -ProjectPath $backendPath -ProjectName "Backend"
    
    if (-not $frontendSecurityPassed -or -not $backendSecurityPassed) {
        $allPassed = $false
    }
}

# Summary
Write-Host "`nCode Quality Check Summary:" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "  All checks passed!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "  Some checks failed. Please review the output above." -ForegroundColor Red
    exit 1
} 