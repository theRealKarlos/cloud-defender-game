# ============================================================================
# UPDATE API CONFIGURATION SCRIPT
# ============================================================================
# Automatically updates the frontend API configuration with the correct API Gateway URL

Write-Host "Updating API configuration..." -ForegroundColor Green

# Change to infrastructure directory to get Terraform outputs
Set-Location -Path "infra"

try {
    # Get the API URL from Terraform outputs
    Write-Host "Getting API URL from Terraform..." -ForegroundColor Yellow
    $apiUrl = terraform output -raw api_gateway_url
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to get API URL from Terraform. Make sure infrastructure is deployed."
    }
    
    Write-Host "Found API URL: $apiUrl" -ForegroundColor Green
    
    # Return to root directory
    Set-Location -Path ".."
    
    # Update config.js file
    $configPath = "frontend/js/config.js"
    
    if (Test-Path $configPath) {
        Write-Host "Updating config.js..." -ForegroundColor Yellow
        
        # Read the current config file
        $configContent = Get-Content $configPath -Raw
        
        # Update the baseUrl
        $updatedContent = $configContent -replace "baseUrl:\s*['""`][^'""`]*['""`]", "baseUrl: '$apiUrl'"
        
        # Write the updated content back
        Set-Content -Path $configPath -Value $updatedContent
        
        Write-Host "Updated baseUrl in config.js" -ForegroundColor Green
    } else {
        Write-Host "config.js file not found at $configPath" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "API configuration updated successfully!" -ForegroundColor Green
    Write-Host "New API URL: $apiUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The frontend will now use the deployed API Gateway URL for both:" -ForegroundColor White
    Write-Host "  • Local development (file:// or localhost)" -ForegroundColor White
    Write-Host "  • Production deployment (CloudFront)" -ForegroundColor White
    
} catch {
    Write-Host "Error updating API configuration: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*terraform output*") {
        Write-Host ""
        Write-Host "Make sure you have deployed the infrastructure first:" -ForegroundColor Yellow
        Write-Host "   cd infra" -ForegroundColor White
        Write-Host "   terraform apply -target=module.api_gateway" -ForegroundColor White
    }
    
    exit 1
} finally {
    # Return to original directory
    Set-Location -Path ".."
}