/**
 * Score Handler
 * Contains business logic for score submission and leaderboard operations
 */

const dbService = require('../services/dbService');
const apiResponses = require('../utils/apiResponses');
const { ScoreValidator } = require('../services/scoreValidator');

/**
 * Validate basic score input fields
 * @param {Object} scoreData - The score data to validate
 * @returns {Object|null} Error response or null if valid
 */
function validateBasicInputs(scoreData) {
    const { playerName, score, wave } = scoreData;

    if (
        !playerName ||
    typeof playerName !== 'string' ||
    playerName.trim().length === 0
    ) {
        return apiResponses.badRequest(
            'Player name is required and must be a non-empty string'
        );
    }

    if (typeof score !== 'number' || score < 0) {
        return apiResponses.badRequest('Score must be a non-negative number');
    }

    if (typeof wave !== 'number' || wave < 1) {
        return apiResponses.badRequest('Wave must be a positive number');
    }

    return null; // No validation errors
}

/**
 * Perform advanced score validation using ScoreValidator
 * @param {Object} scoreData - The score data to validate
 * @returns {Object|null} Error response or null if valid
 */
function performAdvancedValidation(scoreData) {
    const validator = new ScoreValidator();
    const validationResult = validator.validateScore(scoreData);

    console.log('Score validation result:', {
        action: validationResult.action,
        confidence: validationResult.confidence,
        flags: validationResult.flags
    });

    // Reject scores that fail validation
    if (validationResult.action === 'REJECT') {
        return apiResponses.badRequest('Score validation failed', {
            flags: validationResult.flags,
            confidence: validationResult.confidence
        });
    }

    // For lab environment, accept both ACCEPT and REVIEW actions
    // In production, you might want to handle REVIEW differently
    if (validationResult.action === 'REVIEW') {
        console.log('Score marked for review but accepted in lab environment');
    }

    return null; // Validation passed
}

/**
 * Submit a new score
 * @param {Object} scoreData - The score data to submit
 * @returns {Promise<Object>} API response
 */
async function submitScore(scoreData) {
    try {
        console.log('Score submission requested:', scoreData);

        // Validate basic input fields
        const basicValidationError = validateBasicInputs(scoreData);
        if (basicValidationError) {
            return basicValidationError;
        }

        // Perform advanced score validation
        const advancedValidationError = performAdvancedValidation(scoreData);
        if (advancedValidationError) {
            return advancedValidationError;
        }

        // Create score record
        const scoreRecord = dbService.createScoreRecord(scoreData);

        // Save to database
        await dbService.saveScore(scoreRecord);

        console.log('Score saved successfully:', scoreRecord.scoreId);

        return apiResponses.created({
            message: 'Score submitted successfully',
            scoreId: scoreRecord.scoreId,
            playerName: scoreRecord.playerName,
            score: scoreRecord.score,
            wave: scoreRecord.wave,
            timestamp: scoreRecord.timestamp
        });
    } catch (error) {
        console.error('Error submitting score:', error);
        return apiResponses.internalError('Failed to submit score');
    }
}

/**
 * Get leaderboard data
 * @param {Object} queryParams - Query parameters for filtering
 * @returns {Promise<Object>} API response
 */
async function getLeaderboard(queryParams) {
    try {
        console.log('Leaderboard requested with params:', queryParams);

        // Parse query parameters
        const limit = Math.min(parseInt(queryParams.limit) || 10, 100); // Max 100 results
        const gameMode = queryParams.gameMode || 'normal';
        const timeframe = queryParams.timeframe || 'all'; // all, today, week, month

        // Get scores from database using GSI (already sorted by score descending)
        const scores = await dbService.getScores({ gameMode, timeframe, limit });

        // Map scores to leaderboard format (already sorted by GSI)
        const leaderboardScores = scores.map((item, index) => ({
            rank: index + 1,
            scoreId: item.scoreId,
            playerName: item.playerName,
            score: item.score,
            wave: item.wave,
            gameMode: item.gameMode,
            timestamp: item.timestamp,
            dateCreated: item.dateCreated
        }));

        console.log(
            `Leaderboard query returned ${leaderboardScores.length} scores`
        );

        return apiResponses.success({
            leaderboard: leaderboardScores,
            metadata: {
                totalResults: leaderboardScores.length,
                limit: limit,
                gameMode: gameMode,
                timeframe: timeframe,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return apiResponses.internalError('Failed to fetch leaderboard');
    }
}

module.exports = {
    submitScore,
    getLeaderboard
};
