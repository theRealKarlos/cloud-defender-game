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



# Create versioned folder for this deployment
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$versionFolder = "v$timestamp"
Write-Host "Creating versioned folder: $versionFolder" -ForegroundColor Blue

# Create temporary directory for versioned deployment
$tempVersionDir = Join-Path $env:TEMP "cloud-defenders-$versionFolder"
if (Test-Path $tempVersionDir) {
    Remove-Item $tempVersionDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempVersionDir | Out-Null

# Copy main game files to versioned directory (excluding bootstrap and special files)
Write-Host "Preparing versioned deployment..." -ForegroundColor Blue
$gameFiles = Get-ChildItem -Recurse -File | Where-Object { 
    $_.Name -notmatch '\.(git|DS_Store)' -and 
    $_.FullName -notmatch 'node_modules' -and 
    $_.FullName -notmatch '__tests__' -and
    $_.FullName -notmatch 'coverage' -and
    $_.Name -notmatch 'package.*\.json' -and
    $_.Name -ne 'eslint.config.js' -and
    $_.Name -ne 'debug.html' -and
    $_.Name -ne 'bootstrap-index.html' -and
    $_.Name -ne 'config.json' -and
    $_.Name -ne 'test-manifest-pointer.html'
}

foreach ($file in $gameFiles) {
    $relativePath = $file.FullName.Replace($frontendDir, "").TrimStart("\")
    $targetPath = Join-Path $tempVersionDir $relativePath
    $targetDir = Split-Path $targetPath -Parent
    
    if (!(Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    Copy-Item $file.FullName $targetPath
}

# Upload versioned files to S3
Write-Host "📤 Uploading versioned files to S3..." -ForegroundColor Blue
$s3SyncArgs = @(
    "s3", "sync", $tempVersionDir, "s3://$bucketName/$versionFolder",
    "--delete",
    "--profile", $Profile
)

aws @s3SyncArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to upload versioned files to S3"
    exit 1
}

# Deploy bootstrap loader to S3 root
Write-Host "Deploying bootstrap loader to S3 root..." -ForegroundColor Blue
aws s3 cp "frontend/bootstrap-index.html" "s3://$bucketName/index.html" `
    --content-type "text/html" `
    --cache-control "no-store, max-age=0" `
    --metadata-directive REPLACE `
    --profile $Profile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to upload bootstrap loader to S3 root"
    exit 1
}
Write-Host "Bootstrap loader uploaded successfully" -ForegroundColor Green

# Clean up temporary directory
Remove-Item $tempVersionDir -Recurse -Force -ErrorAction SilentlyContinue

# Deploy main game files to versioned folder
Write-Host "Deploying main game files to versioned folder..." -ForegroundColor Blue
$gameFiles = Get-ChildItem -Recurse -File | Where-Object { 
    $_.Name -notmatch '\.(git|DS_Store)' -and 
    $_.FullName -notmatch 'node_modules' -and 
    $_.FullName -notmatch '__tests__' -and
    $_.FullName -notmatch 'coverage' -and
    $_.Name -notmatch 'package.*\.json' -and
    $_.Name -ne 'eslint.config.js' -and
    $_.Name -ne 'debug.html' -and
    $_.Name -ne 'bootstrap-index.html' -and
    $_.Name -ne 'config.json' -and
    $_.Name -ne 'test-manifest-pointer.html'
}

foreach ($file in $gameFiles) {
    $relativePath = $file.FullName.Replace($frontendDir, "").TrimStart("\")
    $s3Path = "s3://$bucketName/$versionFolder/$relativePath"
    
    # Ensure proper content type based on file extension
    $contentType = switch ([System.IO.Path]::GetExtension($file.Name).ToLower()) {
        ".html" { "text/html" }
        ".css" { "text/css" }
        ".js" { "application/javascript" }
        ".json" { "application/json" }
        ".png" { "image/png" }
        ".jpg" { "image/jpeg" }
        ".jpeg" { "image/jpeg" }
        ".gif" { "image/gif" }
        ".svg" { "image/svg+xml" }
        ".ico" { "image/x-icon" }
        default { "application/octet-stream" }
    }
    
    aws s3 cp $file.FullName $s3Path `
        --content-type $contentType `
        --cache-control "public, max-age=31536000" `
        --metadata-directive REPLACE `
        --profile $Profile
        
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to upload $relativePath to S3"
        exit 1
    }
}
Write-Host "Main game files deployed successfully to $versionFolder" -ForegroundColor Green

# Content types are now handled during individual file uploads above

# Deploy config.json to bucket root (not in versioned folder)
Write-Host "Deploying config.json to bucket root..." -ForegroundColor Blue
aws s3 cp "config.json" "s3://$bucketName/config.json" `
    --content-type "application/json" `
    --cache-control "no-store, max-age=0" `
    --metadata-directive REPLACE `
    --profile $Profile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to upload config.json to S3"
    exit 1
}
Write-Host "config.json uploaded successfully" -ForegroundColor Green

# Deploy diagnostics directory to bucket root (not in versioned folder)
Write-Host "Deploying diagnostics directory to bucket root..." -ForegroundColor Blue
aws s3 cp "diagnostics" "s3://$bucketName/diagnostics" `
    --recursive `
    --content-type "text/html" `
    --cache-control "public, max-age=300" `
    --metadata-directive REPLACE `
    --profile $Profile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to upload diagnostics directory to S3"
    exit 1
}
Write-Host "Diagnostics directory uploaded successfully" -ForegroundColor Green

# Create and deploy manifest.json
Write-Host "Creating manifest.json for version: $versionFolder" -ForegroundColor Blue
$manifestContent = @{"version" = $versionFolder } | ConvertTo-Json -Compress
Set-Content -Path "manifest.json" -Value $manifestContent

Write-Host "Deploying manifest.json to bucket root with no-cache headers..." -ForegroundColor Blue
aws s3 cp "manifest.json" "s3://$bucketName/manifest.json" `
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