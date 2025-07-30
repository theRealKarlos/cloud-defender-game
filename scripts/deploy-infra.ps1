#!/usr/bin/env pwsh
# Cloud Defenders Infrastructure Deployment Script

param(
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

Write-Host "🚀 Cloud Defenders Infrastructure Deployment" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Project: $ProjectName" -ForegroundColor Yellow

# Check if Terraform is installed
if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Terraform is not installed or not in PATH"
    exit 1
}

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "❌ AWS CLI is not installed or not in PATH"
    exit 1
}

# Check AWS credentials
try {
    $awsAccount = aws sts get-caller-identity --query Account --output text 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "AWS credentials not configured"
    }
    Write-Host "✅ AWS Account: $awsAccount" -ForegroundColor Green
}
catch {
    Write-Error "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
}

# Navigate to infrastructure directory
$infraDir = Join-Path $PSScriptRoot ".." "infra"
if (-not (Test-Path $infraDir)) {
    Write-Error "❌ Infrastructure directory not found: $infraDir"
    exit 1
}

Set-Location $infraDir
Write-Host "📁 Working directory: $infraDir" -ForegroundColor Blue

# Build Lambda deployment package
Write-Host "📦 Building Lambda deployment package..." -ForegroundColor Blue
$backendDir = Join-Path $PSScriptRoot ".." "backend"
if (Test-Path $backendDir) {
    Set-Location $backendDir
    
    # Install dependencies
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install --production
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Failed to install Node.js dependencies"
        exit 1
    }
    
    Set-Location $infraDir
    Write-Host "✅ Lambda package prepared" -ForegroundColor Green
}
else {
    Write-Warning "⚠️  Backend directory not found: $backendDir"
}

# Initialize Terraform
Write-Host "🔧 Initializing Terraform..." -ForegroundColor Blue
terraform init
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Terraform initialization failed"
    exit 1
}

# Destroy existing infrastructure if requested
if ($DestroyFirst) {
    Write-Host "💥 Destroying existing infrastructure..." -ForegroundColor Red
    terraform destroy -auto-approve `
        -var="environment=$Environment" `
        -var="aws_region=$Region" `
        -var="project_name=$ProjectName"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "⚠️  Terraform destroy had issues, continuing..."
    }
}

# Plan the deployment
Write-Host "📋 Planning Terraform deployment..." -ForegroundColor Blue
terraform plan `
    -var="environment=$Environment" `
    -var="aws_region=$Region" `
    -var="project_name=$ProjectName" `
    -out="tfplan"

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Terraform planning failed"
    exit 1
}

# Apply the deployment
Write-Host "🚀 Applying Terraform deployment..." -ForegroundColor Blue
terraform apply tfplan

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Terraform deployment failed"
    exit 1
}

# Get outputs
Write-Host "📤 Getting deployment outputs..." -ForegroundColor Blue
$apiUrl = terraform output -raw api_gateway_url
$s3Url = terraform output -raw s3_website_url
$lambdaName = terraform output -raw lambda_function_name
$dynamoTable = terraform output -raw dynamodb_table_name

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "  • API Gateway URL: $apiUrl" -ForegroundColor White
Write-Host "  • S3 Website URL: $s3Url" -ForegroundColor White
Write-Host "  • Lambda Function: $lambdaName" -ForegroundColor White
Write-Host "  • DynamoDB Table: $dynamoTable" -ForegroundColor White

# Update frontend API configuration
if (-not $SkipBackend) {
    Write-Host ""
    Write-Host "🔧 Updating frontend API configuration..." -ForegroundColor Blue
    $apiServicePath = Join-Path $PSScriptRoot ".." "frontend" "js" "api-service.js"
    
    if (Test-Path $apiServicePath) {
        $content = Get-Content $apiServicePath -Raw
        $updatedContent = $content -replace "this\.API_BASE_URL = 'http://localhost:3000/api';", "this.API_BASE_URL = '$apiUrl';"
        Set-Content $apiServicePath $updatedContent
        Write-Host "✅ Frontend API URL updated to: $apiUrl" -ForegroundColor Green
    }
    else {
        Write-Warning "⚠️  Frontend API service file not found: $apiServicePath"
    }
}

Write-Host ""
Write-Host "🎮 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Upload frontend files to S3: scripts/deploy-frontend.ps1" -ForegroundColor White
Write-Host "  2. Test the game at: $s3Url" -ForegroundColor White
Write-Host "  3. API endpoints available at: $apiUrl" -ForegroundColor White

Write-Host ""
Write-Host "✨ Happy Gaming! ✨" -ForegroundColor Magenta