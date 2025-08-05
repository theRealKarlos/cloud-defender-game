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

# Function to run YAML validation
function Invoke-YamlValidation {
    Write-Host "Running YAML validation..." -ForegroundColor Yellow
    
    # Find all YAML files excluding node_modules
    $yamlFiles = Get-ChildItem -Path $projectRoot -Recurse -Include "*.yml", "*.yaml" | 
                 Where-Object { $_.FullName -notlike "*node_modules*" }
    
    if ($yamlFiles.Count -eq 0) {
        Write-Host "  No YAML files found to validate" -ForegroundColor Yellow
        return $true
    }
    
    Write-Host "  Found $($yamlFiles.Count) YAML files to validate" -ForegroundColor Cyan
    
    $validationPassed = $true
    
    foreach ($file in $yamlFiles) {
        $relativePath = $file.FullName.Replace("$projectRoot\", "")
        Write-Host "  Validating: $relativePath" -ForegroundColor Cyan
        
        try {
            # Method 1: Try Python YAML validation
            $pythonResult = python -c "import yaml; yaml.safe_load(open('$($file.FullName)', 'r', encoding='utf-8')); print('✅ Valid YAML')" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    ✅ YAML syntax valid" -ForegroundColor Green
                continue
            }
        }
        catch {
            # Python validation failed, try alternative methods
        }
        
        try {
            # Method 2: Try PowerShell YAML validation (if available)
            if (Get-Module -ListAvailable -Name powershell-yaml) {
                Import-Module powershell-yaml -ErrorAction SilentlyContinue
                $yamlContent = Get-Content $file.FullName -Raw
                $parsedYaml = ConvertFrom-Yaml $yamlContent -ErrorAction Stop
                Write-Host "    ✅ YAML syntax valid (PowerShell)" -ForegroundColor Green
                continue
            }
        }
        catch {
            Write-Host "    ❌ YAML syntax error: $($_.Exception.Message)" -ForegroundColor Red
            $validationPassed = $false
            continue
        }
        
        try {
            # Method 3: Basic syntax check using yq (if available)
            $yqResult = yq eval '.name // "no-name"' $file.FullName 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    ✅ YAML syntax valid (yq)" -ForegroundColor Green
                continue
            }
        }
        catch {
            # yq not available or failed
        }
        
        # Method 4: Basic file structure validation
        try {
            $content = Get-Content $file.FullName -Raw
            
            # Check for common YAML syntax issues
            $issues = @()
            
            # Check for tabs (YAML should use spaces)
            if ($content -match "`t") {
                $issues += "Contains tabs (YAML should use spaces for indentation)"
            }
            
            # Check for basic structure issues
            $lines = $content -split "`n"
            for ($i = 0; $i -lt $lines.Count; $i++) {
                $line = $lines[$i]
                $lineNum = $i + 1
                
                # Check for unmatched quotes (excluding escaped quotes)
                $lineWithoutEscaped = $line -replace "''", "" -replace '""', ""
                $singleQuotes = ($lineWithoutEscaped.ToCharArray() | Where-Object { $_ -eq "'" }).Count
                $doubleQuotes = ($lineWithoutEscaped.ToCharArray() | Where-Object { $_ -eq '"' }).Count
                
                if (($singleQuotes % 2) -ne 0) {
                    $issues += "Line ${lineNum}: Unmatched single quotes"
                }
                if (($doubleQuotes % 2) -ne 0) {
                    $issues += "Line ${lineNum}: Unmatched double quotes"
                }
            }
            
            if ($issues.Count -eq 0) {
                Write-Host "    ✅ Basic YAML structure valid" -ForegroundColor Green
            } else {
                Write-Host "    ❌ YAML issues found:" -ForegroundColor Red
                foreach ($issue in $issues) {
                    Write-Host "      - $issue" -ForegroundColor Red
                }
                $validationPassed = $false
            }
        }
        catch {
            Write-Host "    ❌ Error reading file: $($_.Exception.Message)" -ForegroundColor Red
            $validationPassed = $false
        }
    }
    
    if ($validationPassed) {
        Write-Host "  All YAML files are valid" -ForegroundColor Green
    } else {
        Write-Host "  Some YAML files have validation errors" -ForegroundColor Red
    }
    
    return $validationPassed
}

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

# Run YAML validation first
$yamlValidationPassed = Invoke-YamlValidation
if (-not $yamlValidationPassed) {
    $allPassed = $false
}

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