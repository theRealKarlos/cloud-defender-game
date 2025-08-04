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
function Run-Linting {
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

# Function to run security audit
function Run-SecurityAudit {
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
$projectRoot = Split-Path -Parent $scriptRoot

$frontendPath = Join-Path $projectRoot "frontend"
$backendPath = Join-Path $projectRoot "backend"

$allPassed = $true

# Run linting checks
if (-not $SecurityOnly) {
    Write-Host "`nRunning Linting Checks..." -ForegroundColor Cyan
    
    $frontendLintPassed = Run-Linting -ProjectPath $frontendPath -ProjectName "Frontend"
    $backendLintPassed = Run-Linting -ProjectPath $backendPath -ProjectName "Backend"
    
    if (-not $frontendLintPassed -or -not $backendLintPassed) {
        $allPassed = $false
    }
}

# Run security audits
if (-not $LintOnly) {
    Write-Host "`nRunning Security Audits..." -ForegroundColor Cyan
    
    $frontendSecurityPassed = Run-SecurityAudit -ProjectPath $frontendPath -ProjectName "Frontend"
    $backendSecurityPassed = Run-SecurityAudit -ProjectPath $backendPath -ProjectName "Backend"
    
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