# Run Comprehensive Tests
# Consolidates API testing, Lambda testing, and diagnostics

param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Profile,
    
    [string]$Environment = "dev",
    [string]$Region = "eu-west-2",
    [switch]$ApiOnly,
    [switch]$LambdaOnly,
    [switch]$LogsOnly,
    [switch]$DiagnoseOnly
)

Write-Host "Running Cloud Defenders Tests..." -ForegroundColor Green

# Function to test API endpoints
function Test-ApiEndpoints {
    Write-Host "`nTesting API Endpoints..." -ForegroundColor Cyan
    
    # Get API Gateway URL from Terraform outputs
    $infraPath = Join-Path $PSScriptRoot "..\..\infra"
    Push-Location $infraPath
    
    try {
        $apiUrl = terraform output -raw api_gateway_url -var="aws_profile=$Profile" 2>$null
        if (-not $apiUrl) {
            Write-Host "  Error: Could not get API Gateway URL from Terraform outputs" -ForegroundColor Red
            return $false
        }
        
        Write-Host "  API Base URL: $apiUrl" -ForegroundColor White
        
        # Test leaderboard endpoint
        Write-Host "  Testing GET /api/leaderboard..." -ForegroundColor Yellow
        $leaderboardResponse = Invoke-RestMethod -Uri "$apiUrl/api/leaderboard" -Method Get -ErrorAction SilentlyContinue
        
        if ($leaderboardResponse) {
            Write-Host "  Leaderboard endpoint: PASSED" -ForegroundColor Green
        } else {
            Write-Host "  Leaderboard endpoint: FAILED" -ForegroundColor Red
            return $false
        }
        
        # Test score submission endpoint
        Write-Host "  Testing POST /api/scores..." -ForegroundColor Yellow
        $testScore = @{
            playerName = "TestPlayer"
            score = 1000
            wave = 5
            gameMode = "normal"
        }
        
        $scoreResponse = Invoke-RestMethod -Uri "$apiUrl/api/scores" -Method Post -Body ($testScore | ConvertTo-Json) -ContentType "application/json" -ErrorAction SilentlyContinue
        
        if ($scoreResponse) {
            Write-Host "  Score submission endpoint: PASSED" -ForegroundColor Green
        } else {
            Write-Host "  Score submission endpoint: FAILED" -ForegroundColor Red
            return $false
        }
        
        return $true
    }
    catch {
        Write-Host "  Error testing API endpoints: $_" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

# Function to test Lambda function directly
function Test-LambdaDirect {
    Write-Host "`nTesting Lambda Function Directly..." -ForegroundColor Cyan
    
    $lambdaFunctionName = "cloud-defenders-$Environment-score-api"
    
    # Test payload
    $testPayload = @{
        httpMethod = "POST"
        path = "/api/scores"
        body = (@{
            playerName = "DirectTestPlayer"
            score = 2000
            wave = 8
            gameMode = "normal"
        } | ConvertTo-Json)
    }
    
    try {
        Write-Host "  Invoking Lambda function: $lambdaFunctionName" -ForegroundColor Yellow
        
        $lambdaArgs = @(
            "lambda", "invoke",
            "--function-name", $lambdaFunctionName,
            "--payload", ($testPayload | ConvertTo-Json),
            "--region", $Region,
            "--profile", $Profile,
            "response.json"
        )
        
        aws @lambdaArgs
        
        if ($LASTEXITCODE -eq 0) {
            $result = Get-Content response.json | ConvertFrom-Json
            Write-Host "  Lambda direct test: PASSED" -ForegroundColor Green
            Write-Host "  Response: $($result.body)" -ForegroundColor White
            Remove-Item response.json -ErrorAction SilentlyContinue
            return $true
        } else {
            Write-Host "  Lambda direct test: FAILED" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "  Error testing Lambda directly: $_" -ForegroundColor Red
        return $false
    }
}

# Function to check Lambda logs
function Check-LambdaLogs {
    Write-Host "`nChecking Lambda Function Logs..." -ForegroundColor Cyan
    
    $lambdaFunctionName = "cloud-defenders-$Environment-score-api"
    $logGroupName = "/aws/lambda/$lambdaFunctionName"
    
    try {
        Write-Host "  Getting recent logs for: $logGroupName" -ForegroundColor Yellow
        
        $logsArgs = @(
            "logs", "describe-log-streams",
            "--log-group-name", $logGroupName,
            "--order-by", "LastEventTime",
            "--descending",
            "--max-items", "5",
            "--region", $Region,
            "--profile", $Profile,
            "--query", "logStreams[0].logStreamName",
            "--output", "text"
        )
        
        $logs = aws @logsArgs
        
        if ($logs -and $logs -ne "None") {
            $getLogsArgs = @(
                "logs", "get-log-events",
                "--log-group-name", $logGroupName,
                "--log-stream-name", $logs,
                "--region", $Region,
                "--profile", $Profile,
                "--query", "events[*].message",
                "--output", "text"
            )
            
            $recentLogs = aws @getLogsArgs
            
            Write-Host "  Recent logs:" -ForegroundColor White
            $recentLogs -split "`n" | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
            return $true
        } else {
            Write-Host "  No recent logs found" -ForegroundColor Yellow
            return $true
        }
    }
    catch {
        Write-Host "  Error checking Lambda logs: $_" -ForegroundColor Red
        return $false
    }
}

# Function to diagnose API issues
function Diagnose-ApiIssues {
    Write-Host "`nDiagnosing API Issues..." -ForegroundColor Cyan
    
    $apiName = "cloud-defenders-$Environment-api"
    
    try {
        # Check API Gateway status
        Write-Host "  Checking API Gateway status..." -ForegroundColor Yellow
        $apiArgs = @("apigateway", "get-rest-apis", "--query", "items[?name=='$apiName'].id", "--output", "text", "--region", $Region, "--profile", $Profile)
        $apiId = aws @apiArgs
        
        if ($apiId) {
            Write-Host "  API Gateway found: $apiId" -ForegroundColor Green
            
            # Check deployments
            $deployArgs = @("apigateway", "get-deployments", "--rest-api-id", $apiId, "--region", $Region, "--profile", $Profile, "--query", "items[*].{id:id,createdDate:createdDate}", "--output", "table")
            $deployments = aws @deployArgs
            Write-Host "  Recent deployments:" -ForegroundColor White
            Write-Host $deployments -ForegroundColor Gray
        } else {
            Write-Host "  API Gateway not found!" -ForegroundColor Red
            return $false
        }
        
        # Check Lambda function status
        Write-Host "  Checking Lambda function status..." -ForegroundColor Yellow
        $lambdaFunctionName = "cloud-defenders-$Environment-score-api"
        $lambdaStatusArgs = @("lambda", "get-function", "--function-name", $lambdaFunctionName, "--region", $Region, "--profile", $Profile, "--query", "Configuration.State", "--output", "text")
        $lambdaStatus = aws @lambdaStatusArgs 2>$null
        
        if ($lambdaStatus -eq "Active") {
            Write-Host "  Lambda function is active" -ForegroundColor Green
        } else {
            Write-Host "  Lambda function status: $lambdaStatus" -ForegroundColor Red
            return $false
        }
        
        return $true
    }
    catch {
        Write-Host "  Error diagnosing API issues: $_" -ForegroundColor Red
        return $false
    }
}

# Main execution
$allPassed = $true

if (-not $LambdaOnly -and -not $LogsOnly -and -not $DiagnoseOnly) {
    $apiTestPassed = Test-ApiEndpoints
    if (-not $apiTestPassed) { $allPassed = $false }
}

if (-not $ApiOnly -and -not $LogsOnly -and -not $DiagnoseOnly) {
    $lambdaTestPassed = Test-LambdaDirect
    if (-not $lambdaTestPassed) { $allPassed = $false }
}

if ($LogsOnly -or -not $ApiOnly) {
    $logsCheckPassed = Check-LambdaLogs
    if (-not $logsCheckPassed) { $allPassed = $false }
}

if ($DiagnoseOnly) {
    $diagnosePassed = Diagnose-ApiIssues
    if (-not $diagnosePassed) { $allPassed = $false }
}

# Summary
Write-Host "`nTest Summary:" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "  All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "  Some tests failed. Please review the output above." -ForegroundColor Red
    exit 1
} 