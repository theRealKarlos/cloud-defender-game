/**
 * Database Service Layer
 * Abstracts all DynamoDB interactions for the Cloud Defenders API
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client with v3 SDK
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

// Environment variables
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'cloud-defenders-scores';

/**
 * Save a score record to DynamoDB
 * @param {Object} scoreRecord - The score record to save
 * @returns {Promise<void>}
 */
async function saveScore(scoreRecord) {
  const putCommand = new PutCommand({
    TableName: DYNAMODB_TABLE,
    Item: scoreRecord,
  });

  await dynamodb.send(putCommand);
}

/**
 * Get scores from DynamoDB with optional filtering
 * @param {Object} options - Query options
 * @param {string} options.gameMode - Game mode filter
 * @param {string} options.timeframe - Timeframe filter (all, today, week, month)
 * @param {number} options.limit - Maximum number of results to return
 * @returns {Promise<Array>} Array of score records
 */
async function getScores(options = {}) {
  const { gameMode = 'normal', timeframe = 'all', limit = 100 } = options;

  // Use GSI for efficient leaderboard queries
  const queryParams = {
    TableName: DYNAMODB_TABLE,
    IndexName: 'ScoreIndex',
    KeyConditionExpression: 'gameMode = :gameMode',
    ExpressionAttributeValues: {
      ':gameMode': gameMode,
    },
    ScanIndexForward: false, // Sort in descending order (highest score first)
    Limit: limit,
  };

  // Add timeframe filter if specified
  if (timeframe !== 'all') {
    const startDate = calculateStartDate(timeframe);
    if (startDate) {
      queryParams.FilterExpression = 'dateCreated >= :startDate';
      queryParams.ExpressionAttributeValues[':startDate'] = startDate;
    }
  }

  // Query DynamoDB using GSI
  const queryCommand = new QueryCommand(queryParams);
  const result = await dynamodb.send(queryCommand);

  return result.Items || [];
}

/**
 * Calculate start date based on timeframe
 * @param {string} timeframe - Timeframe filter
 * @returns {string|null} Start date in YYYY-MM-DD format or null
 */
function calculateStartDate(timeframe) {
  const now = new Date();

  switch (timeframe) {
    case 'today':
      return now.toISOString().split('T')[0];
    case 'week': {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return weekAgo.toISOString().split('T')[0];
    }
    case 'month': {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return monthAgo.toISOString().split('T')[0];
    }
    default:
      return null;
  }
}

/**
 * Generate a unique score ID
 * @returns {string} Unique score ID
 */
function generateScoreId() {
  return `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a score record with proper structure
 * @param {Object} scoreData - Raw score data
 * @returns {Object} Formatted score record
 */
function createScoreRecord(scoreData) {
  const { playerName, score, wave, gameMode } = scoreData;
  const timestamp = new Date().toISOString();

  return {
    scoreId: generateScoreId(),
    playerName: playerName.trim().substring(0, 50), // Limit name length
    score: score,
    wave: wave,
    gameMode: gameMode || 'normal',
    timestamp: timestamp,
    dateCreated: new Date().toISOString().split('T')[0], // YYYY-MM-DD for querying
    ttl: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year TTL
  };
}

module.exports = {
  saveScore,
  getScores,
  generateScoreId,
  createScoreRecord,
};
