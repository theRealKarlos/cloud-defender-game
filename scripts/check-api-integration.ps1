# ============================================================================
# CHECK API GATEWAY INTEGRATION
# ============================================================================
# Verifies API Gateway is properly integrated with Lambda

Write-Host "Checking API Gateway integration..." -ForegroundColor Green

Set-Location -Path "infra"

try {
    # Get API details
    $apiId = terraform output -raw api_id 2>$null
    $lambdaName = terraform output -raw lambda_function_name 2>$null
    
    if (-not $apiId) {
        Write-Host "Could not get API ID from Terraform" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "📍 API ID: $apiId" -ForegroundColor Cyan
    Write-Host "📍 Lambda: $lambdaName" -ForegroundColor Cyan
    
    Set-Location -Path ".."
    
    Write-Host ""
    Write-Host "=== API GATEWAY DETAILS ===" -ForegroundColor Yellow
    
    # Get API details
    aws apigatewayv2 get-api --api-id $apiId --output table
    
    Write-Host ""
    Write-Host "=== API ROUTES ===" -ForegroundColor Yellow
    
    # Get routes
    $routes = aws apigatewayv2 get-routes --api-id $apiId | ConvertFrom-Json
    
    if ($routes.Items) {
        foreach ($route in $routes.Items) {
            Write-Host "Route: $($route.RouteKey)" -ForegroundColor White
            Write-Host "  Target: $($route.Target)" -ForegroundColor Gray
            
            # Get integration details
            if ($route.Target -match "integrations/(.+)") {
                $integrationId = $matches[1]
                Write-Host "  Integration ID: $integrationId" -ForegroundColor Gray
                
                try {
                    $integration = aws apigatewayv2 get-integration --api-id $apiId --integration-id $integrationId | ConvertFrom-Json
                    Write-Host "  Integration URI: $($integration.IntegrationUri)" -ForegroundColor Gray
                    Write-Host "  Integration Type: $($integration.IntegrationType)" -ForegroundColor Gray
                } catch {
                    Write-Host "  Could not get integration details" -ForegroundColor Red
                }
            }
            Write-Host ""
        }
    } else {
        Write-Host "No routes found!" -ForegroundColor Red
    }
    
    Write-Host "=== API STAGES ===" -ForegroundColor Yellow
    
    # Get stages
    $stages = aws apigatewayv2 get-stages --api-id $apiId | ConvertFrom-Json
    
    if ($stages.Items) {
        foreach ($stage in $stages.Items) {
            Write-Host "Stage: $($stage.StageName)" -ForegroundColor White
            Write-Host "  Auto Deploy: $($stage.AutoDeploy)" -ForegroundColor Gray
            Write-Host "  Created: $($stage.CreatedDate)" -ForegroundColor Gray
        }
    } else {
        Write-Host "No stages found!" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "=== LAMBDA PERMISSIONS ===" -ForegroundColor Yellow
    
    # Check Lambda permissions
    if ($lambdaName) {
        try {
            $policy = aws lambda get-policy --function-name $lambdaName | ConvertFrom-Json
            Write-Host "Lambda has resource policy" -ForegroundColor Green
            Write-Host ($policy.Policy | ConvertFrom-Json | ConvertTo-Json -Depth 5) -ForegroundColor Gray
        } catch {
            Write-Host "Lambda has no resource policy - API Gateway cannot invoke it!" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "Error checking integration: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Set-Location -Path ".."
}