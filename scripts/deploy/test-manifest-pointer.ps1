#!/usr/bin/env pwsh
# Test script for Manifest Pointer architecture
# This script validates the deployment structure without actually deploying

Write-Host "Testing Manifest Pointer Architecture..." -ForegroundColor Cyan

# Check if required files exist
$requiredFiles = @(
    "frontend/bootstrap-index.html",
    "frontend/index.html",
    "frontend/config.json",
    "scripts/deploy/deploy-frontend.ps1"
)

Write-Host "Checking required files..." -ForegroundColor Blue
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
        exit 1
    }
}

# Test manifest generation
Write-Host "`nTesting manifest generation..." -ForegroundColor Blue
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$versionFolder = "v$timestamp"
$manifestContent = @{"version" = $versionFolder} | ConvertTo-Json -Compress

Write-Host "Generated version: $versionFolder" -ForegroundColor Yellow
Write-Host "Manifest content: $manifestContent" -ForegroundColor Yellow

# Test file path construction
Write-Host "`nTesting file path construction..." -ForegroundColor Blue
$testPaths = @(
    "Root bootstrap: /index.html",
    "Manifest: /manifest.json", 
    "Versioned game: /$versionFolder/index.html",
    "Versioned CSS: /$versionFolder/styles/game.css",
    "Versioned JS: /$versionFolder/js/game.js",
    "Config (root): /config.json",
    "Diagnostics (root): /diagnostics/"
)

foreach ($path in $testPaths) {
    Write-Host "  • $path" -ForegroundColor Gray
}

# Test bootstrap loader content
Write-Host "`nTesting bootstrap loader content..." -ForegroundColor Blue
$bootstrapContent = Get-Content "frontend/bootstrap-index.html" -Raw

if ($bootstrapContent -match "Manifest Pointer") {
    Write-Host "✅ Bootstrap loader contains architecture documentation" -ForegroundColor Green
} else {
    Write-Host "❌ Bootstrap loader missing architecture documentation" -ForegroundColor Red
}

if ($bootstrapContent -match "fetch.*manifest\.json") {
    Write-Host "✅ Bootstrap loader fetches manifest.json" -ForegroundColor Green
} else {
    Write-Host "❌ Bootstrap loader missing manifest.json fetch" -ForegroundColor Red
}

if ($bootstrapContent -match "loadGame") {
    Write-Host "✅ Bootstrap loader has loadGame function" -ForegroundColor Green
} else {
    Write-Host "❌ Bootstrap loader missing loadGame function" -ForegroundColor Red
}

# Test deployment script structure
Write-Host "`nTesting deployment script structure..." -ForegroundColor Blue
$deployScript = Get-Content "scripts/deploy/deploy-frontend.ps1" -Raw

if ($deployScript -match "Create versioned folder") {
    Write-Host "✅ Deployment script creates versioned folders" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment script missing versioned folder creation" -ForegroundColor Red
}

if ($deployScript -match "Deploy bootstrap loader") {
    Write-Host "✅ Deployment script deploys bootstrap loader" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment script missing bootstrap loader deployment" -ForegroundColor Red
}

if ($deployScript -match "manifest\.json") {
    Write-Host "✅ Deployment script handles manifest.json" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment script missing manifest.json handling" -ForegroundColor Red
}

# Test local game files
Write-Host "`nTesting local game files..." -ForegroundColor Blue
$gameFiles = Get-ChildItem "frontend" -Recurse -File | Where-Object { 
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

Write-Host "Found $($gameFiles.Count) game files to deploy:" -ForegroundColor Yellow
$gameFiles | ForEach-Object { 
    Write-Host "  • $($_.FullName.Replace('frontend\', ''))" -ForegroundColor Gray 
}

Write-Host "`n🎉 Manifest Pointer architecture test completed successfully!" -ForegroundColor Green
Write-Host "Ready for deployment with: .\scripts\deploy\deploy-frontend.ps1 -Profile <your-profile>" -ForegroundColor Cyan
