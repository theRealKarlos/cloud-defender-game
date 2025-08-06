#!/usr/bin/env pwsh
# Cloud Defenders Infrastructure Deployment Script

param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Profile,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory = $false)]
    [string]$Region = "eu-west-2",
    
    [Parameter(Mandatory = $false)]
    [string]$ProjectName = "cloud-defenders",
    
    [Parameter(Mandatory = $false)]
    [switch]$DestroyFirst = $false,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipBackend = $false
)

Write-Host "Cloud Defenders Infrastructure Deployment" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Project: $ProjectName" -ForegroundColor Yellow

# Set AWS profile environment variable
$env:AWS_PROFILE = $Profile
Write-Host "Using AWS Profile: $Profile" -ForegroundColor Yellow

# Check if Terraform is installed
if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
    Write-Error "Terraform is not installed or not in PATH"
    exit 1
}

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is not installed or not in PATH"
    exit 1
}

# Check AWS credentials
try {
    $awsAccount = aws sts get-caller-identity --query Account --output text --profile $Profile 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "AWS credentials not configured"
    }
    Write-Host "AWS Account: $awsAccount" -ForegroundColor Green
}
catch {
    Write-Error "AWS credentials not configured. Run 'aws configure' first."
    exit 1
}

# Navigate to infrastructure directory
$infraDir = Join-Path $PSScriptRoot ".." ".." "infra"
if (-not (Test-Path $infraDir)) {
    Write-Error "Infrastructure directory not found: $infraDir"
    exit 1
}

Set-Location $infraDir
Write-Host "Working directory: $infraDir" -ForegroundColor Blue

# Check for Lambda deployment package
Write-Host "📦 Checking for Lambda deployment package..." -ForegroundColor Blue
$lambdaZipPath = Join-Path $PSScriptRoot ".." ".." "dist" "score_api.zip"
if (-not (Test-Path $lambdaZipPath)) {
    Write-Error "Lambda deployment package not found: $lambdaZipPath"
    Write-Host "Please run 'scripts/build/build-backend.ps1' first to build the Lambda package." -ForegroundColor Yellow
    exit 1
}
Write-Host "Lambda deployment package found: $lambdaZipPath" -ForegroundColor Green

# ============================================================================
# TERRAFORM INITIALISATION WITH DYNAMIC BACKEND
# ============================================================================
# Initialise Terraform with environment-specific backend configuration.
# This ensures each environment (dev, production) uses its own isolated
# state file, preventing state corruption and accidental deployments.
#
# The -backend-config flag overrides the generic key in backend.tf with
# the environment-specific path, ensuring proper state isolation.
# ============================================================================
Write-Host "Initialising Terraform for environment: $Environment..." -ForegroundColor Blue
$backendKey = "cloud-defenders/envs/$Environment/terraform.tfstate"
Write-Host "Using backend key: $backendKey" -ForegroundColor Yellow

terraform init -backend-config="key=$backendKey"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Terraform initialisation failed"
    exit 1
}

# Destroy existing infrastructure if requested
if ($DestroyFirst) {
    Write-Host "💥 Destroying existing infrastructure..." -ForegroundColor Red
    terraform destroy -auto-approve `
        -var="environment=$Environment" `
        -var="aws_region=$Region" `
        -var="project_name=$ProjectName" `
        -var="aws_profile=$Profile"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Terraform destroy had issues, continuing..."
    }
}

# Plan the deployment
Write-Host "Planning Terraform deployment..." -ForegroundColor Blue
terraform plan `
    -var="environment=$Environment" `
    -var="aws_region=$Region" `
    -var="project_name=$ProjectName" `
    -var="aws_profile=$Profile" `
    -out="tfplan"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Terraform planning failed"
    exit 1
}

# Apply the deployment
Write-Host "Applying Terraform deployment..." -ForegroundColor Blue
terraform apply tfplan

if ($LASTEXITCODE -ne 0) {
    Write-Error "Terraform deployment failed"
    exit 1
}

# Get outputs
Write-Host "📤 Getting deployment outputs..." -ForegroundColor Blue
$apiUrl = terraform output -raw api_gateway_url
$s3Url = terraform output -raw s3_website_url
$lambdaName = terraform output -raw lambda_function_name
$dynamoTable = terraform output -raw dynamodb_table_name

Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Deployment Summary:" -ForegroundColor Cyan
Write-Host "  • API Gateway URL: $apiUrl" -ForegroundColor White
Write-Host "  • S3 Website URL: $s3Url" -ForegroundColor White
Write-Host "  • Lambda Function: $lambdaName" -ForegroundColor White
Write-Host "  • DynamoDB Table: $dynamoTable" -ForegroundColor White

# Update frontend API configuration
if (-not $SkipBackend) {
    Write-Host ""
    Write-Host "Updating frontend API configuration..." -ForegroundColor Blue
    $updateScript = Join-Path $PSScriptRoot ".." "utils" "update-api-config.ps1"
    if (Test-Path $updateScript) {
        & $updateScript -Profile $Profile
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Frontend API configuration updated successfully" -ForegroundColor Green
        }
        else {
            Write-Warning "Failed to update frontend API configuration"
        }
    }
    else {
        Write-Warning "update-api-config.ps1 script not found."
    }
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Upload frontend files to S3: scripts/deploy-frontend.ps1" -ForegroundColor White
Write-Host "  2. Test the game at: $s3Url" -ForegroundColor White
Write-Host "  3. API endpoints available at: $apiUrl" -ForegroundColor White

Write-Host ""
Write-Host "✨ Happy Gaming! ✨" -ForegroundColor Magenta