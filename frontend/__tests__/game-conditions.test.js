/**
 * Unit Tests for GameConditions
 * Tests victory and defeat condition logic
 */

// Import required modules
const { GameConditions } = require('../js/game-conditions.js');
const { EntityManager } = require('../js/entities.js');
const { WaveManager } = require('../js/wave-manager.js');
const { Target } = require('../js/target.js');
const { Missile } = require('../js/missile.js');

// Mock UIManager for testing
class MockUIManager {
  constructor() {
    this.modalShown = false;
    this.lastModalTitle = '';
    this.lastModalMessage = '';
    this.lastModalScore = 0;
  }

  showModal(title, message, score) {
    this.modalShown = true;
    this.lastModalTitle = title;
    this.lastModalMessage = message;
    this.lastModalScore = score;
  }

  reset() {
    this.modalShown = false;
    this.lastModalTitle = '';
    this.lastModalMessage = '';
    this.lastModalScore = 0;
  }
}

describe('GameConditions', () => {
  let gameConditions;
  let entityManager;
  let waveManager;
  let mockUIManager;
  const canvasWidth = 800;
  const canvasHeight = 600;

  beforeEach(() => {
    entityManager = new EntityManager();
    waveManager = new WaveManager(entityManager, canvasWidth, canvasHeight);
    mockUIManager = new MockUIManager();
    gameConditions = new GameConditions(
      entityManager,
      waveManager,
      mockUIManager
    );

    // Add some test targets
    const target1 = new Target('s3', 100, 100);
    const target2 = new Target('lambda', 200, 150);
    entityManager.addEntity(target1, 'targets');
    entityManager.addEntity(target2, 'targets');
    entityManager.update(0); // Process added entities
  });

  describe('Initialisation', () => {
    test('should initialise with correct default values', () => {
      expect(gameConditions.isGameWon()).toBe(false);
      expect(gameConditions.isGameOver()).toBe(false);
      expect(gameConditions.isGameActive()).toBe(false);
      expect(gameConditions.getCurrentLives()).toBe(3);
      expect(gameConditions.getCurrentScore()).toBe(0);
    });

    test('should initialise with correct victory and defeat conditions', () => {
      const victoryConditions = gameConditions.getVictoryConditions();
      const defeatConditions = gameConditions.getDefeatConditions();

      expect(victoryConditions.allWavesCompleted).toBe(false);
      expect(victoryConditions.allTargetsSurvived).toBe(false);
      expect(defeatConditions.allTargetsDestroyed).toBe(false);
      expect(defeatConditions.livesExhausted).toBe(false);
    });
  });

  describe('Game State Management', () => {
    test('should start game correctly', () => {
      gameConditions.startGame();

      expect(gameConditions.isGameActive()).toBe(true);
      expect(gameConditions.isGameWon()).toBe(false);
      expect(gameConditions.isGameOver()).toBe(false);
      expect(gameConditions.getCurrentLives()).toBe(3);
      expect(gameConditions.getCurrentScore()).toBe(0);
    });

    test('should reset game state correctly', () => {
      gameConditions.startGame();
      gameConditions.currentScore = 1000;
      gameConditions.currentLives = 1;
      gameConditions.gameWon = true;

      gameConditions.reset();

      expect(gameConditions.isGameActive()).toBe(false);
      expect(gameConditions.isGameWon()).toBe(false);
      expect(gameConditions.isGameOver()).toBe(false);
      expect(gameConditions.getCurrentLives()).toBe(3);
      expect(gameConditions.getCurrentScore()).toBe(0);
    });
  });

  describe('Victory Conditions', () => {
    test('should trigger perfect victory when all waves completed with targets alive', () => {
      const victoryCallback = jest.fn();
      gameConditions.setOnVictoryCallback(victoryCallback);
      gameConditions.startGame();

      // Mock all waves completed
      waveManager.allWavesCompleted = true;

      gameConditions.update(0.1);

      expect(gameConditions.isGameWon()).toBe(true);
      expect(gameConditions.isGameActive()).toBe(false);
      expect(victoryCallback).toHaveBeenCalledWith(
        'perfect',
        expect.any(Number)
      );
      expect(mockUIManager.modalShown).toBe(true);
      expect(mockUIManager.lastModalTitle).toBe('Victory!');
    });

    test('should trigger pyrrhic victory when all waves completed but targets destroyed', () => {
      const victoryCallback = jest.fn();
      gameConditions.setOnVictoryCallback(victoryCallback);
      gameConditions.startGame();

      // Mock all waves completed
      waveManager.allWavesCompleted = true;

      // Destroy all targets
      const targets = entityManager.getEntitiesByLayer('targets');
      targets.forEach((target) => {
        target.isDestroyed = true;
      });

      gameConditions.update(0.1);

      expect(gameConditions.isGameWon()).toBe(true);
      expect(victoryCallback).toHaveBeenCalledWith(
        'pyrrhic',
        expect.any(Number)
      );
    });

    test('should calculate victory score bonus correctly', () => {
      gameConditions.startGame();
      gameConditions.currentScore = 1000;

      // Mock all waves completed
      waveManager.allWavesCompleted = true;

      gameConditions.update(0); // Use 0 deltaTime to avoid time-based score updates

      // Perfect victory should give 50% bonus (1000 + 500 = 1500)
      expect(gameConditions.getCurrentScore()).toBe(1500);
    });
  });

  describe('Defeat Conditions', () => {
    test('should trigger defeat when all targets destroyed', () => {
      const defeatCallback = jest.fn();
      gameConditions.setOnDefeatCallback(defeatCallback);
      gameConditions.startGame();

      // Destroy all targets
      const targets = entityManager.getEntitiesByLayer('targets');
      targets.forEach((target) => {
        target.isDestroyed = true;
      });

      gameConditions.update(0.1);

      expect(gameConditions.isGameOver()).toBe(true);
      expect(gameConditions.isGameActive()).toBe(false);
      expect(defeatCallback).toHaveBeenCalledWith(
        'targets_destroyed',
        expect.any(Number)
      );
      expect(mockUIManager.modalShown).toBe(true);
      expect(mockUIManager.lastModalTitle).toBe('Game Over');
    });

    test('should trigger defeat when lives exhausted', () => {
      const defeatCallback = jest.fn();
      gameConditions.setOnDefeatCallback(defeatCallback);
      gameConditions.startGame();

      // Exhaust all lives
      gameConditions.currentLives = 0;

      gameConditions.update(0.1);

      expect(gameConditions.isGameOver()).toBe(true);
      expect(defeatCallback).toHaveBeenCalledWith(
        'lives_exhausted',
        expect.any(Number)
      );
    });

    test('should not trigger defeat if some targets remain alive', () => {
      gameConditions.startGame();

      // Destroy only one target
      const targets = entityManager.getEntitiesByLayer('targets');
      targets[0].isDestroyed = true;

      gameConditions.update(0.1);

      expect(gameConditions.isGameOver()).toBe(false);
      expect(gameConditions.isGameActive()).toBe(true);
    });
  });

  describe('Score System', () => {
    test('should update score over time during active game', () => {
      gameConditions.startGame();
      const initialScore = gameConditions.getCurrentScore();

      gameConditions.update(1.0); // 1 second

      expect(gameConditions.getCurrentScore()).toBeGreaterThan(initialScore);
    });

    test('should award points for missile interception', () => {
      const scoreCallback = jest.fn();
      gameConditions.setOnScoreChangedCallback(scoreCallback);
      gameConditions.startGame();

      const missile = new Missile('cost-spike', 100, 100, 200, 200);
      const initialScore = gameConditions.getCurrentScore();

      gameConditions.onMissileIntercepted(missile);

      expect(gameConditions.getCurrentScore()).toBeGreaterThan(initialScore);
      expect(scoreCallback).toHaveBeenCalled();
    });

    test('should award different points for different missile types', () => {
      gameConditions.startGame();

      const costSpike = new Missile('cost-spike', 100, 100, 200, 200);
      const dataBreach = new Missile('data-breach', 100, 100, 200, 200);

      const initialScore = gameConditions.getCurrentScore();
      gameConditions.onMissileIntercepted(costSpike);
      const scoreAfterCostSpike = gameConditions.getCurrentScore();

      gameConditions.onMissileIntercepted(dataBreach);
      const scoreAfterDataBreach = gameConditions.getCurrentScore();

      const costSpikePoints = scoreAfterCostSpike - initialScore;
      const dataBreachPoints = scoreAfterDataBreach - scoreAfterCostSpike;

      expect(dataBreachPoints).toBeGreaterThan(costSpikePoints);
    });

    test('should award wave completion bonus', () => {
      const scoreCallback = jest.fn();
      gameConditions.setOnScoreChangedCallback(scoreCallback);
      gameConditions.startGame();

      const initialScore = gameConditions.getCurrentScore();
      const initialMultiplier = gameConditions.getScoreMultiplier();

      gameConditions.onWaveCompleted(5);

      expect(gameConditions.getCurrentScore()).toBeGreaterThan(initialScore);
      expect(gameConditions.getScoreMultiplier()).toBeGreaterThan(
        initialMultiplier
      );
      expect(scoreCallback).toHaveBeenCalled();
    });

    test('should award power-up collection points', () => {
      gameConditions.startGame();
      const initialScore = gameConditions.getCurrentScore();

      gameConditions.onPowerUpCollected('auto-scaling');

      expect(gameConditions.getCurrentScore()).toBeGreaterThan(initialScore);
    });
  });

  describe('Lives System', () => {
    test('should lose life when target is hit', () => {
      const livesCallback = jest.fn();
      gameConditions.setOnLivesChangedCallback(livesCallback);
      gameConditions.startGame();

      const target = new Target('s3', 100, 100);
      const missile = new Missile('cost-spike', 100, 100, 200, 200);

      gameConditions.onTargetHit(target, missile);

      expect(gameConditions.getCurrentLives()).toBe(2);
      expect(livesCallback).toHaveBeenCalledWith(2);
    });

    test('should not go below zero lives', () => {
      gameConditions.startGame();
      gameConditions.currentLives = 1;

      const target = new Target('s3', 100, 100);
      const missile = new Missile('cost-spike', 100, 100, 200, 200);

      gameConditions.onTargetHit(target, missile);

      expect(gameConditions.getCurrentLives()).toBe(0);
      expect(gameConditions.isGameOver()).toBe(true);
    });

    test('should allow manual life setting within bounds', () => {
      gameConditions.setLives(2);
      expect(gameConditions.getCurrentLives()).toBe(2);

      gameConditions.setLives(-1);
      expect(gameConditions.getCurrentLives()).toBe(0);

      gameConditions.setLives(10);
      expect(gameConditions.getCurrentLives()).toBe(3); // Max lives
    });
  });

  describe('Game State Checks', () => {
    test('should not update when game is not active', () => {
      // Don't start game
      const initialScore = gameConditions.getCurrentScore();

      gameConditions.update(1.0);

      expect(gameConditions.getCurrentScore()).toBe(initialScore);
    });

    test('should not update when game is won', () => {
      gameConditions.startGame();
      gameConditions.gameWon = true;
      gameConditions.gameActive = false;

      const initialScore = gameConditions.getCurrentScore();

      gameConditions.update(1.0);

      expect(gameConditions.getCurrentScore()).toBe(initialScore);
    });

    test('should not update when game is over', () => {
      gameConditions.startGame();
      gameConditions.gameOver = true;
      gameConditions.gameActive = false;

      const initialScore = gameConditions.getCurrentScore();

      gameConditions.update(1.0);

      expect(gameConditions.getCurrentScore()).toBe(initialScore);
    });
  });

  describe('Callback System', () => {
    test('should register and call victory callback', () => {
      const callback = jest.fn();
      gameConditions.setOnVictoryCallback(callback);
      gameConditions.startGame();

      waveManager.allWavesCompleted = true;
      gameConditions.update(0.1);

      expect(callback).toHaveBeenCalledWith('perfect', expect.any(Number));
    });

    test('should register and call defeat callback', () => {
      const callback = jest.fn();
      gameConditions.setOnDefeatCallback(callback);
      gameConditions.startGame();

      gameConditions.currentLives = 0;
      gameConditions.update(0.1);

      expect(callback).toHaveBeenCalledWith(
        'lives_exhausted',
        expect.any(Number)
      );
    });

    test('should register and call score changed callback', () => {
      const callback = jest.fn();
      gameConditions.setOnScoreChangedCallback(callback);
      gameConditions.startGame();

      gameConditions.addScore(100);

      expect(callback).toHaveBeenCalledWith(expect.any(Number));
    });

    test('should register and call lives changed callback', () => {
      const callback = jest.fn();
      gameConditions.setOnLivesChangedCallback(callback);

      gameConditions.setLives(2);

      expect(callback).toHaveBeenCalledWith(2);
    });
  });

  describe('Manual Score Control', () => {
    test('should set score correctly', () => {
      gameConditions.setScore(1500);
      expect(gameConditions.getCurrentScore()).toBe(1500);

      gameConditions.setScore(-100);
      expect(gameConditions.getCurrentScore()).toBe(0); // Should not go negative
    });

    test('should add score correctly', () => {
      gameConditions.setScore(100);
      gameConditions.addScore(50);
      expect(gameConditions.getCurrentScore()).toBe(150);

      gameConditions.addScore(-10);
      expect(gameConditions.getCurrentScore()).toBe(150); // Should not subtract
    });
  });
});
