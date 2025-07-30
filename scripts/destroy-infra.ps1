#!/usr/bin/env pwsh
# Cloud Defenders Infrastructure Cleanup Script

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory = $false)]
    [string]$Region = "eu-west-2",
    
    [Parameter(Mandatory = $false)]
    [string]$ProjectName = "cloud-defenders",
    
    [Parameter(Mandatory = $false)]
    [switch]$Force = $false
)

Write-Host "💥 Cloud Defenders Infrastructure Cleanup" -ForegroundColor Red
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Project: $ProjectName" -ForegroundColor Yellow

if (-not $Force) {
    Write-Host ""
    Write-Warning "⚠️  This will DESTROY all infrastructure for the $Environment environment!"
    Write-Host "This includes:" -ForegroundColor Red
    Write-Host "  • Lambda function and all code" -ForegroundColor Red
    Write-Host "  • API Gateway and all endpoints" -ForegroundColor Red
    Write-Host "  • DynamoDB table and ALL SCORES" -ForegroundColor Red
    Write-Host "  • S3 bucket and website files" -ForegroundColor Red
    Write-Host ""
    
    $confirm1 = Read-Host "Type 'destroy' to confirm"
    if ($confirm1 -ne "destroy") {
        Write-Host "❌ Cleanup cancelled" -ForegroundColor Green
        exit 0
    }
    
    $confirm2 = Read-Host "Are you absolutely sure? Type 'yes' to proceed"
    if ($confirm2 -ne "yes") {
        Write-Host "❌ Cleanup cancelled" -ForegroundColor Green
        exit 0
    }
}

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

# Navigate to infrastructure directory
$infraDir = Join-Path $PSScriptRoot ".." "infra"
if (-not (Test-Path $infraDir)) {
    Write-Error "❌ Infrastructure directory not found: $infraDir"
    exit 1
}

Set-Location $infraDir

# Get resource information before destroying
Write-Host "📋 Getting resource information..." -ForegroundColor Blue
try {
    $bucketName = terraform output -raw s3_bucket_name 2>$null
    $lambdaName = terraform output -raw lambda_function_name 2>$null
    $tableName = terraform output -raw dynamodb_table_name 2>$null
    
    Write-Host "Resources to be destroyed:" -ForegroundColor Yellow
    if ($bucketName) { Write-Host "  • S3 Bucket: $bucketName" -ForegroundColor Gray }
    if ($lambdaName) { Write-Host "  • Lambda: $lambdaName" -ForegroundColor Gray }
    if ($tableName) { Write-Host "  • DynamoDB: $tableName" -ForegroundColor Gray }
}
catch {
    Write-Warning "⚠️  Could not retrieve resource information"
}

# Empty S3 bucket first (required for deletion)
if ($bucketName) {
    Write-Host "🗑️  Emptying S3 bucket..." -ForegroundColor Blue
    aws s3 rm "s3://$bucketName" --recursive 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ S3 bucket emptied" -ForegroundColor Green
    }
    else {
        Write-Warning "⚠️  Could not empty S3 bucket (may not exist)"
    }
}

# Destroy infrastructure with Terraform
Write-Host "💥 Destroying infrastructure..." -ForegroundColor Red
terraform destroy -auto-approve `
    -var="environment=$Environment" `
    -var="aws_region=$Region" `
    -var="project_name=$ProjectName"

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Terraform destroy failed"
    Write-Host "You may need to manually clean up some resources" -ForegroundColor Yellow
    exit 1
}

# Clean up local files
Write-Host "🧹 Cleaning up local files..." -ForegroundColor Blue
$filesToClean = @(
    "terraform.tfstate*",
    "tfplan",
    "lambda_deployment.zip",
    ".terraform.lock.hcl"
)

foreach ($pattern in $filesToClean) {
    $files = Get-ChildItem -Path . -Name $pattern -Force 2>$null
    foreach ($file in $files) {
        Remove-Item $file -Force -Recurse 2>$null
        if ($?) {
            Write-Host "  • Removed: $file" -ForegroundColor Gray
        }
    }
}

# Remove .terraform directory
if (Test-Path ".terraform") {
    Remove-Item ".terraform" -Recurse -Force 2>$null
    if ($?) {
        Write-Host "  • Removed: .terraform/" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🎉 Cleanup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "All infrastructure has been destroyed." -ForegroundColor White
Write-Host "You can safely re-deploy using the deploy scripts." -ForegroundColor White
Write-Host ""
Write-Host "✨ Environment is clean! ✨" -ForegroundColor Magenta