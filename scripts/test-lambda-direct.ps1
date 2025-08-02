# ============================================================================
# TEST LAMBDA FUNCTION DIRECTLY
# ============================================================================
# Tests the Lambda function directly to verify it's working

Write-Host "🧪 Testing Lambda function directly..." -ForegroundColor Green

Set-Location -Path "infra"

try {
    # Get the Lambda function name
    $lambdaName = terraform output -raw lambda_function_name
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to get Lambda function name from Terraform"
    }
    
    Write-Host "📍 Lambda function: $lambdaName" -ForegroundColor Cyan
    
    Set-Location -Path ".."
    
    # Create test payload for API Gateway v2 format
    $testPayload = '{
        "version": "2.0",
        "routeKey": "GET /api/leaderboard",
        "rawPath": "/api/leaderboard",
        "requestContext": {
            "http": {
                "method": "GET",
                "path": "/api/leaderboard"
            }
        },
        "queryStringParameters": null,
        "body": null
    }'
    
    Write-Host ""
    Write-Host "Testing with API Gateway v2 event format..." -ForegroundColor Yellow
    
    # Save payload to temp file
    $tempFile = [System.IO.Path]::GetTempFileName()
    $testPayload | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline
    
    try {
        # Invoke Lambda function directly
        $result = aws lambda invoke --function-name $lambdaName --payload file://$tempFile response.json
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Lambda invocation successful!" -ForegroundColor Green
            
            # Read the response
            if (Test-Path "response.json") {
                $response = Get-Content "response.json" | ConvertFrom-Json
                Write-Host "Response:" -ForegroundColor White
                Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor White
                
                # Clean up
                Remove-Item "response.json" -ErrorAction SilentlyContinue
            }
        } else {
            Write-Host "❌ Lambda invocation failed" -ForegroundColor Red
        }
    } finally {
        # Clean up temp file
        Remove-Item $tempFile -ErrorAction SilentlyContinue
    }
    
    Write-Host ""
    Write-Host "🎯 Direct Lambda test complete!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error testing Lambda: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location -Path ".."
}