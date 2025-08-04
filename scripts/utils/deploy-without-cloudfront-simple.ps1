# ============================================================================
# DEPLOY INFRASTRUCTURE WITHOUT CLOUDFRONT (SIMPLE VERSION)
# ============================================================================
# This script deploys all infrastructure except CloudFront distribution

param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Profile,
    [Parameter(Mandatory = $false)]
    [string]$Environment = "dev",
    [Parameter(Mandatory = $false)]
    [string]$Region = "eu-west-2",
    [Parameter(Mandatory = $false)]
    [string]$ProjectName = "cloud-defenders"
)

Write-Host "Deploying Cloud Defenders infrastructure (excluding CloudFront)..." -ForegroundColor Green

# Set AWS profile environment variable
$env:AWS_PROFILE = $Profile
Write-Host "Using AWS Profile: $Profile" -ForegroundColor Yellow

# Change to infrastructure directory
$infraDir = Join-Path $PSScriptRoot ".." ".." "infra"
Set-Location -Path $infraDir

# Check if Terraform is initialized
if (-not (Test-Path ".terraform")) {
    Write-Host "Initializing Terraform..." -ForegroundColor Yellow
    terraform init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Terraform init failed" -ForegroundColor Red
        exit 1
    }
}

# Define targets to deploy (everything except CloudFront)
$targets = @(
    "module.dynamodb",
    "module.lambda_function", 
    "module.api_gateway"
)

# Build the terraform command
$terraformArgs = @(
    "apply", 
    "-auto-approve",
    "-var=aws_profile=$Profile",
    "-var=environment=$Environment",
    "-var=aws_region=$Region",
    "-var=project_name=$ProjectName"
)
foreach ($target in $targets) {
    $terraformArgs += "-target=$target"
}

Write-Host "Deploying the following components:" -ForegroundColor Cyan
foreach ($target in $targets) {
    Write-Host "  - $target" -ForegroundColor White
}
Write-Host ""

# Execute terraform apply
Write-Host "Running terraform apply..." -ForegroundColor Yellow
& terraform @terraformArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Infrastructure deployed successfully (without CloudFront)!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deployed components:" -ForegroundColor Cyan
    Write-Host "- DynamoDB table for scores"
    Write-Host "- Lambda function for API"
    Write-Host "- API Gateway v2 (HTTP API)"
    Write-Host "- API custom domain"
    Write-Host "- SSL certificates for API"
    Write-Host ""
    Write-Host "To deploy CloudFront later, run:" -ForegroundColor Yellow
    Write-Host "terraform apply -target=module.s3_game_hosting -var=""aws_profile=$Profile"""
}
else {
    Write-Host "✗ Deployment failed" -ForegroundColor Red
    exit 1
}

# Return to original directory
Set-Location -Path (Join-Path $PSScriptRoot ".." "..")