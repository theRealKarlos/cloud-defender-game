/**
 * Cloud Defenders Backend API
 * AWS Lambda function for score management
 *
 * This is the main entry point that acts as a router,
 * delegating requests to appropriate handlers
 */

const scoreHandler = require('./src/handlers/scoreHandler');
const healthHandler = require('./src/handlers/healthHandler');
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

    // For API Gateway v2, remove stage prefix (e.g., '/dev', '/staging', '/prod') from the path
    // so '/dev/api/scores' becomes '/api/scores'. Handles arbitrary stage names safely.
    if (path && /^\/[A-Za-z0-9_-]+\//.test(path)) {
      // Remove only the first segment (stage) if event indicates HTTP API v2
      const isHttpApiV2 = !!event.requestContext?.http;
      if (isHttpApiV2) {
        const firstSlash = path.indexOf('/', 1);
        if (firstSlash !== -1) {
          path = path.substring(firstSlash);
        }
      }
    }

    // Debug logging
    console.log('Parsed request:', {
      httpMethod,
      path,
      hasBody: !!body,
      queryParams: queryStringParameters,
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
      case 'GET /health':
        return await healthHandler.handler(event);
      default:
        console.log(
          'No route matched. Available routes: POST /api/scores, GET /api/leaderboard, GET /health'
        );
        return apiResponses.notFound(`Route not found: ${routeKey}`, {
          availableRoutes: [
            'POST /api/scores',
            'GET /api/leaderboard',
            'GET /health',
          ],
        });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return apiResponses.internalError(error.message);
  }
};
