# ============================================================================
# DIAGNOSE API ISSUES SCRIPT
# ============================================================================
# Comprehensive diagnosis of API Gateway and Lambda deployment

Write-Host "Diagnosing API Gateway deployment..." -ForegroundColor Green

Set-Location -Path "infra"

try {
    Write-Host ""
    Write-Host "=== TERRAFORM STATE CHECK ===" -ForegroundColor Cyan
    
    # Check if API Gateway resources exist in state
    Write-Host "Checking API Gateway resources in Terraform state..." -ForegroundColor Yellow
    
    $apiGatewayExists = terraform state list | Select-String "aws_apigatewayv2_api.score_api"
    $routesExist = terraform state list | Select-String "aws_apigatewayv2_route"
    $stageExists = terraform state list | Select-String "aws_apigatewayv2_stage"
    $lambdaExists = terraform state list | Select-String "aws_lambda_function.score_api"
    
    if ($apiGatewayExists) {
        Write-Host "API Gateway exists in state" -ForegroundColor Green
    } else {
        Write-Host "API Gateway NOT found in state" -ForegroundColor Red
    }
    
    if ($routesExist) {
        Write-Host "API Routes exist in state" -ForegroundColor Green
        terraform state list | Select-String "aws_apigatewayv2_route" | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    } else {
        Write-Host "API Routes NOT found in state" -ForegroundColor Red
    }
    
    if ($stageExists) {
        Write-Host "API Stage exists in state" -ForegroundColor Green
    } else {
        Write-Host "API Stage NOT found in state" -ForegroundColor Red
    }
    
    if ($lambdaExists) {
        Write-Host "Lambda function exists in state" -ForegroundColor Green
    } else {
        Write-Host "Lambda function NOT found in state" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "=== TERRAFORM OUTPUTS ===" -ForegroundColor Cyan
    
    try {
        $apiUrl = terraform output -raw api_url
        Write-Host "API URL: $apiUrl" -ForegroundColor White
        
        $apiId = terraform output -raw api_id 2>$null
        if ($apiId) {
            Write-Host "API ID: $apiId" -ForegroundColor White
        }
        
        $lambdaName = terraform output -raw lambda_function_name 2>$null
        if ($lambdaName) {
            Write-Host "Lambda Function: $lambdaName" -ForegroundColor White
        }
    } catch {
        Write-Host "Error getting Terraform outputs: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "=== AWS RESOURCE CHECK ===" -ForegroundColor Cyan
    
    # Check if resources actually exist in AWS
    if ($apiId) {
        Write-Host "Checking API Gateway in AWS..." -ForegroundColor Yellow
        try {
            $awsApi = aws apigatewayv2 get-api --api-id $apiId 2>$null | ConvertFrom-Json
            if ($awsApi) {
                Write-Host "API Gateway exists in AWS" -ForegroundColor Green
                Write-Host "  Name: $($awsApi.Name)" -ForegroundColor White
                Write-Host "  Protocol: $($awsApi.ProtocolType)" -ForegroundColor White
            }
        } catch {
            Write-Host "API Gateway not found in AWS" -ForegroundColor Red
        }
        
        Write-Host "Checking API Routes..." -ForegroundColor Yellow
        try {
            $routes = aws apigatewayv2 get-routes --api-id $apiId 2>$null | ConvertFrom-Json
            if ($routes.Items) {
                Write-Host "Found $($routes.Items.Count) routes:" -ForegroundColor Green
                foreach ($route in $routes.Items) {
                    Write-Host "  - $($route.RouteKey)" -ForegroundColor White
                }
            } else {
                Write-Host "No routes found!" -ForegroundColor Red
            }
        } catch {
            Write-Host "Error checking routes" -ForegroundColor Red
        }
    }
    
    if ($lambdaName) {
        Write-Host "Checking Lambda function..." -ForegroundColor Yellow
        try {
            $lambda = aws lambda get-function --function-name $lambdaName 2>$null | ConvertFrom-Json
            if ($lambda) {
                Write-Host "Lambda function exists in AWS" -ForegroundColor Green
                Write-Host "  Runtime: $($lambda.Configuration.Runtime)" -ForegroundColor White
                Write-Host "  Handler: $($lambda.Configuration.Handler)" -ForegroundColor White
            }
        } catch {
            Write-Host "Lambda function not found in AWS" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "=== RECOMMENDATIONS ===" -ForegroundColor Cyan
    
    if (-not $apiGatewayExists -or -not $routesExist -or -not $stageExists) {
        Write-Host "API Gateway components missing. Try deploying:" -ForegroundColor Yellow
        Write-Host "   terraform apply -target=module.api_gateway" -ForegroundColor White
    }
    
    if (-not $lambdaExists) {
        Write-Host "Lambda function missing. Try deploying:" -ForegroundColor Yellow
        Write-Host "   terraform apply -target=module.lambda_function" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "Diagnosis complete!" -ForegroundColor Green
    
} catch {
    Write-Host "Error during diagnosis: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Set-Location -Path ".."
}