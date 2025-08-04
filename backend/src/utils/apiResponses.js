/**
 * Standardised API Response Utilities
 * Provides consistent HTTP responses with proper CORS headers
 */

// Base CORS headers for all responses
const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Client-Version, X-Timestamp, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
};

/**
 * Create a successful response (200)
 */
function success(body) {
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(body)
    };
}

/**
 * Create a created response (201)
 */
function created(body) {
    return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(body)
    };
}

/**
 * Create a not found response (404)
 */
function notFound(message = 'Not Found', details = {}) {
    return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
            error: 'Not Found',
            message: message,
            ...details
        })
    };
}

/**
 * Create a bad request response (400)
 */
function badRequest(message = 'Bad Request', details = {}) {
    return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
            error: 'Bad Request',
            message: message,
            ...details
        })
    };
}

/**
 * Create an internal server error response (500)
 */
function internalError(message = 'Internal Server Error', details = {}) {
    return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
            error: 'Internal Server Error',
            message: message,
            ...details
        })
    };
}

/**
 * Create a CORS preflight response (200)
 */
function corsPreflight() {
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'CORS preflight' })
    };
}

module.exports = {
    success,
    created,
    notFound,
    badRequest,
    internalError,
    corsPreflight
}; 