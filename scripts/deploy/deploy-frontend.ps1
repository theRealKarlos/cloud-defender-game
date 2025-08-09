#!/usr/bin/env pwsh
# Cloud Defenders Frontend Deployment Script

param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Profile,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory = $false)]
    [string]$ProjectName = "cloud-defenders",
    
    [Parameter(Mandatory = $false)]
    [switch]$Force = $false
)

Write-Host "Cloud Defenders Frontend Deployment" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Project: $ProjectName" -ForegroundColor Yellow

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

# Get S3 bucket name from Terraform output
$infraDir = Join-Path $PSScriptRoot ".." ".." "infra"
if (-not (Test-Path $infraDir)) {
    Write-Error "Infrastructure directory not found. Deploy infrastructure first."
    exit 1
}

Set-Location $infraDir

# Set AWS profile for Terraform
$env:AWS_PROFILE = $Profile

Write-Host "Getting S3 bucket information..." -ForegroundColor Blue
try {
    $bucketName = terraform output -raw s3_bucket_name 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($bucketName)) {
        throw "Failed to get bucket name"
    }
    Write-Host "S3 Bucket: $bucketName" -ForegroundColor Green
}
catch {
    Write-Error "Could not get S3 bucket name. Make sure infrastructure is deployed first."
    exit 1
}

# Navigate to frontend directory
$frontendDir = Join-Path $PSScriptRoot ".." ".." "frontend"
if (-not (Test-Path $frontendDir)) {
    Write-Error "Frontend directory not found: $frontendDir"
    exit 1
}

Set-Location $frontendDir
Write-Host "Frontend directory: $frontendDir" -ForegroundColor Blue

# List files to be uploaded (excluding development files)
Write-Host "📂 Files to upload:" -ForegroundColor Blue
$files = Get-ChildItem -Recurse -File | Where-Object { 
    $_.Name -notmatch '\.(git|DS_Store)' -and 
    $_.FullName -notmatch 'node_modules' -and 
    $_.FullName -notmatch '__tests__' -and
    $_.Name -notmatch 'package.*\.json' -and
    $_.Name -ne 'eslint.config.js' -and
    $_.Name -ne 'debug.html'
}
$files | ForEach-Object { Write-Host "  • $($_.FullName.Replace($frontendDir, ''))" -ForegroundColor Gray }

Write-Host ""
if (-not $Force) {
    $confirm = Read-Host "Continue with upload? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Upload cancelled" -ForegroundColor Red
        exit 0
    }
}



# Upload files to S3
Write-Host "📤 Uploading files to S3..." -ForegroundColor Blue
$s3SyncArgs = @(
    "s3", "sync", ".", "s3://$bucketName",
    "--delete",
    "--exclude", "*.git/*",
    "--exclude", ".DS_Store",
    "--exclude", "node_modules/*",
    "--exclude", "package*.json",
    "--exclude", "eslint.config.js",
    "--exclude", "__tests__/*",
    "--exclude", "debug.html",
    "--exclude", "config.json",
    "--profile", $Profile
)

aws @s3SyncArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to upload files to S3"
    exit 1
}

# Set proper content types for web files
Write-Host "Setting content types..." -ForegroundColor Blue

# HTML files
$htmlArgs = @("s3", "cp", "s3://$bucketName", "s3://$bucketName", "--recursive", "--exclude", "*", "--include", "*.html", "--content-type", "text/html", "--metadata-directive", "REPLACE", "--profile", $Profile)
aws @htmlArgs

# CSS files
$cssArgs = @("s3", "cp", "s3://$bucketName", "s3://$bucketName", "--recursive", "--exclude", "*", "--include", "*.css", "--content-type", "text/css", "--metadata-directive", "REPLACE", "--profile", $Profile)
aws @cssArgs

# JavaScript files
$jsArgs = @("s3", "cp", "s3://$bucketName", "s3://$bucketName", "--recursive", "--exclude", "*", "--include", "*.js", "--content-type", "application/javascript", "--metadata-directive", "REPLACE", "--profile", $Profile)
aws @jsArgs

# Deploy config.json to bucket root (not in versioned folder)
Write-Host "Deploying config.json to bucket root..." -ForegroundColor Blue
aws s3 cp "frontend/config.json" "s3://$bucketName/config.json" `
    --region $awsRegion `
    --content-type "application/json" `
    --cache-control "no-store, max-age=0" `
    --metadata-directive REPLACE `
    --profile $Profile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to upload config.json to S3"
    exit 1
}
Write-Host "config.json uploaded successfully" -ForegroundColor Green

# Create and deploy manifest.json
Write-Host "Creating manifest.json for version: $versionFolder" -ForegroundColor Blue
$manifestContent = @{"version" = $versionFolder} | ConvertTo-Json -Compress
Set-Content -Path "manifest.json" -Value $manifestContent

Write-Host "Deploying manifest.json to bucket root with no-cache headers..." -ForegroundColor Blue
aws s3 cp "manifest.json" "s3://$bucketName/manifest.json" `
    --region $awsRegion `
    --content-type "application/json" `
    --cache-control "no-store, max-age=0" `
    --metadata-directive REPLACE `
    --profile $Profile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to upload manifest.json to S3"
    exit 1
}
Write-Host "manifest.json uploaded successfully" -ForegroundColor Green

# Clean up local manifest.json
Remove-Item "manifest.json" -ErrorAction SilentlyContinue

# Update S3 bucket website configuration
Write-Host "Updating S3 bucket website configuration..." -ForegroundColor Blue

# Get website URL and CloudFront distribution ID
Set-Location $infraDir
$websiteUrl = terraform output -raw s3_website_url
$distributionId = terraform output -raw cloudfront_distribution_id

# Invalidate CloudFront cache if we have a valid distribution ID
if ($distributionId -and $distributionId -ne "N/A - S3 Website Mode") {
    Write-Host ""
    Write-Host "Invalidating CloudFront cache..." -ForegroundColor Blue
    $invalidationArgs = @("cloudfront", "create-invalidation", "--distribution-id", $distributionId, "--paths", "/*", "--profile", $Profile)
    aws @invalidationArgs

    if ($LASTEXITCODE -eq 0) {
        Write-Host "CloudFront cache invalidation initiated" -ForegroundColor Green
    }
    else {
        Write-Warning "CloudFront cache invalidation failed, but deployment was successful"
    }
}
else {
    Write-Host ""
    Write-Host "Running in S3 Website mode - no cache invalidation needed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Frontend Deployment Complete!" -ForegroundColor Green
Write-Host "Website URL: $websiteUrl" -ForegroundColor Cyan
Write-Host "CloudFront Distribution ID: $distributionId" -ForegroundColor White
Write-Host ""
Write-Host "Your game is now live!" -ForegroundColor Magenta
Write-Host "Open in browser: $websiteUrl" -ForegroundColor White
Write-Host ""
Write-Host "Note: CloudFront cache may take a few minutes to update globally." -ForegroundColor Yellow

# Optional: Open in browser (Windows only)
if ($IsWindows) {
    $openBrowser = Read-Host "Open in browser now? (y/N)"
    if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
        Start-Process $websiteUrl
    }
}