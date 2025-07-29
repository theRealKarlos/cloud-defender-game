# Cloud Defenders - Development Scripts

This folder contains scripts to help set up and manage the development environment for the Cloud Defenders game project.

## 🚀 Quick Start

### Windows (Recommended)
Run as Administrator for best results:
```cmd
scripts\setup-dev-env.bat
```

### PowerShell Direct
```powershell
Set-ExecutionPolicy Bypass -Scope Process
.\scripts\setup-dev-env.ps1
```

## 📋 What Gets Installed

### Core Development Tools
- **Node.js** (v22) - JavaScript runtime for frontend and backend
- **npm** (v10+) - Node package manager (comes with Node.js)
- **Terraform** (v1.12+) - Infrastructure as Code tool
- **AWS CLI** (v2.15+) - Command line interface for AWS services
- **Git** (v2.45+) - Version control system

### Additional Tools
- **Visual Studio Code** - Recommended code editor
- **Postman** - API testing tool
- **7-Zip** - File compression utility

### Project Dependencies
- **Frontend packages** - Game engine dependencies
- **Backend packages** - Lambda function dependencies

## 🛠️ Script Options

### Parameters
```powershell
# Skip Chocolatey installation (if already installed)
.\setup-dev-env.ps1 -SkipChocolatey

# Skip Node.js module installation
.\setup-dev-env.ps1 -SkipNodeModules

# Enable verbose output
.\setup-dev-env.ps1 -Verbose

# Combine options
.\setup-dev-env.ps1 -SkipChocolatey -Verbose
```

## 🔧 Manual Installation

If the automated script fails, install these tools manually:

### 1. Node.js
- Download from: https://nodejs.org/
- Choose latest version (v22 or later)
- Verify: `node --version`

### 2. Terraform
- Download from: https://www.terraform.io/downloads
- Choose latest stable version (v1.12+)
- Add to PATH environment variable
- Verify: `terraform --version`

### 3. AWS CLI
- Download from: https://aws.amazon.com/cli/
- Follow installation guide for Windows
- Verify: `aws --version`

### 4. Git
- Download from: https://git-scm.com/
- Use default installation options
- Verify: `git --version`

## 🎯 Post-Installation Steps

After running the setup script:

### 1. Configure AWS CLI
```bash
aws configure
```
Enter your AWS credentials:
- Access Key ID
- Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

### 2. Verify Installation
```bash
# Check Node.js and npm
node --version
npm --version

# Check Terraform
terraform --version

# Check AWS CLI
aws --version

# Check Git
git --version
```

### 3. Start Development
```bash
# Install project dependencies (if not done by script)
cd frontend && npm install
cd ../backend && npm install

# Start frontend development server
cd frontend && npm run dev

# Initialize Terraform
cd infra && terraform init
```

## 🐛 Troubleshooting

### Common Issues

**PowerShell Execution Policy Error**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Chocolatey Installation Fails**
- Run PowerShell as Administrator
- Check internet connection
- Temporarily disable antivirus

**Node.js Installation Issues**
- Download directly from nodejs.org
- Use the Windows Installer (.msi)
- Restart terminal after installation

**PATH Environment Variable**
- Close and reopen terminal/command prompt
- Log out and log back in to Windows
- Manually add tool directories to PATH

### Getting Help

1. Check the error messages in the script output
2. Verify you're running as Administrator
3. Ensure internet connection is stable
4. Try manual installation for failed components

## 📁 Script Files

- `setup-dev-env.ps1` - Main PowerShell setup script
- `setup-dev-env.bat` - Batch wrapper for easier execution
- `README.md` - This documentation file

## 🔄 Updating Dependencies

To update project dependencies after initial setup:

```bash
# Update frontend dependencies
cd frontend && npm update

# Update backend dependencies
cd backend && npm update

# Update Terraform providers
cd infra && terraform init -upgrade
```