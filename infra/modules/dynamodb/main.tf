# DynamoDB Module for Cloud Defenders
# Manages the scores table and related resources

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