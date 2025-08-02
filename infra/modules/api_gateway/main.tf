# API Gateway v2 (HTTP API) Module for Cloud Defenders
# Much simpler than REST API with built-in CORS support

# API Gateway v2 HTTP API
resource "aws_apigatewayv2_api" "score_api" {
  name          = "${var.project_name}-${var.environment}-api"
  description   = "Cloud Defenders Score API (HTTP API)"
  protocol_type = "HTTP"

  # Built-in CORS configuration
  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
    allow_methods     = ["*"]
    allow_origins     = ["*"]
    expose_headers    = ["date", "keep-alive"]
    max_age           = 86400
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-api"
  })
}

# Lambda integration for the HTTP API
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id = aws_apigatewayv2_api.score_api.id

  integration_uri    = var.lambda_invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

# Route for POST /api/scores
resource "aws_apigatewayv2_route" "scores_post" {
  api_id = aws_apigatewayv2_api.score_api.id

  route_key = "POST /api/scores"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# Route for GET /api/leaderboard
resource "aws_apigatewayv2_route" "leaderboard_get" {
  api_id = aws_apigatewayv2_api.score_api.id

  route_key = "GET /api/leaderboard"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# API Gateway v2 Stage
resource "aws_apigatewayv2_stage" "score_api_stage" {
  api_id = aws_apigatewayv2_api.score_api.id

  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn

    format = jsonencode({
      requestId      = "$context.requestId"
      sourceIp       = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      protocol       = "$context.protocol"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseTime   = "$context.responseTime"
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-api-stage"
  })
}

# CloudWatch Log Group for API Gateway access logs
resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/api_gw/${aws_apigatewayv2_api.score_api.name}"
  retention_in_days = 7

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-api-logs"
  })
}

# Lambda permissions for API Gateway v2
resource "aws_lambda_permission" "api_gateway_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.score_api.execution_arn}/*/*"
}
