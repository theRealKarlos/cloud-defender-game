/**
 * Score Handler Tests
 * Unit tests for score submission and leaderboard functionality
 */

// Mock dependencies
jest.mock('../src/services/dbService');
jest.mock('../src/utils/apiResponses');
jest.mock('../src/services/scoreValidator');

const { submitScore, getLeaderboard } = require('../src/handlers/scoreHandler');
const dbService = require('../src/services/dbService');
const apiResponses = require('../src/utils/apiResponses');
const { ScoreValidator } = require('../src/services/scoreValidator');

describe('Score Handler', () => {
  let mockScoreValidator;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup mock ScoreValidator
    mockScoreValidator = {
      validateScore: jest.fn(),
    };
    ScoreValidator.mockImplementation(() => mockScoreValidator);

    // Setup default mock responses
    dbService.createScoreRecord.mockReturnValue({
      scoreId: 'test-score-123',
      playerName: 'TestPlayer',
      score: 1000,
      wave: 5,
      gameMode: 'normal',
      timestamp: '2025-08-04T18:17:00.000Z',
      dateCreated: '2025-08-04',
    });

    dbService.saveScore.mockResolvedValue();

    dbService.getScores.mockResolvedValue([
      {
        scoreId: 'score-1',
        playerName: 'Player1',
        score: 1500,
        wave: 8,
        gameMode: 'normal',
        timestamp: '2025-08-04T18:00:00.000Z',
        dateCreated: '2025-08-04',
      },
      {
        scoreId: 'score-2',
        playerName: 'Player2',
        score: 1200,
        wave: 6,
        gameMode: 'normal',
        timestamp: '2025-08-04T17:00:00.000Z',
        dateCreated: '2025-08-04',
      },
    ]);

    // Setup API response mocks
    apiResponses.created.mockReturnValue({
      statusCode: 201,
      body: JSON.stringify({ message: 'Score submitted successfully' }),
    });

    apiResponses.success.mockReturnValue({
      statusCode: 200,
      body: JSON.stringify({ leaderboard: [] }),
    });

    apiResponses.badRequest.mockReturnValue({
      statusCode: 400,
      body: JSON.stringify({ error: 'Bad request' }),
    });

    apiResponses.internalError.mockReturnValue({
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  });

  describe('submitScore', () => {
    const validScoreData = {
      playerName: 'TestPlayer',
      score: 1000,
      wave: 5,
      gameMode: 'normal',
    };

    test('should successfully submit a valid score', async () => {
      // Setup validation to pass
      mockScoreValidator.validateScore.mockReturnValue({
        action: 'ACCEPT',
        confidence: 0.9,
        flags: [],
      });

      const result = await submitScore(validScoreData);

      // Verify validation was called
      expect(mockScoreValidator.validateScore).toHaveBeenCalledWith(
        validScoreData
      );

      // Verify database operations were called
      expect(dbService.createScoreRecord).toHaveBeenCalledWith(validScoreData);
      expect(dbService.saveScore).toHaveBeenCalled();

      // Verify success response
      expect(apiResponses.created).toHaveBeenCalledWith({
        message: 'Score submitted successfully',
        scoreId: 'test-score-123',
        playerName: 'TestPlayer',
        score: 1000,
        wave: 5,
        timestamp: '2025-08-04T18:17:00.000Z',
      });

      expect(result.statusCode).toBe(201);
    });

    test('should reject score with invalid player name', async () => {
      const invalidData = { ...validScoreData, playerName: '' };

      const result = await submitScore(invalidData);

      expect(apiResponses.badRequest).toHaveBeenCalledWith(
        'Player name is required and must be a non-empty string'
      );
      expect(result.statusCode).toBe(400);

      // Verify database operations were not called
      expect(dbService.createScoreRecord).not.toHaveBeenCalled();
      expect(dbService.saveScore).not.toHaveBeenCalled();
    });

    test('should reject score with negative score', async () => {
      const invalidData = { ...validScoreData, score: -100 };

      const result = await submitScore(invalidData);

      expect(apiResponses.badRequest).toHaveBeenCalledWith(
        'Score must be a non-negative number'
      );
      expect(result.statusCode).toBe(400);
    });

    test('should reject score with invalid wave', async () => {
      const invalidData = { ...validScoreData, wave: 0 };

      const result = await submitScore(invalidData);

      expect(apiResponses.badRequest).toHaveBeenCalledWith(
        'Wave must be a positive number'
      );
      expect(result.statusCode).toBe(400);
    });

    test('should reject score that fails advanced validation', async () => {
      // Setup validation to reject
      mockScoreValidator.validateScore.mockReturnValue({
        action: 'REJECT',
        confidence: 0.8,
        flags: ['suspicious_pattern'],
      });

      const result = await submitScore(validScoreData);

      expect(apiResponses.badRequest).toHaveBeenCalledWith(
        'Score validation failed',
        {
          flags: ['suspicious_pattern'],
          confidence: 0.8,
        }
      );
      expect(result.statusCode).toBe(400);

      // Verify database operations were not called
      expect(dbService.createScoreRecord).not.toHaveBeenCalled();
      expect(dbService.saveScore).not.toHaveBeenCalled();
    });

    test('should accept score marked for review in lab environment', async () => {
      // Setup validation to mark for review
      mockScoreValidator.validateScore.mockReturnValue({
        action: 'REVIEW',
        confidence: 0.6,
        flags: ['unusual_pattern'],
      });

      const result = await submitScore(validScoreData);

      // Should still accept in lab environment
      expect(apiResponses.created).toHaveBeenCalled();
      expect(result.statusCode).toBe(201);

      // Verify database operations were called
      expect(dbService.createScoreRecord).toHaveBeenCalled();
      expect(dbService.saveScore).toHaveBeenCalled();
    });

    test('should handle database errors gracefully', async () => {
      // Setup validation to pass
      mockScoreValidator.validateScore.mockReturnValue({
        action: 'ACCEPT',
        confidence: 0.9,
        flags: [],
      });

      // Setup database to throw error
      dbService.saveScore.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await submitScore(validScoreData);

      expect(apiResponses.internalError).toHaveBeenCalledWith(
        'Failed to submit score'
      );
      expect(result.statusCode).toBe(500);
    });
  });

  describe('getLeaderboard', () => {
    test('should return leaderboard with default parameters', async () => {
      const result = await getLeaderboard({});

      // Verify database query was called with defaults
      expect(dbService.getScores).toHaveBeenCalledWith({
        gameMode: 'normal',
        timeframe: 'all',
        limit: 10,
      });

      // Verify response format
      expect(apiResponses.success).toHaveBeenCalledWith({
        leaderboard: [
          {
            rank: 1,
            scoreId: 'score-1',
            playerName: 'Player1',
            score: 1500,
            wave: 8,
            gameMode: 'normal',
            timestamp: '2025-08-04T18:00:00.000Z',
            dateCreated: '2025-08-04',
          },
          {
            rank: 2,
            scoreId: 'score-2',
            playerName: 'Player2',
            score: 1200,
            wave: 6,
            gameMode: 'normal',
            timestamp: '2025-08-04T17:00:00.000Z',
            dateCreated: '2025-08-04',
          },
        ],
        metadata: {
          totalResults: 2,
          limit: 10,
          gameMode: 'normal',
          timeframe: 'all',
          timestamp: expect.any(String),
        },
      });

      expect(result.statusCode).toBe(200);
    });

    test('should handle custom query parameters', async () => {
      const queryParams = {
        limit: '5',
        gameMode: 'hardcore',
        timeframe: 'week',
      };

      await getLeaderboard(queryParams);

      expect(dbService.getScores).toHaveBeenCalledWith({
        gameMode: 'hardcore',
        timeframe: 'week',
        limit: 5,
      });
    });

    test('should cap limit at maximum value', async () => {
      const queryParams = { limit: '150' };

      await getLeaderboard(queryParams);

      expect(dbService.getScores).toHaveBeenCalledWith({
        gameMode: 'normal',
        timeframe: 'all',
        limit: 100, // Should be capped at 100
      });
    });

    test('should handle database errors gracefully', async () => {
      dbService.getScores.mockRejectedValue(new Error('Database query failed'));

      const result = await getLeaderboard({});

      expect(apiResponses.internalError).toHaveBeenCalledWith(
        'Failed to fetch leaderboard'
      );
      expect(result.statusCode).toBe(500);
    });

    test('should handle empty leaderboard', async () => {
      dbService.getScores.mockResolvedValue([]);

      const result = await getLeaderboard({});

      expect(apiResponses.success).toHaveBeenCalledWith({
        leaderboard: [],
        metadata: {
          totalResults: 0,
          limit: 10,
          gameMode: 'normal',
          timeframe: 'all',
          timestamp: expect.any(String),
        },
      });

      expect(result.statusCode).toBe(200);
    });
  });
});
