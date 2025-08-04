/**
 * Score Handler
 * Contains business logic for score submission and leaderboard operations
 */

const dbService = require('../services/dbService');
const apiResponses = require('../utils/apiResponses');

/**
 * Submit a new score
 * @param {Object} scoreData - The score data to submit
 * @returns {Promise<Object>} API response
 */
async function submitScore(scoreData) {
    try {
        console.log('Score submission requested:', scoreData);
        
        // Validate required fields
        const { playerName, score, wave } = scoreData;
        
        if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
            return apiResponses.badRequest('Player name is required and must be a non-empty string');
        }
        
        if (typeof score !== 'number' || score < 0) {
            return apiResponses.badRequest('Score must be a non-negative number');
        }
        
        if (typeof wave !== 'number' || wave < 1) {
            return apiResponses.badRequest('Wave must be a positive number');
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
        
        // Get scores from database
        const scores = await dbService.getScores({ gameMode, timeframe });
        
        // Sort by score (descending) and then by wave (descending)
        const sortedScores = scores
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
        
        return apiResponses.success({
            leaderboard: sortedScores,
            metadata: {
                totalResults: sortedScores.length,
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