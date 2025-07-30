# Lambda API Module for Cloud Defenders Backend

# DynamoDB table for scores
resource "aws_dynamodb_table" "scores" {
  name         = "${var.project_name}-${var.environment}-scores"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "scoreId"

  attribute {
    name = "scoreId"
    type = "S"
  }

  # TTL attribute for automatic cleanup
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  # Global Secondary Index for querying by score (for leaderboard)
  global_secondary_index {
    name            = "ScoreIndex"
    hash_key        = "gameMode"
    range_key       = "score"
    projection_type = "ALL"
  }

  attribute {
    name = "gameMode"
    type = "S"
  }

  attribute {
    name = "score"
    type = "N"
  }

  tags = {
    Name        = "Cloud Defenders Scores"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM role for Lambda function
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "Cloud Defenders Lambda Role"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM policy for Lambda to access DynamoDB
resource "aws_iam_policy" "lambda_dynamodb_policy" {
  name        = "${var.project_name}-${var.environment}-lambda-dynamodb-policy"
  description = "IAM policy for Lambda to access DynamoDB"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          aws_dynamodb_table.scores.arn,
          "${aws_dynamodb_table.scores.arn}/*"
        ]
      }
    ]
  })
}

# Attach DynamoDB policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_dynamodb_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_policy.arn
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Create deployment package for Lambda
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../backend"
  output_path = "${path.root}/lambda_deployment.zip"
  excludes    = ["node_modules", "*.zip", ".git"]
}

# Lambda function
resource "aws_lambda_function" "score_api" {
  filename      = data.archive_file.lambda_zip.output_path
  function_name = "${var.project_name}-${var.environment}-score-api"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.scores.name
      NODE_ENV       = var.environment
    }
  }

  tags = {
    Name        = "Cloud Defenders Score API"
    Environment = var.environment
    Project     = var.project_name
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_iam_role_policy_attachment.lambda_dynamodb_attach,
  ]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.score_api.function_name}"
  retention_in_days = 7

  tags = {
    Name        = "Cloud Defenders Lambda Logs"
    Environment = var.environment
    Project     = var.project_name
  }
}

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
  uri                     = aws_lambda_function.score_api.invoke_arn
}

resource "aws_api_gateway_integration" "leaderboard_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.score_api.id
  resource_id = aws_api_gateway_resource.leaderboard.id
  http_method = aws_api_gateway_method.leaderboard_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.score_api.invoke_arn
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
  function_name = aws_lambda_function.score_api.function_name
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
