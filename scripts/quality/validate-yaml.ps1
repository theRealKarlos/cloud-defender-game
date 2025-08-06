# YAML Validation Script for Cloud Defenders
# Validates all YAML files in the project for syntax correctness

param(
    [switch]$Verbose,
    [switch]$InstallTools,
    [string]$Path = "."
)

Write-Host "Cloud Defenders YAML Validation Tool" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Function to install YAML validation tools
function Install-YamlTools {
    Write-Host "`nInstalling YAML validation tools..." -ForegroundColor Yellow
    
    # Try to install Python PyYAML
    try {
        Write-Host "Installing PyYAML..." -ForegroundColor Cyan
        pip install PyYAML 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PyYAML installed successfully" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠️  Could not install PyYAML: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Try to install PowerShell YAML module
    try {
        Write-Host "Installing PowerShell YAML module..." -ForegroundColor Cyan
        Install-Module -Name powershell-yaml -Force -Scope CurrentUser -ErrorAction Stop
        Write-Host "✅ PowerShell YAML module installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Could not install PowerShell YAML module: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Try to install yq
    try {
        Write-Host "Installing yq..." -ForegroundColor Cyan
        if (Get-Command choco -ErrorAction SilentlyContinue) {
            choco install yq -y 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ yq installed successfully via Chocolatey" -ForegroundColor Green
            }
        }
        elseif (Get-Command winget -ErrorAction SilentlyContinue) {
            winget install mikefarah.yq 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ yq installed successfully via winget" -ForegroundColor Green
            }
        }
        else {
            Write-Host "⚠️  No package manager found for yq installation" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "⚠️  Could not install yq: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Function to check available validation tools
function Get-AvailableValidators {
    $validators = @()
    
    # Check for Python + PyYAML
    try {
        python -c "import yaml" 2>$null
        if ($LASTEXITCODE -eq 0) {
            $validators += "python-yaml"
        }
    }
    catch { }
    
    # Check for PowerShell YAML module
    if (Get-Module -ListAvailable -Name powershell-yaml) {
        $validators += "powershell-yaml"
    }
    
    # Check for yq
    if (Get-Command yq -ErrorAction SilentlyContinue) {
        $validators += "yq"
    }
    
    # Check for Node.js + yaml package
    try {
        node -e "require('yaml')" 2>$null
        if ($LASTEXITCODE -eq 0) {
            $validators += "node-yaml"
        }
    }
    catch { }
    
    return $validators
}

# Function to validate YAML using Python
function Test-YamlWithPython {
    param([string]$FilePath)
    
    try {
        # Create a temporary Python script file to avoid path escaping issues
        $tempScript = [System.IO.Path]::GetTempFileName() + ".py"
        $pythonCode = @"
import yaml
import sys
try:
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        yaml.safe_load(f)
    print('VALID')
    sys.exit(0)
except yaml.YAMLError as e:
    print(f'YAML Error: {e}')
    sys.exit(1)
except Exception as e:
    print(f'Error: {e}')
    sys.exit(1)
"@
        Set-Content -Path $tempScript -Value $pythonCode -Encoding UTF8
        
        # Execute Python with the file path as an argument
        $result = python $tempScript "$FilePath" 2>&1
        $exitCode = $LASTEXITCODE
        
        # Clean up temporary file
        Remove-Item $tempScript -ErrorAction SilentlyContinue
        
        return @{
            Valid   = ($exitCode -eq 0)
            Message = $result
        }
    }
    catch {
        return @{
            Valid   = $false
            Message = "Python validation failed: $($_.Exception.Message)"
        }
    }
}

# Function to validate YAML using PowerShell
function Test-YamlWithPowerShell {
    param([string]$FilePath)
    
    try {
        Import-Module powershell-yaml -ErrorAction Stop
        $content = Get-Content $FilePath -Raw
        $parsed = ConvertFrom-Yaml $content -ErrorAction Stop
        
        return @{
            Valid   = $true
            Message = "VALID"
        }
    }
    catch {
        return @{
            Valid   = $false
            Message = "PowerShell YAML Error: $($_.Exception.Message)"
        }
    }
}

# Function to validate YAML using yq
function Test-YamlWithYq {
    param([string]$FilePath)
    
    try {
        $result = yq eval '.' $FilePath 2>&1
        
        return @{
            Valid   = ($LASTEXITCODE -eq 0)
            Message = if ($LASTEXITCODE -eq 0) { "VALID" } else { "yq Error: $result" }
        }
    }
    catch {
        return @{
            Valid   = $false
            Message = "yq validation failed: $($_.Exception.Message)"
        }
    }
}

# Function to perform basic YAML structure validation
function Test-YamlBasicStructure {
    param([string]$FilePath)
    
    try {
        $content = Get-Content $FilePath -Raw
        $issues = @()
        
        # Check for tabs
        if ($content -match "`t") {
            $issues += "Contains tabs (YAML should use spaces)"
        }
        
        # Check for basic quote matching
        $lines = $content -split "`n"
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            $lineNum = $i + 1
            
            # Count quotes (excluding escaped quotes)
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
        
        # Check for common GitHub Actions issues
        if ($FilePath -like "*action.yml" -or $FilePath -like "*action.yaml") {
            if ($content -notmatch "name\s*:") {
                $issues += "GitHub Action missing 'name' field"
            }
            if ($content -notmatch "description\s*:") {
                $issues += "GitHub Action missing 'description' field"
            }
            if ($content -notmatch "runs\s*:") {
                $issues += "GitHub Action missing 'runs' field"
            }
        }
        
        return @{
            Valid   = ($issues.Count -eq 0)
            Message = if ($issues.Count -eq 0) { "VALID" } else { "Issues: " + ($issues -join "; ") }
        }
    }
    catch {
        return @{
            Valid   = $false
            Message = "Basic validation failed: $($_.Exception.Message)"
        }
    }
}

# Main validation function
function Test-YamlFile {
    param(
        [string]$FilePath,
        [string[]]$Validators
    )
    
    $relativePath = $FilePath.Replace("$((Get-Location).Path)\", "")
    Write-Host "Validating: $relativePath" -ForegroundColor Cyan
    
    $validationResults = @()
    
    # Try each available validator
    foreach ($validator in $Validators) {
        switch ($validator) {
            "python-yaml" {
                $result = Test-YamlWithPython -FilePath $FilePath
                $validationResults += @{
                    Validator = "Python PyYAML"
                    Result    = $result
                }
            }
            "powershell-yaml" {
                $result = Test-YamlWithPowerShell -FilePath $FilePath
                $validationResults += @{
                    Validator = "PowerShell YAML"
                    Result    = $result
                }
            }
            "yq" {
                $result = Test-YamlWithYq -FilePath $FilePath
                $validationResults += @{
                    Validator = "yq"
                    Result    = $result
                }
            }
        }
    }
    
    # Always run basic structure validation
    $basicResult = Test-YamlBasicStructure -FilePath $FilePath
    $validationResults += @{
        Validator = "Basic Structure"
        Result    = $basicResult
    }
    
    # Determine overall result
    $anyValid = $validationResults | Where-Object { $_.Result.Valid } | Measure-Object | Select-Object -ExpandProperty Count
    $overallValid = $anyValid -gt 0
    
    if ($Verbose) {
        foreach ($validation in $validationResults) {
            $status = if ($validation.Result.Valid) { "✅" } else { "❌" }
            Write-Host "  $status $($validation.Validator): $($validation.Result.Message)" -ForegroundColor $(if ($validation.Result.Valid) { "Green" } else { "Red" })
        }
    }
    else {
        if ($overallValid) {
            Write-Host "  ✅ Valid YAML" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ Invalid YAML" -ForegroundColor Red
            # Show first error message
            $firstError = $validationResults | Where-Object { -not $_.Result.Valid } | Select-Object -First 1
            if ($firstError) {
                Write-Host "    $($firstError.Result.Message)" -ForegroundColor Red
            }
        }
    }
    
    return $overallValid
}

# Main execution
if ($InstallTools) {
    Install-YamlTools
    Write-Host ""
}

# Get available validators
$availableValidators = Get-AvailableValidators

if ($availableValidators.Count -eq 0) {
    Write-Host "⚠️  No YAML validation tools found!" -ForegroundColor Yellow
    Write-Host "Run with -InstallTools to install validation tools, or install manually:" -ForegroundColor Yellow
    Write-Host "  - Python: pip install PyYAML" -ForegroundColor Yellow
    Write-Host "  - PowerShell: Install-Module powershell-yaml" -ForegroundColor Yellow
    Write-Host "  - yq: choco install yq or winget install mikefarah.yq" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Falling back to basic structure validation only..." -ForegroundColor Yellow
    $availableValidators = @()
}
else {
    Write-Host "Available validators: $($availableValidators -join ', ')" -ForegroundColor Green
}

# Find YAML files
$yamlFiles = Get-ChildItem -Path $Path -Recurse -Include "*.yml", "*.yaml" | 
Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*\.git\*" }

if ($yamlFiles.Count -eq 0) {
    Write-Host "No YAML files found in path: $Path" -ForegroundColor Yellow
    exit 0
}

Write-Host "`nFound $($yamlFiles.Count) YAML files to validate`n" -ForegroundColor Cyan

# Validate each file
$allValid = $true
$validCount = 0
$invalidCount = 0

foreach ($file in $yamlFiles) {
    $isValid = Test-YamlFile -FilePath $file.FullName -Validators $availableValidators
    
    if ($isValid) {
        $validCount++
    }
    else {
        $invalidCount++
        $allValid = $false
    }
}

# Summary
Write-Host "`n" + "="*50 -ForegroundColor Cyan
Write-Host "YAML Validation Summary" -ForegroundColor Cyan
Write-Host "="*50 -ForegroundColor Cyan
Write-Host "Total files: $($yamlFiles.Count)" -ForegroundColor White
Write-Host "Valid: $validCount" -ForegroundColor Green
Write-Host "Invalid: $invalidCount" -ForegroundColor $(if ($invalidCount -gt 0) { "Red" } else { "Green" })

if ($allValid) {
    Write-Host "`n✅ All YAML files are valid!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "`n❌ Some YAML files have validation errors!" -ForegroundColor Red
    Write-Host "Run with -Verbose for detailed error information" -ForegroundColor Yellow
    exit 1
}