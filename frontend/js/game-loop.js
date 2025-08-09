/**
 * Game Loop Management
 * Handles frame timing, FPS calculation, and game loop control
 * Uses fixed timestep for consistent gameplay across all frame rates
 */

class GameLoop {
  constructor() {
    // Frame timing
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;

    // Fixed timestep variables
    this.tickRate = 1 / 60; // 60 FPS fixed timestep (16.67ms per tick)
    this.accumulator = 0;
    this.maxAccumulator = this.tickRate * 5; // Prevent spiral of death

    // Game loop control
    this.isRunning = false;
    this.animationFrameId = null;

    // Callbacks
    this.updateCallback = null;
    this.renderCallback = null;
  }

  setCallbacks(updateCallback, renderCallback) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      this.lastFpsUpdate = this.lastFrameTime;
      this.frameCount = 0;
      this.accumulator = 0; // Reset accumulator on start
      this.loop(this.lastFrameTime);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  loop(timestamp) {
    if (!this.isRunning) {
      return;
    }

    // Calculate delta time in seconds
    this.deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    // Cap delta time to prevent large jumps (e.g., when tab becomes inactive)
    // This prevents the "spiral of death" where the game tries to catch up
    this.deltaTime = Math.min(this.deltaTime, this.maxAccumulator);

    // Add real time to accumulator
    this.accumulator += this.deltaTime;

    // Run fixed timestep updates
    // This ensures consistent game logic regardless of frame rate
    while (this.accumulator >= this.tickRate) {
      if (this.updateCallback) {
        // Always pass the fixed timestep, not the variable deltaTime
        this.updateCallback(this.tickRate);
      }
      this.accumulator -= this.tickRate;
    }

    // Render once per frame (independent of update frequency)
    if (this.renderCallback) {
      this.renderCallback();
    }

    // Calculate FPS based on actual rendering frames
    this.frameCount++;
    if (timestamp - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round(
        (this.frameCount * 1000) / (timestamp - this.lastFpsUpdate)
      );
      this.frameCount = 0;
      this.lastFpsUpdate = timestamp;
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts));
  }

  getFPS() {
    return this.fps;
  }

  getFrameCount() {
    return this.frameCount;
  }

  getDeltaTime() {
    // Return the fixed timestep for consistency
    return this.tickRate;
  }

  getVariableDeltaTime() {
    // Return the actual variable delta time if needed for rendering interpolation
    return this.deltaTime;
  }

  getTickRate() {
    return this.tickRate;
  }

  setTickRate(tickRate) {
    this.tickRate = tickRate;
    this.maxAccumulator = tickRate * 5;
  }

  resetFrameTiming() {
    this.lastFrameTime = performance.now();
    this.accumulator = 0; // Also reset accumulator
  }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameLoop };
} else {
  window.GameLoop = GameLoop;
}
