#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Health check script for deployed services

.DESCRIPTION
    Performs health checks on frontend and backend services to verify deployment success.
    This script is designed to be called from GitHub Actions workflows.

.PARAMETER FrontendUrl
    URL of the frontend service to check

.PARAMETER BackendUrl
    URL of the backend service to check

.PARAMETER Timeout
    Timeout in seconds for health check requests (default: 30)

.EXAMPLE
    .\scripts\health-check.ps1 -FrontendUrl "https://example.com" -BackendUrl "https://api.example.com"
#>

param(
    [Parameter(Mandatory = $false)]
    [string]$FrontendUrl,
    
    [Parameter(Mandatory = $false)]
    [string]$BackendUrl,
    
    [Parameter(Mandatory = $false)]
    [int]$Timeout = 30
)

# Function to perform health check
function Test-ServiceHealth {
    param(
        [string]$Url,
        [string]$ServiceName,
        [string]$HealthEndpoint = ""
    )
    
    if ([string]::IsNullOrEmpty($Url)) {
        Write-Host "⚠️  $ServiceName URL not provided, skipping health check"
        return $true
    }
    
    $fullUrl = if ($HealthEndpoint) { "$Url$HealthEndpoint" } else { $Url }
    
    try {
        Write-Host "🔍 Checking $ServiceName health at: $fullUrl"
        
        $response = Invoke-WebRequest -Uri $fullUrl -Method Get -TimeoutSec $Timeout -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $ServiceName health check passed (Status: $($response.StatusCode))"
            return $true
        } else {
            Write-Host "❌ $ServiceName health check failed (Status: $($response.StatusCode))"
            return $false
        }
    }
    catch {
        Write-Host "❌ $ServiceName health check failed: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
Write-Host "🏥 Starting health checks..."
$overallSuccess = $true

# Frontend health check
if ($FrontendUrl) {
    $frontendSuccess = Test-ServiceHealth -Url $FrontendUrl -ServiceName "Frontend"
    if (-not $frontendSuccess) {
        $overallSuccess = $false
    }
}

# Backend health check
if ($BackendUrl) {
    $backendSuccess = Test-ServiceHealth -Url $BackendUrl -ServiceName "Backend" -HealthEndpoint "/health"
    if (-not $backendSuccess) {
        $overallSuccess = $false
    }
}

if ($overallSuccess) {
    Write-Host "🎉 All health checks passed!"
    exit 0
} else {
    Write-Host "💀 Some health checks failed!"
    exit 1
} 