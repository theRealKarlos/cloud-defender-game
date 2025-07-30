#!/usr/bin/env pwsh
# Cloud Defenders Frontend Deployment Script

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory = $false)]
    [string]$ProjectName = "cloud-defenders",
    
    [Parameter(Mandatory = $false)]
    [switch]$Force = $false
)

Write-Host "🌐 Cloud Defenders Frontend Deployment" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Project: $ProjectName" -ForegroundColor Yellow

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

# Get S3 bucket name from Terraform output
$infraDir = Join-Path $PSScriptRoot ".." "infra"
if (-not (Test-Path $infraDir)) {
    Write-Error "❌ Infrastructure directory not found. Deploy infrastructure first."
    exit 1
}

Set-Location $infraDir

Write-Host "📋 Getting S3 bucket information..." -ForegroundColor Blue
try {
    $bucketName = terraform output -raw s3_bucket_name 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($bucketName)) {
        throw "Failed to get bucket name"
    }
    Write-Host "✅ S3 Bucket: $bucketName" -ForegroundColor Green
}
catch {
    Write-Error "❌ Could not get S3 bucket name. Make sure infrastructure is deployed first."
    exit 1
}

# Navigate to frontend directory
$frontendDir = Join-Path $PSScriptRoot ".." "frontend"
if (-not (Test-Path $frontendDir)) {
    Write-Error "❌ Frontend directory not found: $frontendDir"
    exit 1
}

Set-Location $frontendDir
Write-Host "📁 Frontend directory: $frontendDir" -ForegroundColor Blue

# List files to be uploaded (excluding development files)
Write-Host "📂 Files to upload:" -ForegroundColor Blue
$files = Get-ChildItem -Recurse -File | Where-Object { 
    $_.Name -notmatch '\.(git|DS_Store)' -and 
    $_.FullName -notmatch 'node_modules' -and 
    $_.FullName -notmatch 'tests' -and
    $_.Name -notmatch 'package.*\.json' -and
    $_.Name -ne 'eslint.config.js' -and
    $_.Name -ne 'debug.html'
}
$files | ForEach-Object { Write-Host "  • $($_.FullName.Replace($frontendDir, ''))" -ForegroundColor Gray }

Write-Host ""
if (-not $Force) {
    $confirm = Read-Host "Continue with upload? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "❌ Upload cancelled" -ForegroundColor Red
        exit 0
    }
}

# Upload files to S3
Write-Host "📤 Uploading files to S3..." -ForegroundColor Blue
aws s3 sync . "s3://$bucketName" --delete `
    --exclude "*.git/*" `
    --exclude ".DS_Store" `
    --exclude "node_modules/*" `
    --exclude "package*.json" `
    --exclude "eslint.config.js" `
    --exclude "tests/*" `
    --exclude "debug.html"

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Failed to upload files to S3"
    exit 1
}

# Set proper content types for web files
Write-Host "🔧 Setting content types..." -ForegroundColor Blue

# HTML files
aws s3 cp "s3://$bucketName" "s3://$bucketName" --recursive --exclude "*" --include "*.html" --content-type "text/html" --metadata-directive REPLACE
# CSS files
aws s3 cp "s3://$bucketName" "s3://$bucketName" --recursive --exclude "*" --include "*.css" --content-type "text/css" --metadata-directive REPLACE
# JavaScript files
aws s3 cp "s3://$bucketName" "s3://$bucketName" --recursive --exclude "*" --include "*.js" --content-type "application/javascript" --metadata-directive REPLACE

# Get website URL
Set-Location $infraDir
$websiteUrl = terraform output -raw s3_website_url

Write-Host ""
Write-Host "🎉 Frontend Deployment Complete!" -ForegroundColor Green
Write-Host "🌐 Website URL: $websiteUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎮 Your game is now live!" -ForegroundColor Magenta
Write-Host "🔗 Open in browser: $websiteUrl" -ForegroundColor White

# Optional: Open in browser (Windows only)
if ($IsWindows) {
    $openBrowser = Read-Host "Open in browser now? (y/N)"
    if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
        Start-Process $websiteUrl
    }
}