# ============================================================================
# REDEPLOY LAMBDA FUNCTION SCRIPT
# ============================================================================
# Redeploys the Lambda function with updated code

Write-Host "🔄 Redeploying Lambda function..." -ForegroundColor Green

Set-Location -Path "infra"

try {
    Write-Host "Planning Lambda function deployment..." -ForegroundColor Yellow
    & terraform plan "-target=module.lambda_function"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Terraform plan failed"
    }
    
    Write-Host ""
    Write-Host "Applying Lambda function deployment..." -ForegroundColor Yellow
    & terraform apply "-target=module.lambda_function" "-auto-approve"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Lambda function deployed successfully!" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "Testing the API..." -ForegroundColor Yellow
        Set-Location -Path ".."
        .\scripts\test-api.ps1
        
    } else {
        Write-Host "❌ Lambda function deployment failed" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error redeploying Lambda function: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location -Path ".."
}