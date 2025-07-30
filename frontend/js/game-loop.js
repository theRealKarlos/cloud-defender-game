/**
 * Game Loop Management
 * Handles frame timing, FPS calculation, and game loop control
 */

class GameLoop {
    constructor() {
        // Frame timing
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
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
        this.deltaTime = Math.min(this.deltaTime, 1/30); // Max 30 FPS minimum
        
        // Calculate FPS
        this.frameCount++;
        if (timestamp - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (timestamp - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
        }
        
        // Execute callbacks
        if (this.updateCallback) {
            this.updateCallback(this.deltaTime);
        }
        
        if (this.renderCallback) {
            this.renderCallback();
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
        return this.deltaTime;
    }
    
    resetFrameTiming() {
        this.lastFrameTime = performance.now();
    }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameLoop };
} else {
    window.GameLoop = GameLoop;
}