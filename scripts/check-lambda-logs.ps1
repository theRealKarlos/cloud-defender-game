# ============================================================================
# CHECK LAMBDA LOGS SCRIPT
# ============================================================================
# Checks recent Lambda function logs to debug API issues

Write-Host "🔍 Checking Lambda function logs..." -ForegroundColor Green

Set-Location -Path "infra"

try {
    # Get the Lambda function name
    $lambdaName = terraform output -raw lambda_function_name
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to get Lambda function name from Terraform"
    }
    
    Write-Host "📍 Lambda function: $lambdaName" -ForegroundColor Cyan
    
    Set-Location -Path ".."
    
    Write-Host ""
    Write-Host "=== RECENT LAMBDA LOGS ===" -ForegroundColor Yellow
    
    # Get recent logs (last 10 minutes)
    $startTime = (Get-Date).AddMinutes(-10).ToString("yyyy-MM-ddTHH:mm:ss")
    
    Write-Host "Fetching logs since $startTime..." -ForegroundColor White
    
    # Use AWS CLI to get recent logs
    aws logs filter-log-events --log-group-name "/aws/lambda/$lambdaName" --start-time ([DateTimeOffset]::Parse($startTime).ToUnixTimeMilliseconds()) --output table
    
    Write-Host ""
    Write-Host "=== TESTING API WHILE WATCHING LOGS ===" -ForegroundColor Yellow
    Write-Host "Making a test request to generate logs..." -ForegroundColor White
    
    # Get API URL
    Set-Location -Path "infra"
    $apiUrl = terraform output -raw api_url
    Set-Location -Path ".."
    
    # Make a test request
    try {
        $response = Invoke-RestMethod -Uri "$apiUrl/api/leaderboard" -Method GET -TimeoutSec 5
        Write-Host "✅ Request succeeded: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "=== LOGS AFTER TEST REQUEST ===" -ForegroundColor Yellow
    Start-Sleep -Seconds 2  # Wait for logs to appear
    
    # Get logs from the last 2 minutes
    $recentStartTime = (Get-Date).AddMinutes(-2).ToString("yyyy-MM-ddTHH:mm:ss")
    aws logs filter-log-events --log-group-name "/aws/lambda/$lambdaName" --start-time ([DateTimeOffset]::Parse($recentStartTime).ToUnixTimeMilliseconds()) --output table
    
    Write-Host ""
    Write-Host "💡 If no logs appear, the Lambda function might not be receiving requests." -ForegroundColor Yellow
    Write-Host "💡 Check API Gateway integration and permissions." -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error checking logs: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location -Path ".."
}