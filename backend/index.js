/**
 * Cloud Defenders Backend API
 * AWS Lambda function for score management
 * 
 * This is the main entry point that acts as a router,
 * delegating requests to appropriate handlers
 */

const scoreHandler = require('./src/handlers/scoreHandler');
const apiResponses = require('./src/utils/apiResponses');

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
        
        // Debug logging
        console.log('Parsed request:', {
            httpMethod,
            path,
            hasBody: !!body,
            queryParams: queryStringParameters
        });
        
        // Handle preflight requests
        if (httpMethod === 'OPTIONS') {
            return apiResponses.corsPreflight();
        }
        
        // Route requests
        const routeKey = `${httpMethod} ${path}`;
        console.log('Routing request:', routeKey);
        
        switch (routeKey) {
        case 'POST /api/scores':
            return await scoreHandler.submitScore(JSON.parse(body || '{}'));
        case 'GET /api/leaderboard':
            return await scoreHandler.getLeaderboard(queryStringParameters || {});
        default:
            console.log('No route matched. Available routes: POST /api/scores, GET /api/leaderboard');
            return apiResponses.notFound(
                `Route not found: ${routeKey}`,
                { availableRoutes: ['POST /api/scores', 'GET /api/leaderboard'] }
            );
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return apiResponses.internalError(error.message);
    }
};