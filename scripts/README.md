# Cloud Defenders - Development & Deployment Scripts

This directory contains organised scripts for building, deploying, testing, and maintaining the Cloud Defenders game project.

## Directory Structure

```
scripts/
├── build/           # Build and packaging scripts
├── deploy/          # Deployment scripts
├── quality/         # Code quality and testing scripts
├── utils/           # Utility and maintenance scripts
├── setup-dev-env.ps1  # Development environment setup
└── README.md        # This documentation
```

## Quick Start

### 1. Setup Development Environment

```powershell
# Run as Administrator for best results
.\scripts\setup-dev-env.ps1
```

### 2. Build the Project

```powershell
# Build backend deployment package
.\scripts\build\build-backend.ps1

# Build frontend (when needed)
.\scripts\build\build-frontend.ps1
```

### 3. Deploy to AWS

```powershell
# Deploy everything
.\scripts\deploy\deploy-all.ps1

# Or deploy components separately
.\scripts\deploy\deploy-infra.ps1
.\scripts\deploy\deploy-backend.ps1
.\scripts\deploy\deploy-frontend.ps1
```

### 4. Run Quality Checks

```powershell
# Run all quality checks
.\scripts\quality\run-lint.ps1

# Run tests
.\scripts\quality\run-tests.ps1
```

## Build Scripts

### `build/build-backend.ps1`
Creates an optimised Lambda deployment package.

**Usage:**
```powershell
.\scripts\build\build-backend.ps1 [-Environment <string>]
```

**Parameters:**
- `-Environment`: Build environment (default: "production")

**Output:** Creates `dist/score_api.zip` with production dependencies only.

## Deploy Scripts

### `deploy/deploy-all.ps1`
Complete deployment of infrastructure and frontend.

**Usage:**
```powershell
.\scripts\deploy\deploy-all.ps1 [-Environment <string>] [-Region <string>] [-DestroyFirst]
```

**Parameters:**
- `-Environment`: Deployment environment (default: "dev")
- `-Region`: AWS region (default: "eu-west-2")
- `-DestroyFirst`: Destroy existing infrastructure before deploying

### `deploy/deploy-infra.ps1`
Deploy AWS infrastructure (Lambda, API Gateway, DynamoDB, S3).

**Usage:**
```powershell
.\scripts\deploy\deploy-infra.ps1 [-Environment <string>] [-Region <string>]
```

### `deploy/deploy-backend.ps1`
Deploy backend components (Lambda and API Gateway).

**Usage:**
```powershell
.\scripts\deploy\deploy-backend.ps1 [-Environment <string>] [-Region <string>] [-LambdaOnly] [-ApiOnly]
```

**Parameters:**
- `-LambdaOnly`: Deploy only Lambda function
- `-ApiOnly`: Deploy only API Gateway

### `deploy/deploy-frontend.ps1`
Deploy frontend files to S3 hosting.

**Usage:**
```powershell
.\scripts\deploy\deploy-frontend.ps1 [-Environment <string>] [-Region <string>]
```

## Quality Scripts

### `quality/run-lint.ps1`
Run linting, YAML validation, and security checks across all projects.

**Usage:**
```powershell
.\scripts\quality\run-lint.ps1 [-Fix] [-SecurityOnly] [-LintOnly]
```

**Parameters:**
- `-Fix`: Auto-fix linting issues
- `-SecurityOnly`: Run only security audits
- `-LintOnly`: Run only linting checks

**Features:**
- YAML validation for GitHub Actions and configuration files
- JavaScript/Node.js linting for frontend and backend
- Security audits using npm audit
- Comprehensive error reporting

### `quality/validate-yaml.ps1`
Dedicated YAML validation for all project configuration files.

**Usage:**
```powershell
.\scripts\quality\validate-yaml.ps1 [-Verbose] [-InstallTools] [-Path <string>]
```

**Parameters:**
- `-Verbose`: Show detailed validation results for each file
- `-InstallTools`: Install YAML validation tools (PyYAML, yq, PowerShell YAML)
- `-Path`: Specify custom path to validate (default: current directory)

**Features:**
- Multiple validation methods (Python PyYAML, yq, PowerShell YAML, basic structure)
- GitHub Actions specific validation (checks for required fields)
- Automatic tool installation support
- Detailed error reporting with line numbers
- Validates all YAML files excluding node_modules

### `quality/run-tests.ps1`
Run comprehensive tests for API and Lambda function.

**Usage:**
```powershell
.\scripts\quality\run-tests.ps1 [-Environment <string>] [-Region <string>] [-ApiOnly] [-LambdaOnly] [-LogsOnly] [-DiagnoseOnly]
```

**Parameters:**
- `-ApiOnly`: Test only API endpoints
- `-LambdaOnly`: Test only Lambda function directly
- `-LogsOnly`: Check only Lambda logs
- `-DiagnoseOnly`: Run only diagnostics

## Utility Scripts

### `utils/destroy-infra.ps1`
Destroy all AWS infrastructure.

**Usage:**
```powershell
.\scripts\utils\destroy-infra.ps1 [-Force]
```

**Parameters:**
- `-Force`: Skip confirmation prompts

### `health-check.ps1`
Perform post-deployment health checks for both frontend and backend.

**Usage:**
```powershell
.\scripts\health-check.ps1 [-Environment <string>] [-Region <string>]
```

**Parameters:**
- `-Environment`: Environment to check (default: "production")
- `-Region`: AWS region (default: "eu-west-2")

**Features:**
- Frontend health check (HTTP status and response time)
- Backend health check (Lambda function invocation)
- Comprehensive reporting with pass/fail status
- Used by CI/CD pipeline for deployment verification

### `rollback-manager.ps1`
Manage manual rollbacks for both frontend and backend deployments.

**Usage:**
```powershell
# Rollback backend to specific version
.\scripts\rollback-manager.ps1 -Component "backend" -Environment "production" -FunctionName "my-function" -PreviousVersion "5"

# Rollback frontend to specific origin path
.\scripts\rollback-manager.ps1 -Component "frontend" -Environment "production" -CloudFrontDistributionId "E123456789" -PreviousOriginPath "/v20231201-12345678"

# Rollback both components
.\scripts\rollback-manager.ps1 -Component "both" -Environment "production" -FunctionName "my-function" -PreviousVersion "5" -CloudFrontDistributionId "E123456789" -PreviousOriginPath "/v20231201-12345678"
```

**Parameters:**
- `-Component`: Component to rollback ("frontend", "backend", or "both")
- `-Environment`: Environment to rollback (default: "production")
- `-FunctionName`: Lambda function name (for backend rollback)
- `-PreviousVersion`: Previous Lambda version number
- `-CloudFrontDistributionId`: CloudFront distribution ID (for frontend rollback)
- `-PreviousOriginPath`: Previous CloudFront origin path

**Features:**
- Backend rollback: Reverts Lambda alias to previous version
- Frontend rollback: Reverts CloudFront origin path to previous version
- Comprehensive error handling and reporting
- Supports both individual and combined rollbacks

### `utils/fix-existing-resources.ps1`
Fix conflicts with existing AWS resources.

**Usage:**
```powershell
.\scripts\utils\fix-existing-resources.ps1
```

### `utils/switch-hosting-mode.ps1`
Switch between different hosting configurations.

**Usage:**
```powershell
.\scripts\utils\switch-hosting-mode.ps1 [-Mode <string>]
```

### `utils/deploy-without-cloudfront-simple.ps1`
Deploy without CloudFront distribution.

**Usage:**
```powershell
.\scripts\utils\deploy-without-cloudfront-simple.ps1
```

## Development Environment Setup

### `setup-dev-env.ps1`
Automated setup of development environment.

**What it installs:**
- Node.js (v22)
- npm (v10+)
- Terraform (v1.12+)
- AWS CLI (v2.15+)
- Git (v2.45+)
- Visual Studio Code

**Usage:**
```powershell
.\scripts\setup-dev-env.ps1 [-SkipChocolatey] [-SkipNodeModules] [-Verbose]
```

**Parameters:**
- `-SkipChocolatey`: Skip Chocolatey installation
- `-SkipNodeModules`: Skip Node.js module installation
- `-Verbose`: Enable verbose output

## Common Workflows

### Initial Setup
```powershell
# 1. Setup development environment
.\scripts\setup-dev-env.ps1

# 2. Configure AWS CLI
aws configure

# 3. Deploy everything
.\scripts\deploy\deploy-all.ps1
```

### Development Workflow
```powershell
# 1. Run quality checks
.\scripts\quality\run-lint.ps1

# 2. Run tests
.\scripts\quality\run-tests.ps1

# 3. Build backend
.\scripts\build\build-backend.ps1

# 4. Deploy backend
.\scripts\deploy\deploy-backend.ps1

# 5. Deploy frontend
.\scripts\deploy\deploy-frontend.ps1
```

### Troubleshooting
```powershell
# Check API status
.\scripts\quality\run-tests.ps1 -DiagnoseOnly

# Check Lambda logs
.\scripts\quality\run-tests.ps1 -LogsOnly

# Fix existing resources
.\scripts\utils\fix-existing-resources.ps1
```

## Prerequisites

### Required Tools
- PowerShell 5.1 or later
- Administrator privileges (for setup)
- Internet connection
- AWS account with appropriate permissions

### AWS Permissions
Your AWS user/role needs permissions for:
- S3 (bucket creation, file upload)
- Lambda (function creation, code deployment)
- API Gateway (REST API creation)
- DynamoDB (table creation)
- IAM (role and policy creation)
- CloudWatch (log group creation)

## Troubleshooting

### Common Issues

**PowerShell Execution Policy Error**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**AWS Credentials Error**
```powershell
aws configure
```

**Terraform State Issues**
```powershell
cd infra
Remove-Item .terraform -Recurse -Force
terraform init
```

**Build Package Issues**
```powershell
cd backend
Remove-Item node_modules -Recurse -Force
npm install --production
```

## Script Maintenance

### Adding New Scripts
1. Place scripts in appropriate subdirectory
2. Update this README with usage documentation
3. Follow existing naming conventions
4. Include parameter documentation

### Script Standards
- Use PowerShell for all scripts
- Include parameter validation
- Provide clear error messages
- Use consistent colour coding
- Include usage examples in comments

## Architecture Overview

The deployment creates:
- **S3 Bucket**: Static website hosting for the game frontend
- **Lambda Function**: Node.js backend API for score management
- **API Gateway**: REST API endpoints for score submission and leaderboard
- **DynamoDB Table**: NoSQL database for storing player scores
- **IAM Roles & Policies**: Secure access permissions

## Support

For issues with scripts:
1. Check the error messages in the script output
2. Verify you're running as Administrator (for setup)
3. Ensure internet connection is stable
4. Check AWS credentials are configured correctly
5. Review the troubleshooting section above