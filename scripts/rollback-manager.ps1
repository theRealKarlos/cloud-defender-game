#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Rollback manager for Cloud Defenders deployments

.DESCRIPTION
    Manages rollbacks for both frontend and backend deployments.
    For backend: Rolls back Lambda alias to previous version
    For frontend: Rolls back CloudFront origin path to previous version

.PARAMETER Component
    Component to rollback: "frontend", "backend", or "both"

.PARAMETER Environment
    Environment to rollback: "development" or "production"

.PARAMETER AwsRegion
    AWS region for the deployment

.PARAMETER FunctionName
    Lambda function name (for backend rollback)

.PARAMETER CloudFrontDistributionId
    CloudFront distribution ID (for frontend rollback)

.PARAMETER PreviousVersion
    Previous version to rollback to (for backend)

.PARAMETER PreviousOriginPath
    Previous origin path to rollback to (for frontend)

.EXAMPLE
    .\scripts\rollback-manager.ps1 -Component "backend" -Environment "production" -FunctionName "my-function" -PreviousVersion "5"
    .\scripts\rollback-manager.ps1 -Component "frontend" -Environment "production" -CloudFrontDistributionId "E123456789" -PreviousOriginPath "/v20231201-12345678"
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("frontend", "backend", "both")]
    [string]$Component,
    
    [Parameter(Mandatory = $true)]
    [ValidateSet("development", "production")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [string]$AwsRegion = "eu-west-2",
    
    [Parameter(Mandatory = $false)]
    [string]$FunctionName,
    
    [Parameter(Mandatory = $false)]
    [string]$CloudFrontDistributionId,
    
    [Parameter(Mandatory = $false)]
    [string]$PreviousVersion,
    
    [Parameter(Mandatory = $false)]
    [string]$PreviousOriginPath
)

# Function to rollback backend
function Rollback-Backend {
    param(
        [string]$FunctionName,
        [string]$PreviousVersion,
        [string]$AwsRegion
    )
    
    if ([string]::IsNullOrEmpty($FunctionName)) {
        Write-Host "❌ Function name is required for backend rollback"
        return $false
    }
    
    if ([string]::IsNullOrEmpty($PreviousVersion)) {
        Write-Host "❌ Previous version is required for backend rollback"
        return $false
    }
    
    try {
        Write-Host "🔄 Rolling back Lambda function $FunctionName to version $PreviousVersion..."
        
        # Update the alias to point to the previous version
        aws lambda update-alias `
            --function-name $FunctionName `
            --name "live" `
            --function-version $PreviousVersion `
            --region $AwsRegion
        
        Write-Host "✅ Backend rollback completed successfully"
        return $true
    }
    catch {
        Write-Host "❌ Backend rollback failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to rollback frontend
function Rollback-Frontend {
    param(
        [string]$CloudFrontDistributionId,
        [string]$PreviousOriginPath,
        [string]$AwsRegion
    )
    
    if ([string]::IsNullOrEmpty($CloudFrontDistributionId)) {
        Write-Host "❌ CloudFront distribution ID is required for frontend rollback"
        return $false
    }
    
    if ([string]::IsNullOrEmpty($PreviousOriginPath)) {
        Write-Host "❌ Previous origin path is required for frontend rollback"
        return $false
    }
    
    try {
        Write-Host "🔄 Rolling back CloudFront distribution $CloudFrontDistributionId to origin path $PreviousOriginPath..."
        
        # Get current distribution configuration
        aws cloudfront get-distribution-config `
            --id $CloudFrontDistributionId `
            --region $AwsRegion > dist-config.json
        
        # Update the origin path in the configuration
        jq --arg old_path $PreviousOriginPath `
            '.DistributionConfig.Origins.Items[0].OriginPath = $old_path' `
            dist-config.json > dist-config-rollback.json
        
        # Get the ETag for the update
        $etag = jq -r '.ETag' dist-config.json
        
        # Update the distribution
        aws cloudfront update-distribution `
            --id $CloudFrontDistributionId `
            --distribution-config file://dist-config-rollback.json `
            --if-match $etag `
            --region $AwsRegion
        
        # Clean up temporary files
        Remove-Item -Path "dist-config.json" -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "dist-config-rollback.json" -Force -ErrorAction SilentlyContinue
        
        Write-Host "✅ Frontend rollback completed successfully"
        return $true
    }
    catch {
        Write-Host "❌ Frontend rollback failed: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
Write-Host "🏴‍☠️  Cloud Defenders Rollback Manager" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Component: $Component" -ForegroundColor Yellow
Write-Host ""

$overallSuccess = $true

# Backend rollback
if ($Component -eq "backend" -or $Component -eq "both") {
    Write-Host "=== Backend Rollback ===" -ForegroundColor Green
    $backendSuccess = Rollback-Backend -FunctionName $FunctionName -PreviousVersion $PreviousVersion -AwsRegion $AwsRegion
    if (-not $backendSuccess) {
        $overallSuccess = $false
    }
    Write-Host ""
}

# Frontend rollback
if ($Component -eq "frontend" -or $Component -eq "both") {
    Write-Host "=== Frontend Rollback ===" -ForegroundColor Green
    $frontendSuccess = Rollback-Frontend -CloudFrontDistributionId $CloudFrontDistributionId -PreviousOriginPath $PreviousOriginPath -AwsRegion $AwsRegion
    if (-not $frontendSuccess) {
        $overallSuccess = $false
    }
    Write-Host ""
}

# Summary
if ($overallSuccess) {
    Write-Host "🎉 Rollback completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "💀 Some rollback operations failed!" -ForegroundColor Red
    exit 1
} 