# Cloud Defenders Game - Development Environment Setup Script
# PowerShell script to install all required dependencies and tools

param(
    [switch]$SkipChocolatey,
    [switch]$SkipNodeModules,
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Enable verbose output if requested
if ($Verbose) {
    $VerbosePreference = "Continue"
}

Write-Host "🎮 Cloud Defenders - Development Environment Setup" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to install Chocolatey
function Install-Chocolatey {
    Write-Host "📦 Installing Chocolatey package manager..." -ForegroundColor Yellow
    
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Host "✅ Chocolatey is already installed" -ForegroundColor Green
        return
    }
    
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Host "✅ Chocolatey installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Error "❌ Failed to install Chocolatey: $($_.Exception.Message)"
        exit 1
    }
}

# Function to install a package via Chocolatey
function Install-ChocoPackage {
    param([string]$PackageName, [string]$DisplayName)
    
    Write-Host "📦 Installing $DisplayName..." -ForegroundColor Yellow
    
    try {
        choco install $PackageName -y --no-progress
        Write-Host "✅ $DisplayName installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Warning "⚠️ Failed to install $DisplayName via Chocolatey"
        return $false
    }
    return $true
}

# Function to check if Node.js is installed with version check
function Test-NodeJS {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            $versionNumber = $nodeVersion -replace 'v', ''
            $majorVersion = [int]($versionNumber.Split('.')[0])
            
            if ($majorVersion -ge 22) {
                Write-Host "✅ Node.js is installed: $nodeVersion (Latest)" -ForegroundColor Green
                return $true
            } else {
                Write-Host "⚠️ Node.js $nodeVersion is installed but v22+ is recommended for AWS Lambda compatibility" -ForegroundColor Yellow
                return $true
            }
        }
    }
    catch {
        return $false
    }
    return $false
}

# Function to check if Terraform is installed with version check
function Test-Terraform {
    try {
        $terraformOutput = terraform --version 2>$null
        if ($terraformOutput) {
            $versionLine = $terraformOutput.Split("`n")[0]
            $versionMatch = $versionLine -match 'v(\d+\.\d+)'
            
            if ($versionMatch) {
                $version = [version]$matches[1]
                $requiredVersion = [version]"1.12"
                
                if ($version -ge $requiredVersion) {
                    Write-Host "✅ Terraform is installed: $versionLine" -ForegroundColor Green
                    return $true
                } else {
                    Write-Host "⚠️ Terraform $versionLine is installed but v1.12+ is recommended" -ForegroundColor Yellow
                    return $true
                }
            } else {
                Write-Host "✅ Terraform is installed: $versionLine" -ForegroundColor Green
                return $true
            }
        }
    }
    catch {
        return $false
    }
    return $false
}

# Function to check if AWS CLI is installed with version check
function Test-AWSCLI {
    try {
        $awsVersion = aws --version 2>$null
        if ($awsVersion) {
            $versionMatch = $awsVersion -match 'aws-cli/(\d+\.\d+)'
            
            if ($versionMatch) {
                $version = [version]$matches[1]
                $requiredVersion = [version]"2.15"
                
                if ($version -ge $requiredVersion) {
                    Write-Host "✅ AWS CLI is installed: $awsVersion" -ForegroundColor Green
                    return $true
                } else {
                    Write-Host "⚠️ AWS CLI $awsVersion is installed but v2.15+ is recommended" -ForegroundColor Yellow
                    return $true
                }
            } else {
                Write-Host "✅ AWS CLI is installed: $awsVersion" -ForegroundColor Green
                return $true
            }
        }
    }
    catch {
        return $false
    }
    return $false
}

# Function to install Node.js modules
function Install-NodeModules {
    Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
    
    # Frontend dependencies
    if (Test-Path "frontend/package.json") {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
        Push-Location "frontend"
        try {
            npm install
            Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
        }
        catch {
            Write-Warning "⚠️ Failed to install frontend dependencies"
        }
        finally {
            Pop-Location
        }
    }
    
    # Backend dependencies
    if (Test-Path "backend/package.json") {
        Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
        Push-Location "backend"
        try {
            npm install
            Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
        }
        catch {
            Write-Warning "⚠️ Failed to install backend dependencies"
        }
        finally {
            Pop-Location
        }
    }
}

# Function to verify installations
function Test-Installation {
    Write-Host "🔍 Verifying installations..." -ForegroundColor Yellow
    
    $allGood = $true
    
    # Check Node.js
    if (-not (Test-NodeJS)) {
        Write-Host "❌ Node.js verification failed" -ForegroundColor Red
        $allGood = $false
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-Host "✅ npm is available: v$npmVersion" -ForegroundColor Green
        }
        else {
            Write-Host "❌ npm verification failed" -ForegroundColor Red
            $allGood = $false
        }
    }
    catch {
        Write-Host "❌ npm verification failed" -ForegroundColor Red
        $allGood = $false
    }
    
    # Check Terraform
    if (-not (Test-Terraform)) {
        Write-Host "❌ Terraform verification failed" -ForegroundColor Red
        $allGood = $false
    }
    
    # Check AWS CLI
    if (-not (Test-AWSCLI)) {
        Write-Host "❌ AWS CLI verification failed" -ForegroundColor Red
        $allGood = $false
    }
    
    # Check Git
    try {
        $gitVersion = git --version 2>$null
        if ($gitVersion) {
            Write-Host "✅ Git is available: $gitVersion" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Git verification failed" -ForegroundColor Red
            $allGood = $false
        }
    }
    catch {
        Write-Host "❌ Git verification failed" -ForegroundColor Red
        $allGood = $false
    }
    
    return $allGood
}

# Main execution
try {
    # Check if running as administrator
    if (-not (Test-Administrator)) {
        Write-Host "⚠️ This script should be run as Administrator for best results" -ForegroundColor Yellow
        Write-Host "Some installations may fail without elevated privileges" -ForegroundColor Yellow
        $continue = Read-Host "Continue anyway? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Host "Exiting. Please run as Administrator." -ForegroundColor Red
            exit 1
        }
    }
    
    # Install Chocolatey if not skipped
    if (-not $SkipChocolatey) {
        Install-Chocolatey
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    }
    
    Write-Host "`n🛠️ Installing development tools..." -ForegroundColor Cyan
    
    # Install Node.js latest if not present
    if (-not (Test-NodeJS)) {
        Install-ChocoPackage "nodejs" "Node.js (v22 latest)"
    }
    
    # Install latest Terraform if not present
    if (-not (Test-Terraform)) {
        Install-ChocoPackage "terraform" "Terraform (latest)"
    }
    
    # Install latest AWS CLI if not present
    if (-not (Test-AWSCLI)) {
        Install-ChocoPackage "awscli" "AWS CLI (latest)"
    }
    
    # Install Git if not present
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Install-ChocoPackage "git" "Git"
    }
    
    # Install additional useful tools
    Write-Host "`n🔧 Installing additional development tools..." -ForegroundColor Cyan
    Install-ChocoPackage "vscode" "Visual Studio Code"
    Install-ChocoPackage "postman" "Postman"
    Install-ChocoPackage "7zip" "7-Zip"
    
    # Refresh environment variables again
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    # Install Node.js modules if not skipped
    if (-not $SkipNodeModules) {
        Write-Host "`n📦 Installing project dependencies..." -ForegroundColor Cyan
        Install-NodeModules
    }
    
    # Verify installations
    Write-Host "`n🔍 Final verification..." -ForegroundColor Cyan
    $success = Test-Installation
    
    if ($success) {
        Write-Host "`n🎉 Development environment setup completed successfully!" -ForegroundColor Green
        Write-Host "=================================================" -ForegroundColor Green
        Write-Host "Installed versions:" -ForegroundColor Yellow
        Write-Host "- Node.js: $(node --version 2>$null)" -ForegroundColor White
        Write-Host "- Terraform: $(terraform --version 2>$null | Select-Object -First 1)" -ForegroundColor White
        Write-Host "- AWS CLI: $(aws --version 2>$null)" -ForegroundColor White
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Configure AWS CLI: aws configure" -ForegroundColor White
        Write-Host "2. Start frontend dev server: cd frontend && npm run dev" -ForegroundColor White
        Write-Host "3. Initialise Terraform: cd infra && terraform init" -ForegroundColor White
        Write-Host "4. Open project in VS Code: code ." -ForegroundColor White
    }
    else {
        Write-Host "`n⚠️ Setup completed with some issues" -ForegroundColor Yellow
        Write-Host "Please check the error messages above and install missing tools manually" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "`n❌ Setup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nSetup script completed. Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")