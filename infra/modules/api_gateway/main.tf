# API Gateway Module for Cloud Defenders
# Manages the REST API, resources, methods, and integrations

# API Gateway REST API
resource "aws_api_gateway_rest_api" "score_api" {
  name        = "${var.project_name}-${var.environment}-api"
  description = "Cloud Defenders Score API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "Cloud Defenders API"
    Environment = var.environment
    Project     = var.project_name
  }
}

# API Gateway resource for /api
resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.score_api.id
  parent_id   = aws_api_gateway_rest_api.score_api.root_resource_id
  path_part   = "api"
}

# API Gateway resource for /api/scores
resource "aws_api_gateway_resource" "scores" {
  rest_api_id = aws_api_gateway_rest_api.score_api.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "scores"
}

# API Gateway resource for /api/leaderboard
resource "aws_api_gateway_resource" "leaderboard" {
  rest_api_id = aws_api_gateway_rest_api.score_api.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "leaderboard"
}

# POST method for /api/scores
resource "aws_api_gateway_method" "scores_post" {
  rest_api_id   = aws_api_gateway_rest_api.score_api.id
  resource_id   = aws_api_gateway_resource.scores.id
  http_method   = "POST"
  authorization = "NONE"
}

# GET method for /api/leaderboard
resource "aws_api_gateway_method" "leaderboard_get" {
  rest_api_id   = aws_api_gateway_rest_api.score_api.id
  resource_id   = aws_api_gateway_resource.leaderboard.id
  http_method   = "GET"
  authorization = "NONE"
}

# OPTIONS methods for CORS (scores)
resource "aws_api_gateway_method" "scores_options" {
  rest_api_id   = aws_api_gateway_rest_api.score_api.id
  resource_id   = aws_api_gateway_resource.scores.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS methods for CORS (leaderboard)
resource "aws_api_gateway_method" "leaderboard_options" {
  rest_api_id   = aws_api_gateway_rest_api.score_api.id
  resource_id   = aws_api_gateway_resource.leaderboard.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Lambda integrations
resource "aws_api_gateway_integration" "scores_post_integration" {
  rest_api_id = aws_api_gateway_rest_api.score_api.id
  resource_id = aws_api_gateway_resource.scores.id
  http_method = aws_api_gateway_method.scores_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

resource "aws_api_gateway_integration" "leaderboard_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.score_api.id
  resource_id = aws_api_gateway_resource.leaderboard.id
  http_method = aws_api_gateway_method.leaderboard_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

# CORS integrations (mock responses)
resource "aws_api_gateway_integration" "scores_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.score_api.id
  resource_id = aws_api_gateway_resource.scores.id
  http_method = aws_api_gateway_method.scores_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration" "leaderboard_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.score_api.id
  resource_id = aws_api_gateway_resource.leaderboard.id
  http_method = aws_api_gateway_method.leaderboard_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# Method responses for CORS
resource "aws_api_gateway_method_response" "scores_options_response" {
  rest_api_id = aws_api_gateway_rest_api.score_api.id
  resource_id = aws_api_gateway_resource.scores.id
  http_method = aws_api_gateway_method.scores_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_method_response" "leaderboard_options_response" {
  rest_api_id = aws_api_gateway_rest_api.score_api.id
  resource_id = aws_api_gateway_resource.leaderboard.id
  http_method = aws_api_gateway_method.leaderboard_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# Integration responses for CORS
resource "aws_api_gateway_integration_response" "scores_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.score_api.id
  resource_id = aws_api_gateway_resource.scores.id
  http_method = aws_api_gateway_method.scores_options.http_method
  status_code = aws_api_gateway_method_response.scores_options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_integration_response" "leaderboard_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.score_api.id
  resource_id = aws_api_gateway_resource.leaderboard.id
  http_method = aws_api_gateway_method.leaderboard_options.http_method
  status_code = aws_api_gateway_method_response.leaderboard_options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.score_api.execution_arn}/*/*"
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "score_api_deployment" {
  depends_on = [
    aws_api_gateway_integration.scores_post_integration,
    aws_api_gateway_integration.leaderboard_get_integration,
    aws_api_gateway_integration.scores_options_integration,
    aws_api_gateway_integration.leaderboard_options_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.score_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.api.id,
      aws_api_gateway_resource.scores.id,
      aws_api_gateway_resource.leaderboard.id,
      aws_api_gateway_method.scores_post.id,
      aws_api_gateway_method.leaderboard_get.id,
      aws_api_gateway_integration.scores_post_integration.id,
      aws_api_gateway_integration.leaderboard_get_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway stage
resource "aws_api_gateway_stage" "score_api_stage" {
  deployment_id = aws_api_gateway_deployment.score_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.score_api.id
  stage_name    = var.environment

  tags = {
    Name        = "Cloud Defenders API Stage"
    Environment = var.environment
    Project     = var.project_name
  }
}