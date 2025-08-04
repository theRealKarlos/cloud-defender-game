/**
 * Database Service Layer
 * Abstracts all DynamoDB interactions for the Cloud Defenders API
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

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
        Item: scoreRecord
    });
    
    await dynamodb.send(putCommand);
}

/**
 * Get scores from DynamoDB with optional filtering
 * @param {Object} options - Query options
 * @param {string} options.gameMode - Game mode filter
 * @param {string} options.timeframe - Timeframe filter (all, today, week, month)
 * @returns {Promise<Array>} Array of score records
 */
async function getScores(options = {}) {
    const { gameMode = 'normal', timeframe = 'all' } = options;
    
    const { filterExpression, expressionAttributeValues } = buildFilterExpression(gameMode, timeframe);
    
    // Scan DynamoDB table
    const scanCommand = new ScanCommand({
        TableName: DYNAMODB_TABLE,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined
    });
    
    const result = await dynamodb.send(scanCommand);
    return result.Items || [];
}

/**
 * Build DynamoDB filter expression based on game mode and timeframe
 * @param {string} gameMode - Game mode filter
 * @param {string} timeframe - Timeframe filter
 * @returns {Object} Filter expression and attribute values
 */
function buildFilterExpression(gameMode, timeframe) {
    let filterExpression = undefined;
    const expressionAttributeValues = {};
    
    // Add game mode filter
    if (gameMode !== 'all') {
        filterExpression = 'gameMode = :gameMode';
        expressionAttributeValues[':gameMode'] = gameMode;
    }
    
    // Add timeframe filter
    if (timeframe !== 'all') {
        const startDate = calculateStartDate(timeframe);
        if (startDate) {
            const timeFilter = 'dateCreated >= :startDate';
            if (filterExpression) {
                filterExpression += ' AND ' + timeFilter;
            } else {
                filterExpression = timeFilter;
            }
            expressionAttributeValues[':startDate'] = startDate;
        }
    }
    
    return { filterExpression, expressionAttributeValues };
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
        ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    };
}

module.exports = {
    saveScore,
    getScores,
    generateScoreId,
    createScoreRecord,
    buildFilterExpression
}; 