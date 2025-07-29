# Cloud Defenders Game - Development Environment Setup Script
param(
    [switch]$SkipChocolatey,
    [switch]$SkipNodeModules,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

if ($Verbose) {
    $VerbosePreference = "Continue"
}

Write-Host "Cloud Defenders - Development Environment Setup" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-Chocolatey {
    Write-Host "Installing Chocolatey package manager..." -ForegroundColor Yellow
    
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Host "Chocolatey is already installed" -ForegroundColor Green
        return
    }
    
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Host "Chocolatey installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to install Chocolatey: $($_.Exception.Message)"
        exit 1
    }
}

function Install-ChocoPackage {
    param([string]$PackageName, [string]$DisplayName)
    
    Write-Host "Installing $DisplayName..." -ForegroundColor Yellow
    
    try {
        choco install $PackageName -y --no-progress
        Write-Host "$DisplayName installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Warning "Failed to install $DisplayName via Chocolatey"
        return $false
    }
    return $true
}

function Test-NodeJS {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "Node.js is installed: $nodeVersion" -ForegroundColor Green
            return $true
        }
    }
    catch {
        return $false
    }
    return $false
}

function Test-Terraform {
    try {
        $terraformOutput = terraform --version 2>$null
        if ($terraformOutput) {
            $versionLine = $terraformOutput.Split("`n")[0]
            Write-Host "Terraform is installed: $versionLine" -ForegroundColor Green
            return $true
        }
    }
    catch {
        return $false
    }
    return $false
}

function Test-AWSCLI {
    try {
        $awsVersion = aws --version 2>$null
        if ($awsVersion) {
            Write-Host "AWS CLI is installed: $awsVersion" -ForegroundColor Green
            return $true
        }
    }
    catch {
        return $false
    }
    return $false
}

function Install-NodeModules {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
    
    if (Test-Path "frontend/package.json") {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
        Push-Location "frontend"
        try {
            npm install
            Write-Host "Frontend dependencies installed" -ForegroundColor Green
        }
        catch {
            Write-Warning "Failed to install frontend dependencies"
        }
        finally {
            Pop-Location
        }
    }
    
    if (Test-Path "backend/package.json") {
        Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
        Push-Location "backend"
        try {
            npm install
            Write-Host "Backend dependencies installed" -ForegroundColor Green
        }
        catch {
            Write-Warning "Failed to install backend dependencies"
        }
        finally {
            Pop-Location
        }
    }
}

function Test-Installation {
    Write-Host "Verifying installations..." -ForegroundColor Yellow
    
    $allGood = $true
    
    if (-not (Test-NodeJS)) {
        Write-Host "Node.js verification failed" -ForegroundColor Red
        $allGood = $false
    }
    
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-Host "npm is available: v$npmVersion" -ForegroundColor Green
        }
        else {
            Write-Host "npm verification failed" -ForegroundColor Red
            $allGood = $false
        }
    }
    catch {
        Write-Host "npm verification failed" -ForegroundColor Red
        $allGood = $false
    }
    
    if (-not (Test-Terraform)) {
        Write-Host "Terraform verification failed" -ForegroundColor Red
        $allGood = $false
    }
    
    if (-not (Test-AWSCLI)) {
        Write-Host "AWS CLI verification failed" -ForegroundColor Red
        $allGood = $false
    }
    
    try {
        $gitVersion = git --version 2>$null
        if ($gitVersion) {
            Write-Host "Git is available: $gitVersion" -ForegroundColor Green
        }
        else {
            Write-Host "Git verification failed" -ForegroundColor Red
            $allGood = $false
        }
    }
    catch {
        Write-Host "Git verification failed" -ForegroundColor Red
        $allGood = $false
    }
    
    return $allGood
}

# Main execution
try {
    if (-not (Test-Administrator)) {
        Write-Host "Note: Running without Administrator privileges" -ForegroundColor Yellow
        Write-Host "Some installations may require manual intervention" -ForegroundColor Yellow
    }
    else {
        Write-Host "Running with Administrator privileges" -ForegroundColor Green
    }
    
    if (-not $SkipChocolatey) {
        Install-Chocolatey
        
        $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
        $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
        $env:Path = $machinePath + ";" + $userPath
    }
    
    Write-Host ""
    Write-Host "Installing development tools..." -ForegroundColor Cyan
    
    if (-not (Test-NodeJS)) {
        Install-ChocoPackage "nodejs" "Node.js (v22 latest)"
    }
    
    if (-not (Test-Terraform)) {
        Install-ChocoPackage "terraform" "Terraform (latest)"
    }
    
    if (-not (Test-AWSCLI)) {
        Install-ChocoPackage "awscli" "AWS CLI (latest)"
    }
    
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Install-ChocoPackage "git" "Git"
    }
    
    Write-Host ""
    Write-Host "Installing additional development tools..." -ForegroundColor Cyan
    Install-ChocoPackage "vscode" "Visual Studio Code"
    
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = $machinePath + ";" + $userPath
    
    if (-not $SkipNodeModules) {
        Write-Host ""
        Write-Host "Installing project dependencies..." -ForegroundColor Cyan
        Install-NodeModules
    }
    
    Write-Host ""
    Write-Host "Final verification..." -ForegroundColor Cyan
    $success = Test-Installation
    
    if ($success) {
        Write-Host ""
        Write-Host "Development environment setup completed successfully!" -ForegroundColor Green
        Write-Host "=================================================" -ForegroundColor Green
        Write-Host "Installed versions:" -ForegroundColor Yellow
        
        $nodeVer = node --version 2>$null
        if ($nodeVer) { Write-Host "- Node.js: $nodeVer" -ForegroundColor White }
        
        $terraVer = terraform --version 2>$null
        if ($terraVer) { Write-Host "- Terraform: $($terraVer.Split("`n")[0])" -ForegroundColor White }
        
        $awsVer = aws --version 2>$null
        if ($awsVer) { Write-Host "- AWS CLI: $awsVer" -ForegroundColor White }
        
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Configure AWS CLI: aws configure" -ForegroundColor White
        Write-Host "2. Start frontend dev server: cd frontend; npm run dev" -ForegroundColor White
        Write-Host "3. Initialise Terraform: cd infra; terraform init" -ForegroundColor White
        Write-Host "4. Open project in VS Code: code ." -ForegroundColor White
    }
    else {
        Write-Host ""
        Write-Host "Setup completed with some issues" -ForegroundColor Yellow
        Write-Host "Please check the error messages above and install missing tools manually" -ForegroundColor Yellow
    }
}
catch {
    Write-Host ""
    Write-Host "Setup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setup script completed. Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")