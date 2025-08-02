# ============================================================================
# TEST API CONNECTIVITY SCRIPT
# ============================================================================
# Tests the deployed API Gateway endpoints

Write-Host "🧪 Testing API connectivity..." -ForegroundColor Green

# Change to infrastructure directory to get API URL
Set-Location -Path "infra"

try {
    # Get the API URL from Terraform
    $apiUrl = terraform output -raw api_url
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to get API URL from Terraform"
    }
    
    Write-Host "📍 Testing API at: $apiUrl" -ForegroundColor Cyan
    
    # Test leaderboard endpoint (GET)
    Write-Host ""
    Write-Host "Testing GET /api/leaderboard..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$apiUrl/api/leaderboard" -Method GET -TimeoutSec 10
        Write-Host "✅ Leaderboard endpoint working!" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor White
    } catch {
        Write-Host "❌ Leaderboard endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test score submission endpoint (POST)
    Write-Host ""
    Write-Host "Testing POST /api/scores..." -ForegroundColor Yellow
    
    $testScore = @{
        playerName = "TestPlayer"
        score = 1000
        gameMode = "classic"
        level = 5
        timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$apiUrl/api/scores" -Method POST -Body $testScore -ContentType "application/json" -TimeoutSec 10
        Write-Host "✅ Score submission endpoint working!" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor White
    } catch {
        Write-Host "❌ Score submission endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Message -like "*CORS*") {
            Write-Host "💡 This might be a CORS issue. Check API Gateway CORS configuration." -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "🎯 API testing complete!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error during API testing: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location -Path ".."
}