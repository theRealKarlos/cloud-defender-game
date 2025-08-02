/**
 * Cloud Defenders Backend API
 * AWS Lambda function for score management
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client with v3 SDK
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

// Environment variables
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'cloud-defenders-scores';

/**
 * Lambda handler function
 */
exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    try {
        // Handle both API Gateway v1 (REST API) and v2 (HTTP API) formats
        const httpMethod = event.httpMethod || event.requestContext?.http?.method;
        let path = event.path || event.rawPath || event.requestContext?.http?.path;
        const body = event.body;
        const queryStringParameters = event.queryStringParameters;
        
        // For API Gateway v2, remove the stage prefix from the path
        // e.g., '/dev/api/scores' becomes '/api/scores'
        if (path && path.startsWith('/dev/')) {
            path = path.substring(4); // Remove '/dev' prefix
        }
        
        // CORS headers - Enhanced for local development
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, X-Client-Version, X-Timestamp, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'false'
        };
        
        // Debug logging
        console.log('Parsed request:', {
            httpMethod,
            path,
            hasBody: !!body,
            queryParams: queryStringParameters
        });
        
        // Handle preflight requests
        if (httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'CORS preflight' })
            };
        }
        
        // Route requests
        const routeKey = `${httpMethod} ${path}`;
        console.log('Routing request:', routeKey);
        
        switch (routeKey) {
            case 'POST /api/scores':
                return await submitScore(JSON.parse(body || '{}'), headers);
            case 'GET /api/leaderboard':
                return await getLeaderboard(queryStringParameters || {}, headers);
            default:
                console.log('No route matched. Available routes: POST /api/scores, GET /api/leaderboard');
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Not Found',
                        message: `Route not found: ${routeKey}`,
                        availableRoutes: ['POST /api/scores', 'GET /api/leaderboard']
                    })
                };
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message
            })
        };
    }
};

/**
 * Submit a new score
 */
async function submitScore(scoreData, headers) {
    try {
        console.log('Score submission requested:', scoreData);
        
        // Validate required fields
        const { playerName, score, wave, gameMode } = scoreData;
        
        if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Bad Request',
                    message: 'Player name is required and must be a non-empty string'
                })
            };
        }
        
        if (typeof score !== 'number' || score < 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Bad Request',
                    message: 'Score must be a non-negative number'
                })
            };
        }
        
        if (typeof wave !== 'number' || wave < 1) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Bad Request',
                    message: 'Wave must be a positive number'
                })
            };
        }
        
        // Generate unique score ID and timestamp
        const scoreId = `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();
        
        // Prepare score record
        const scoreRecord = {
            scoreId: scoreId,
            playerName: playerName.trim().substring(0, 50), // Limit name length
            score: score,
            wave: wave,
            gameMode: gameMode || 'normal',
            timestamp: timestamp,
            dateCreated: new Date().toISOString().split('T')[0], // YYYY-MM-DD for querying
            ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
        };
        
        // Save to DynamoDB
        const putCommand = new PutCommand({
            TableName: DYNAMODB_TABLE,
            Item: scoreRecord
        });
        
        await dynamodb.send(putCommand);
        
        console.log('Score saved successfully:', scoreId);
        
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                message: 'Score submitted successfully',
                scoreId: scoreId,
                playerName: scoreRecord.playerName,
                score: scoreRecord.score,
                wave: scoreRecord.wave,
                timestamp: scoreRecord.timestamp
            })
        };
        
    } catch (error) {
        console.error('Error submitting score:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: 'Failed to submit score'
            })
        };
    }
}

/**
 * Get leaderboard data
 */
async function getLeaderboard(queryParams, headers) {
    try {
        console.log('Leaderboard requested with params:', queryParams);
        
        // Parse query parameters
        const limit = Math.min(parseInt(queryParams.limit) || 10, 100); // Max 100 results
        const gameMode = queryParams.gameMode || 'normal';
        const timeframe = queryParams.timeframe || 'all'; // all, today, week, month
        
        let filterExpression = undefined;
        let expressionAttributeValues = {};
        
        // Add game mode filter
        if (gameMode !== 'all') {
            filterExpression = 'gameMode = :gameMode';
            expressionAttributeValues[':gameMode'] = gameMode;
        }
        
        // Add timeframe filter
        if (timeframe !== 'all') {
            const now = new Date();
            let startDate;
            
            switch (timeframe) {
                case 'today':
                    startDate = now.toISOString().split('T')[0];
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    startDate = weekAgo.toISOString().split('T')[0];
                    break;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    startDate = monthAgo.toISOString().split('T')[0];
                    break;
                default:
                    startDate = null;
            }
            
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
        
        // Scan DynamoDB table (for small datasets, consider using GSI for larger ones)
        const scanCommand = new ScanCommand({
            TableName: DYNAMODB_TABLE,
            FilterExpression: filterExpression,
            ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined
        });
        
        const result = await dynamodb.send(scanCommand);
        
        // Sort by score (descending) and then by wave (descending)
        const sortedScores = (result.Items || [])
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score; // Higher score first
                }
                return b.wave - a.wave; // Higher wave first if scores are equal
            })
            .slice(0, limit) // Apply limit
            .map((item, index) => ({
                rank: index + 1,
                scoreId: item.scoreId,
                playerName: item.playerName,
                score: item.score,
                wave: item.wave,
                gameMode: item.gameMode,
                timestamp: item.timestamp,
                dateCreated: item.dateCreated
            }));
        
        console.log(`Leaderboard query returned ${sortedScores.length} scores`);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                leaderboard: sortedScores,
                metadata: {
                    totalResults: sortedScores.length,
                    limit: limit,
                    gameMode: gameMode,
                    timeframe: timeframe,
                    timestamp: new Date().toISOString()
                }
            })
        };
        
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: 'Failed to fetch leaderboard'
            })
        };
    }
}