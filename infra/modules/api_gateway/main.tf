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
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent", "x-client-version", "x-timestamp"]
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

  # Use payload format version 2.0 for HTTP API (not REST API)
  payload_format_version = "2.0"
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

# Route for GET /health
resource "aws_apigatewayv2_route" "health_get" {
  api_id = aws_apigatewayv2_api.score_api.id

  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# API Gateway v2 Stage
resource "aws_apigatewayv2_stage" "score_api_stage" {
  api_id = aws_apigatewayv2_api.score_api.id

  name        = var.environment
  auto_deploy = true

  # =================================================================
  # BASIC THROTTLING CONFIGURATION
  # =================================================================
  # HTTP API throttling provides coarse-grained rate limiting across
  # all clients. Unlike WAF, this is not IP-aware and cannot distinguish
  # between legitimate users and attackers from the same source.
  #
  # Limitations compared to WAF:
  # - No per-IP rate limiting (all traffic shares the same bucket)
  # - No geographic blocking or bot detection
  # - No custom rules based on headers, user agents, or request patterns
  # - Cannot block specific attack signatures or malicious payloads
  #
  # For production workloads, consider WAFv2 for more sophisticated
  # protection including IP-based rate limiting and managed rule sets.
  # =================================================================

  # Default throttling for all routes
  default_route_settings {
    throttling_burst_limit = 100 # Maximum burst requests across all clients
    throttling_rate_limit  = 50  # Steady-state RPS limit across all clients
  }

  # Stricter throttling for score submission endpoint
  route_settings {
    route_key              = "POST /api/scores"
    throttling_burst_limit = 20 # Lower burst limit for write operations
    throttling_rate_limit  = 10 # Lower steady-state limit for write operations
  }

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
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-api-stage"
  })

  depends_on = [aws_cloudwatch_log_resource_policy.api_gw_policy]
}

# CloudWatch Log Group for API Gateway access logs
resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/api_gw/${aws_apigatewayv2_api.score_api.name}"
  retention_in_days = 7

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-api-logs"
  })
}

# =================================================================
# RESOURCE POLICY FOR API GATEWAY LOGGING
# =================================================================
# This policy is required because the CI/CD role has limited permissions.
# When deploying locally with admin access, AWS automatically creates
# this policy behind the scenes. In CI/CD, we must explicitly define it.
# =================================================================
data "aws_iam_policy_document" "api_gw_logs" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = [aws_cloudwatch_log_group.api_gw.arn]
  }
}

resource "aws_cloudwatch_log_resource_policy" "api_gw_policy" {
  policy_name     = "${var.project_name}-${var.environment}-api-gw-logs-policy"
  policy_document = data.aws_iam_policy_document.api_gw_logs.json
}
# =================================================================

# Lambda permissions for API Gateway v2
resource "aws_lambda_permission" "api_gateway_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.score_api.execution_arn}/*/*"
}
