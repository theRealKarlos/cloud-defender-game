# ============================================================================
# UPDATE API CONFIGURATION SCRIPT
# ============================================================================
# Automatically updates the frontend API configuration with the correct API Gateway URL

param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Profile
)

Write-Host "Updating API configuration..." -ForegroundColor Green

# Change to infrastructure directory to get Terraform outputs
Set-Location -Path "infra"

try {
    # Get the API URL from Terraform outputs
    Write-Host "Getting API URL from Terraform..." -ForegroundColor Yellow
    $apiUrl = terraform output -raw api_gateway_url -var="aws_profile=$Profile"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to get API URL from Terraform. Make sure infrastructure is deployed."
    }
    
    Write-Host "Found API URL: $apiUrl" -ForegroundColor Green
    
    # Return to root directory
    Set-Location -Path ".."
    
    # Generate config.json file
    $configPath = "frontend/config.json"
    
    Write-Host "Generating config.json..." -ForegroundColor Yellow
    
    # Create configuration object
    $configData = @{
        apiBaseUrl = $apiUrl
        timeout = 10000
        version = "1.0.0"
        features = @{
            scoreValidation = $true
            leaderboard = $true
            realTimeUpdates = $false
        }
    }
    
    # Convert to JSON and write to file
    $configJson = $configData | ConvertTo-Json -Depth 5
    Set-Content -Path $configPath -Value $configJson
    
    Write-Host "Generated config.json with API URL: $apiUrl" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "API configuration updated successfully!" -ForegroundColor Green
    Write-Host "New API URL: $apiUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The frontend will now use the deployed API Gateway URL for both:" -ForegroundColor White
    Write-Host "  • Local development (file:// or localhost)" -ForegroundColor White
    Write-Host "  • Production deployment (CloudFront)" -ForegroundColor White
    
}
catch {
    Write-Host "Error updating API configuration: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*terraform output*") {
        Write-Host ""
        Write-Host "Make sure you have deployed the infrastructure first:" -ForegroundColor Yellow
        Write-Host "   cd infra" -ForegroundColor White
        Write-Host "   terraform apply -target=module.api_gateway" -ForegroundColor White
    }
    
    exit 1
}
finally {
    # Return to original directory
    Set-Location -Path ".."
}