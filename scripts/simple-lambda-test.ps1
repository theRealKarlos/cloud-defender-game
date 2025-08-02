# ============================================================================
# SIMPLE LAMBDA TEST
# ============================================================================
# Simple test to verify Lambda function works

Write-Host "🧪 Simple Lambda test..." -ForegroundColor Green

Set-Location -Path "infra"

try {
    # Get the Lambda function name
    $lambdaName = terraform output -raw lambda_function_name
    Write-Host "📍 Lambda function: $lambdaName" -ForegroundColor Cyan
    
    Set-Location -Path ".."
    
    Write-Host "Testing Lambda function with simple payload..." -ForegroundColor Yellow
    
    # Use direct payload instead of file
    aws lambda invoke --function-name $lambdaName --payload '{"test": "hello"}' response.json
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Lambda invocation successful!" -ForegroundColor Green
        
        if (Test-Path "response.json") {
            $response = Get-Content "response.json" -Raw
            Write-Host "Response: $response" -ForegroundColor White
        }
    } else {
        Write-Host "❌ Lambda invocation failed" -ForegroundColor Red
    }
    
    # Clean up
    Remove-Item "test-payload.json" -ErrorAction SilentlyContinue
    Remove-Item "response.json" -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Set-Location -Path ".."
}