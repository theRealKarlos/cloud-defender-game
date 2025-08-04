# Cloud Defenders - Development & Deployment Scripts

This folder contains scripts to help set up the development environment and deploy the Cloud Defenders game project to AWS.

## Quick Start

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

## What Gets Installed

### Core Development Tools

- **Node.js** (v22) - JavaScript runtime for frontend and backend
- **npm** (v10+) - Node package manager (comes with Node.js)
- **Terraform** (v1.12+) - Infrastructure as Code tool
- **AWS CLI** (v2.15+) - Command line interface for AWS services
- **Git** (v2.45+) - Version control system

### Additional Tools

- **Visual Studio Code** - Recommended code editor

### Project Dependencies

- **Frontend packages** - Game engine dependencies
- **Backend packages** - Lambda function dependencies

## Script Options

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

## Manual Installation

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

## Post-Installation Steps

After running the setup script:

### 1. Configure AWS CLI

```bash
aws configure
```

Enter your AWS credentials:

- Access Key ID
- Secret Access Key
- Default region (e.g., `eu-west-2`)
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

## Troubleshooting

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

## Script Files

### Setup Scripts
- `setup-dev-env.ps1` - Main PowerShell setup script
- `setup-dev-env.bat` - Batch wrapper for easier execution

### Core Deployment Scripts
- `deploy-all.ps1` - Complete deployment (infrastructure + frontend)
- `deploy-infra.ps1` - Deploy infrastructure only
- `deploy-frontend.ps1` - Deploy frontend only
- `destroy-infra.ps1` - Destroy all infrastructure

### Redeployment Scripts
- `redeploy-api.ps1` - Redeploy API Gateway module
- `redeploy-lambda.ps1` - Redeploy Lambda function
- `switch-hosting-mode.ps1` - Switch between hosting modes

### Testing Scripts
- `test-api.ps1` - Test API Gateway endpoints
- `test-lambda-direct.ps1` - Test Lambda function directly
- `check-api-integration.ps1` - Check API integration
- `check-lambda-logs.ps1` - Check Lambda function logs
- `diagnose-api.ps1` - Diagnose API issues

### Configuration Scripts
- `update-api-config.ps1` - Update API config (PowerShell)
- `update-api-config.js` - Update API config (Node.js)

### Code Quality & Security Scripts
- `lint-and-security.ps1` - Run linting and security checks
- `lint-and-security.bat` - Windows batch wrapper for linting
- `fix-lint-issues.ps1` - Auto-fix linting issues with ESLint
- `pre-deploy-checks.ps1` - Comprehensive pre-deployment validation

### Utility Scripts
- `fix-existing-resources.ps1` - Fix existing resource conflicts
- `deploy-without-cloudfront-simple.ps1` - Deploy without CloudFront

### Documentation
- `README.md` - This documentation file
- `deploy-commands.md` - Quick reference for deployment commands

## Deployment Scripts

### Complete Deployment (Recommended)

Deploy everything in one command:

```powershell
.\scripts\deploy-all.ps1
```

### Individual Deployment Steps

Deploy infrastructure and frontend separately:

```powershell
# Deploy AWS infrastructure (Lambda, API Gateway, DynamoDB, S3)
.\scripts\deploy-infra.ps1

# Deploy frontend files to S3
.\scripts\deploy-frontend.ps1
```

### Deployment Options

```powershell
# Deploy to different environments
.\scripts\deploy-all.ps1 -Environment prod -Region eu-west-1

# Destroy and redeploy (clean slate)
.\scripts\deploy-all.ps1 -DestroyFirst

# Deploy to specific AWS region
.\scripts\deploy-infra.ps1 -Region us-west-2
```

### Infrastructure Cleanup

Remove all AWS resources:

```powershell
# Interactive cleanup (recommended)
.\scripts\destroy-infra.ps1

# Force cleanup (no prompts)
.\scripts\destroy-infra.ps1 -Force
```

## Deployment Architecture

The deployment creates:

- **S3 Bucket** - Static website hosting for the game frontend
- **Lambda Function** - Node.js backend API for score management
- **API Gateway** - REST API endpoints for score submission and leaderboard
- **DynamoDB Table** - NoSQL database for storing player scores
- **IAM Roles & Policies** - Secure access permissions

## Updating Dependencies

To update project dependencies after initial setup:

```bash
# Update frontend dependencies
cd frontend && npm update

# Update backend dependencies
cd backend && npm update

# Update Terraform providers
cd infra && terraform init -upgrade
```

## Deployment Prerequisites

Before deploying:

1. **AWS CLI configured** with valid credentials
2. **Terraform installed** (v1.12+)
3. **Node.js installed** (v20+) for Lambda packaging
4. **Proper AWS permissions** for creating resources

### Required AWS Permissions

Your AWS user/role needs permissions for:

- S3 (bucket creation, file upload)
- Lambda (function creation, code deployment)
- API Gateway (REST API creation)
- DynamoDB (table creation)
- IAM (role and policy creation)
- CloudWatch (log group creation)

## Post-Deployment

After successful deployment:

1. **Game URL** - Access your deployed game via the S3 website URL
2. **API Endpoints** - Backend API available via API Gateway URL
3. **Monitoring** - Check CloudWatch logs for Lambda function
4. **Testing** - Submit scores and view leaderboard functionality

## Deployment Troubleshooting

**AWS Credentials Error**

```powershell
aws configure
# Enter your Access Key ID, Secret Access Key, and region
```

**Terraform State Issues**

```powershell
# Reset Terraform state (use with caution)
cd infra
Remove-Item .terraform -Recurse -Force
terraform init
```

**Lambda Deployment Package Issues**

```powershell
# Manually rebuild Lambda package
cd backend
Remove-Item node_modules -Recurse -Force
npm install --production
```

**S3 Bucket Already Exists**

- Bucket names must be globally unique
- Change the project name or add a suffix
- Or destroy existing resources first
## Code Quality & Security

The project includes comprehensive linting and security checking:

### ESLint Configuration
- **Frontend**: Configured with game-specific rules and browser globals
- **Backend**: Configured with Node.js/Lambda-specific rules and security checks

### Available Commands
```powershell
# Run all checks
.\scripts\lint-and-security.ps1

# Auto-fix linting issues
.\scripts\lint-and-security.ps1 -Fix

# Auto-fix linting issues
.\scripts\fix-lint-issues.ps1

# Run only linting (no security audit)
.\scripts\lint-and-security.ps1 -LintOnly

# Run only security audit
.\scripts\lint-and-security.ps1 -SecurityOnly

# Comprehensive pre-deployment checks
.\scripts\pre-deploy-checks.ps1
```

### Individual Project Commands
```bash
# Frontend
cd frontend
npm run lint          # Check and fix linting issues
npm run lint:check     # Check linting only (no fixes)
npm run security       # Run security audit
npm run check          # Run all checks (lint + security + tests)

# Backend
cd backend
npm run lint           # Check and fix linting issues
npm run lint:check     # Check linting only (no fixes)
npm run security       # Run security audit
```

### Pre-Deployment Workflow
```powershell
# 1. Run comprehensive checks
.\scripts\pre-deploy-checks.ps1

# 2. If checks pass, deploy
.\scripts\deploy-all.ps1
```