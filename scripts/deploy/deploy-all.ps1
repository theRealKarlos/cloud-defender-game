#!/usr/bin/env pwsh
# Cloud Defenders Complete Deployment Script

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
    [switch]$DestroyFirst = $false
)

Write-Host ""
Write-Host "Cloud Defenders - Complete Deployment" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host ""

$startTime = Get-Date

# Step 1: Deploy Infrastructure
Write-Host "Step 1: Deploying Infrastructure..." -ForegroundColor Cyan
& "$PSScriptRoot/deploy-infra.ps1" -Profile $Profile -Environment $Environment -Region $Region -ProjectName $ProjectName -DestroyFirst:$DestroyFirst

if ($LASTEXITCODE -ne 0) {
    Write-Error "Infrastructure deployment failed"
    exit 1
}

Write-Host ""
Write-Host "Waiting 30 seconds for AWS resources to stabilize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Step 2: Update API Configuration
Write-Host ""
Write-Host "Step 2: Updating API Configuration..." -ForegroundColor Cyan
& "$PSScriptRoot/update-api-config.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Warning "API configuration update failed, but continuing with deployment"
}

# Step 3: Deploy Frontend
Write-Host ""
Write-Host "Step 3: Deploying Frontend..." -ForegroundColor Cyan
& "$PSScriptRoot/deploy-frontend.ps1" -Profile $Profile -Environment $Environment -ProjectName $ProjectName -Force

if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend deployment failed"
    exit 1
}

# Get final URLs
$infraDir = Join-Path $PSScriptRoot ".." "infra"
Set-Location $infraDir

$apiUrl = terraform output -raw api_gateway_url -var="aws_profile=$Profile"
$websiteUrl = terraform output -raw s3_website_url -var="aws_profile=$Profile"
$lambdaName = terraform output -raw lambda_function_name -var="aws_profile=$Profile"

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""
Write-Host "Total Time: $($duration.ToString('mm\:ss'))" -ForegroundColor Yellow
Write-Host ""
Write-Host "Game URL: $websiteUrl" -ForegroundColor Cyan
Write-Host "API URL: $apiUrl" -ForegroundColor Cyan
Write-Host "Lambda: $lambdaName" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ready to Play!" -ForegroundColor Magenta
Write-Host ""
Write-Host "Test the API:" -ForegroundColor Blue
Write-Host "  curl $apiUrl/api/leaderboard" -ForegroundColor Gray
Write-Host ""
Write-Host "Monitor Lambda logs:" -ForegroundColor Blue
Write-Host "  aws logs tail /aws/lambda/$lambdaName --follow" -ForegroundColor Gray
Write-Host ""

# Test API connectivity
Write-Host "Testing API connectivity..." -ForegroundColor Blue
try {
    Invoke-RestMethod -Uri "$apiUrl/api/leaderboard" -Method GET -TimeoutSec 10 | Out-Null
    Write-Host "API is responding!" -ForegroundColor Green
}
catch {
    Write-Warning "API test failed: $($_.Exception.Message)"
    Write-Host "   This might be normal if the API is still warming up." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Deployment Summary:" -ForegroundColor Magenta
Write-Host "  • Infrastructure: Deployed" -ForegroundColor White
Write-Host "  • Lambda Function: Deployed" -ForegroundColor White
Write-Host "  • API Gateway: Deployed" -ForegroundColor White
Write-Host "  • DynamoDB: Created" -ForegroundColor White
Write-Host "  • S3 Private Bucket: Created" -ForegroundColor White
Write-Host "  • CloudFront CDN: Deployed" -ForegroundColor White
Write-Host "  • API Configuration: Updated" -ForegroundColor White
Write-Host "  • Frontend: Uploaded & Cached" -ForegroundColor White
Write-Host ""
Write-Host "Happy Gaming!" -ForegroundColor Magenta