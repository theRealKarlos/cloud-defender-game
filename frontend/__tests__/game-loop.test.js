const { GameLoop } = require('../js/game-loop.js');

// Mock browser globals for Node.js environment
global.performance = {
  now: jest.fn(),
};
global.requestAnimationFrame = jest.fn();
global.cancelAnimationFrame = jest.fn();

describe('GameLoop', () => {
  let gameLoop;
  let updateCallback;
  let renderCallback;

  beforeEach(() => {
    gameLoop = new GameLoop();
    updateCallback = jest.fn();
    renderCallback = jest.fn();
    gameLoop.setCallbacks(updateCallback, renderCallback);

    // Reset mocks
    performance.now.mockReset().mockReturnValue(0);
    requestAnimationFrame.mockClear();
    cancelAnimationFrame.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with correct default values', () => {
      // Test constructor with a fresh instance (not the one modified in beforeEach)
      const freshGameLoop = new GameLoop();

      expect(freshGameLoop.lastFrameTime).toBe(0);
      expect(freshGameLoop.deltaTime).toBe(0);
      expect(freshGameLoop.fps).toBe(0);
      expect(freshGameLoop.frameCount).toBe(0);
      expect(freshGameLoop.lastFpsUpdate).toBe(0);
      expect(freshGameLoop.tickRate).toBe(1 / 60); // 60 FPS
      expect(freshGameLoop.accumulator).toBe(0);
      expect(freshGameLoop.maxAccumulator).toBe((1 / 60) * 5);
      expect(freshGameLoop.isRunning).toBe(false);
      expect(freshGameLoop.animationFrameId).toBeNull();
      expect(freshGameLoop.updateCallback).toBeNull();
      expect(freshGameLoop.renderCallback).toBeNull();
    });
  });

  describe('setCallbacks', () => {
    test('should set update and render callbacks', () => {
      const mockUpdate = jest.fn();
      const mockRender = jest.fn();

      gameLoop.setCallbacks(mockUpdate, mockRender);

      expect(gameLoop.updateCallback).toBe(mockUpdate);
      expect(gameLoop.renderCallback).toBe(mockRender);
    });
  });

  describe('start', () => {
    test('should start the game loop', () => {
      performance.now.mockReturnValue(1000);

      gameLoop.start();

      expect(gameLoop.isRunning).toBe(true);
      expect(gameLoop.lastFrameTime).toBe(1000);
      expect(gameLoop.lastFpsUpdate).toBe(1000);
      expect(gameLoop.accumulator).toBe(0);
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    test('should not start if already running', () => {
      gameLoop.isRunning = true;
      requestAnimationFrame.mockClear();

      gameLoop.start();

      expect(requestAnimationFrame).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    test('should stop the game loop', () => {
      gameLoop.isRunning = true;
      gameLoop.animationFrameId = 123;

      gameLoop.stop();

      expect(gameLoop.isRunning).toBe(false);
      expect(cancelAnimationFrame).toHaveBeenCalledWith(123);
      expect(gameLoop.animationFrameId).toBeNull();
    });
  });

  describe('Fixed Timestep Logic', () => {
    test('should call update with fixed timestep when enough time has accumulated', () => {
      // Simulate 16.67ms (1 frame at 60 FPS)
      performance.now.mockReturnValueOnce(0).mockReturnValueOnce(16.67);

      gameLoop.lastFrameTime = 0;
      gameLoop.isRunning = true; // Must be running for loop to execute
      gameLoop.loop(16.67);

      expect(updateCallback).toHaveBeenCalledWith(1 / 60);
      expect(updateCallback).toHaveBeenCalledTimes(1);
      expect(renderCallback).toHaveBeenCalledTimes(1);
    });

    test('should call update multiple times for large time steps', () => {
      // Simulate 50ms (about 3 frames at 60 FPS)
      performance.now.mockReturnValueOnce(0).mockReturnValueOnce(50);

      gameLoop.lastFrameTime = 0;
      gameLoop.isRunning = true; // Must be running for loop to execute
      gameLoop.loop(50);

      // Should call update 3 times (50ms / 16.67ms ≈ 3)
      expect(updateCallback).toHaveBeenCalledWith(1 / 60);
      expect(updateCallback).toHaveBeenCalledTimes(3);
      expect(renderCallback).toHaveBeenCalledTimes(1);
    });

    test('should not call update if not enough time has accumulated', () => {
      // Simulate 8ms (half a frame at 60 FPS)
      performance.now.mockReturnValueOnce(0).mockReturnValueOnce(8);

      gameLoop.lastFrameTime = 0;
      gameLoop.isRunning = true; // Must be running for loop to execute
      gameLoop.loop(8);

      expect(updateCallback).not.toHaveBeenCalled();
      expect(renderCallback).toHaveBeenCalledTimes(1);
      expect(gameLoop.accumulator).toBeCloseTo(0.008, 5);
    });

    test('should cap delta time to prevent spiral of death', () => {
      // Simulate a very large time step (1 second)
      performance.now.mockReturnValueOnce(0).mockReturnValueOnce(1000);

      gameLoop.lastFrameTime = 0;
      gameLoop.isRunning = true; // Must be running for loop to execute
      gameLoop.loop(1000);

      // Should be capped to maxAccumulator (5 * tickRate = 5/60 ≈ 0.083s)
      const expectedCalls = Math.floor(
        gameLoop.maxAccumulator / gameLoop.tickRate
      );
      expect(updateCallback).toHaveBeenCalledTimes(expectedCalls);
    });
  });

  describe('FPS Calculation', () => {
    test('should calculate FPS correctly', () => {
      // Mock multiple frames over 1 second
      performance.now
        .mockReturnValueOnce(0) // Initial
        .mockReturnValueOnce(16.67) // Frame 1
        .mockReturnValueOnce(33.33) // Frame 2
        .mockReturnValueOnce(1000); // After 1 second

      gameLoop.lastFrameTime = 0;
      gameLoop.lastFpsUpdate = 0;
      gameLoop.isRunning = true; // Must be running for loop to execute

      gameLoop.loop(16.67);
      gameLoop.loop(33.33);
      gameLoop.loop(1000);

      expect(gameLoop.fps).toBeGreaterThan(0);
    });
  });

  describe('Getters', () => {
    test('getDeltaTime should return fixed timestep', () => {
      expect(gameLoop.getDeltaTime()).toBe(1 / 60);
    });

    test('getVariableDeltaTime should return actual delta time', () => {
      gameLoop.deltaTime = 0.025;
      expect(gameLoop.getVariableDeltaTime()).toBe(0.025);
    });

    test('getTickRate should return tick rate', () => {
      expect(gameLoop.getTickRate()).toBe(1 / 60);
    });

    test('getFPS should return current FPS', () => {
      gameLoop.fps = 60;
      expect(gameLoop.getFPS()).toBe(60);
    });

    test('getFrameCount should return current frame count', () => {
      gameLoop.frameCount = 100;
      expect(gameLoop.getFrameCount()).toBe(100);
    });
  });

  describe('setTickRate', () => {
    test('should update tick rate and max accumulator', () => {
      gameLoop.setTickRate(1 / 30); // 30 FPS

      expect(gameLoop.tickRate).toBe(1 / 30);
      expect(gameLoop.maxAccumulator).toBe((1 / 30) * 5);
    });
  });

  describe('resetFrameTiming', () => {
    test('should reset frame timing and accumulator', () => {
      performance.now.mockReturnValue(500);
      gameLoop.accumulator = 0.05;

      gameLoop.resetFrameTiming();

      expect(gameLoop.lastFrameTime).toBe(500);
      expect(gameLoop.accumulator).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero delta time', () => {
      performance.now.mockReturnValueOnce(0).mockReturnValueOnce(0);

      gameLoop.lastFrameTime = 0;
      gameLoop.isRunning = true; // Must be running for loop to execute
      gameLoop.loop(0);

      expect(updateCallback).not.toHaveBeenCalled();
      expect(renderCallback).toHaveBeenCalledTimes(1);
    });

    test('should handle missing callbacks gracefully', () => {
      gameLoop.updateCallback = null;
      gameLoop.renderCallback = null;

      performance.now.mockReturnValueOnce(0).mockReturnValueOnce(16.67);
      gameLoop.lastFrameTime = 0;

      expect(() => gameLoop.loop(16.67)).not.toThrow();
    });

    test('should not run loop when stopped', () => {
      gameLoop.isRunning = false;

      gameLoop.loop(16.67);

      expect(updateCallback).not.toHaveBeenCalled();
      expect(renderCallback).not.toHaveBeenCalled();
      expect(requestAnimationFrame).not.toHaveBeenCalled();
    });
  });

  describe('Integration Test', () => {
    test('should maintain consistent timing over multiple frames', () => {
      let totalUpdateTime = 0;
      const trackingUpdateCallback = jest.fn((deltaTime) => {
        totalUpdateTime += deltaTime;
      });

      gameLoop.setCallbacks(trackingUpdateCallback, renderCallback);

      // Simulate 10 frames at 60 FPS (about 167ms total)
      const frames = [
        0, 16.67, 33.33, 50, 66.67, 83.33, 100, 116.67, 133.33, 150, 166.67,
      ];

      performance.now.mockReturnValue(0);
      gameLoop.lastFrameTime = 0;
      gameLoop.isRunning = true; // Must be running for loop to execute

      for (let i = 1; i < frames.length; i++) {
        performance.now
          .mockReturnValueOnce(frames[i - 1])
          .mockReturnValueOnce(frames[i]);
        gameLoop.loop(frames[i]);
      }

      // Total update time should be close to 10 * (1/60) = 0.1667 seconds
      expect(totalUpdateTime).toBeCloseTo(10 * (1 / 60), 3);
      expect(trackingUpdateCallback).toHaveBeenCalledTimes(10);
    });
  });
});
