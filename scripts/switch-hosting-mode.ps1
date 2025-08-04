#!/usr/bin/env pwsh
# Cloud Defenders Hosting Mode Switcher

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("cloudfront", "s3-website")]
    [string]$Mode,
    
    [Parameter(Mandatory = $false)]
    [switch]$Force = $false
)

Write-Host "Cloud Defenders Hosting Mode Switcher" -ForegroundColor Cyan
Write-Host "Switching to: $Mode" -ForegroundColor Yellow

$moduleDir = Join-Path $PSScriptRoot ".." "infra" "modules" "s3_game_hosting"
$mainFile = Join-Path $moduleDir "main.tf"
$cloudfrontFile = Join-Path $moduleDir "main.tf"
$fallbackFile = Join-Path $moduleDir "main-fallback.tf"

if (-not (Test-Path $moduleDir)) {
    Write-Error "Module directory not found: $moduleDir"
    exit 1
}

switch ($Mode) {
    "cloudfront" {
        Write-Host "Switching to CloudFront + Private S3 mode..." -ForegroundColor Blue
        
        if (-not (Test-Path $cloudfrontFile)) {
            Write-Error "CloudFront configuration file not found"
            exit 1
        }
        
        Write-Host "CloudFront mode is already active" -ForegroundColor Green
        Write-Host ""
        Write-Host "Requirements for CloudFront mode:" -ForegroundColor Yellow
        Write-Host "  • AWS account must be verified" -ForegroundColor White
        Write-Host "  • Contact AWS Support if you get verification errors" -ForegroundColor White
        Write-Host "  • CloudFront deployment takes 10-15 minutes" -ForegroundColor White
    }
    
    "s3-website" {
        Write-Host "Switching to S3 Website mode (fallback)..." -ForegroundColor Blue
        
        if (-not (Test-Path $fallbackFile)) {
            Write-Error "Fallback configuration file not found"
            exit 1
        }
        
        # Backup current main.tf
        $backupFile = Join-Path $moduleDir "main-cloudfront.tf"
        if (Test-Path $mainFile) {
            Copy-Item $mainFile $backupFile -Force
            Write-Host "Backed up CloudFront config to main-cloudfront.tf" -ForegroundColor Gray
        }
        
        # Replace with fallback
        Copy-Item $fallbackFile $mainFile -Force
        Write-Host "Switched to S3 Website mode" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "S3 Website mode features:" -ForegroundColor Yellow
        Write-Host "  • Encrypted storage (AES256)" -ForegroundColor Green
        Write-Host "  • Versioning enabled" -ForegroundColor Green  
        Write-Host "  • Secure bucket policy" -ForegroundColor Green
        Write-Host "  • CORS configuration" -ForegroundColor Green
        Write-Host "  • No CDN caching" -ForegroundColor Red
        Write-Host "  • HTTP/HTTPS mixed support" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run: .\scripts\deploy-all.ps1" -ForegroundColor White
Write-Host "  2. Test the deployment" -ForegroundColor White

if ($Mode -eq "s3-website") {
    Write-Host "  3. Switch back to CloudFront when account is verified" -ForegroundColor White
}

Write-Host ""
Write-Host "✨ Mode switch complete! ✨" -ForegroundColor Magenta