# Lambda Function Module for Cloud Defenders
# Manages the Lambda function, IAM roles, and related resources

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
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/*"
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
      DYNAMODB_TABLE = var.dynamodb_table_name
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