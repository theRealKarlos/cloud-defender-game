# Deploy Lambda function with CORS fixes
Write-Host "🚀 Deploying Lambda function with enhanced CORS headers..." -ForegroundColor Green

Set-Location -Path "infra"

try {
    Write-Host "Planning Lambda deployment..." -ForegroundColor Yellow
    terraform plan "-target=module.lambda_function"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Terraform plan failed"
    }
    
    Write-Host ""
    Write-Host "Applying Lambda deployment..." -ForegroundColor Yellow
    terraform apply "-target=module.lambda_function" "-auto-approve"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Lambda function deployed successfully!" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "Testing the updated API..." -ForegroundColor Yellow
        Set-Location -Path ".."
        
        # Test the API with the new CORS headers
        $apiUrl = "https://n8zszsigg3.execute-api.eu-west-2.amazonaws.com/dev"
        
        Write-Host "Testing OPTIONS request (CORS preflight)..." -ForegroundColor Cyan
        try {
            $response = Invoke-WebRequest -Uri "$apiUrl/api/scores" -Method OPTIONS -UseBasicParsing
            Write-Host "✅ OPTIONS request successful - Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "CORS Headers:" -ForegroundColor Gray
            $response.Headers.GetEnumerator() | Where-Object { $_.Key -like "*Access-Control*" } | ForEach-Object {
                Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "❌ OPTIONS request failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "Testing POST request..." -ForegroundColor Cyan
        $testScore = @{
            playerName = "CORSTest"
            score = 1500
            wave = 6
            gameMode = "normal"
            timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        } | ConvertTo-Json
        
        try {
            $response = Invoke-RestMethod -Uri "$apiUrl/api/scores" -Method POST -Body $testScore -ContentType "application/json"
            Write-Host "✅ POST request successful!" -ForegroundColor Green
            Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
        } catch {
            Write-Host "❌ POST request failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Lambda deployment failed" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error deploying Lambda: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location -Path ".."
}

Write-Host ""
Write-Host "🎯 Now test the score submission at http://localhost:3000/api-diagnostics.html" -ForegroundColor Green