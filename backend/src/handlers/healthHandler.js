/**
 * Health Check Handler
 * Simple endpoint to verify backend service is operational
 */

exports.handler = async (_event, _context) => {
  console.log('Health check requested');

  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify({
      status: 'healthy',
      message: 'Backend is operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }),
  };

  return response;
};
