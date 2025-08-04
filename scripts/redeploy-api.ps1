# ============================================================================
# REDEPLOY API GATEWAY SCRIPT
# ============================================================================
# Redeploys the API Gateway module to fix routing issues

Write-Host "Redeploying API Gateway..." -ForegroundColor Green

Set-Location -Path "infra"

try {
    Write-Host "Planning API Gateway deployment..." -ForegroundColor Yellow
    terraform plan -target=module.api_gateway
    
    if ($LASTEXITCODE -ne 0) {
        throw "Terraform plan failed"
    }
    
    Write-Host ""
    Write-Host "Applying API Gateway deployment..." -ForegroundColor Yellow
    terraform apply -target=module.api_gateway -auto-approve
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "API Gateway deployed successfully!" -ForegroundColor Green
        
        # Get the new API URL
        $apiUrl = terraform output -raw api_url
        Write-Host "📍 API URL: $apiUrl" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "Testing the API..." -ForegroundColor Yellow
        Set-Location -Path ".."
        .\scripts\test-api.ps1
        
    } else {
        Write-Host "API Gateway deployment failed" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "Error redeploying API Gateway: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location -Path ".."
}