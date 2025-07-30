/**
 * Cloud Defenders - Main Game Engine
 * Orchestrates all game systems and manages the overall game flow
 */

class GameEngine {
    constructor(canvasId) {
        // Get canvas element
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }
        
        // Initialize core systems
        this.stateManager = new GameStateManager();
        this.renderer = new Renderer(this.canvas);
        this.inputManager = new InputManager();
        this.uiManager = new UIManager();
        this.gameLoop = new GameLoop();
        this.entityManager = new EntityManager();
        
        // Game statistics
        this.gameStats = {
            score: 0,
            wave: 1,
            lives: 3
        };
        
        // Setup systems
        this.setupGameLoop();
        this.setupEventHandlers();
        this.setupUICallbacks();
        this.setupStateCallbacks();
        
        // Initialize UI
        this.uiManager.updateGameStats(this.gameStats.score, this.gameStats.wave, this.gameStats.lives);
        this.uiManager.setButtonStates(false, false);
        
        console.log('Cloud Defenders Game Engine initialised');
        console.log(`Canvas size: ${this.canvas.width}x${this.canvas.height}`);
    }
    
    setupGameLoop() {
        this.gameLoop.setCallbacks(
            (deltaTime) => this.update(deltaTime),
            () => this.render()
        );
    }
    
    setupEventHandlers() {
        const eventCallbacks = {
            onCanvasClick: (x, y) => this.handleCanvasClick(x, y),
            onSpaceKey: () => this.handleSpaceKey(),
            onRestartKey: () => this.restartGame(),
            onEscapeKey: () => this.handleEscapeKey(),
            onWindowBlur: () => this.handleWindowBlur(),
            onWindowFocus: () => this.handleWindowFocus(),
            onWindowResize: () => this.renderer.handleResize()
        };
        
        this.eventHandler = new EventHandler(this.canvas, this.inputManager, eventCallbacks);
    }
    
    setupUICallbacks() {
        const uiCallbacks = {
            onStart: () => this.startGame(),
            onPause: () => this.pauseGame(),
            onRestart: () => this.restartGame(),
            onModalClose: () => this.uiManager.hideModal(),
            onModalRestart: () => {
                this.uiManager.hideModal();
                this.restartGame();
            }
        };
        
        this.uiManager.setupEventListeners(uiCallbacks);
    }
    
    setupStateCallbacks() {
        this.stateManager.registerStateChangeCallback(GameState.PLAYING, () => {
            this.gameLoop.resetFrameTiming();
        });
        
        this.stateManager.registerStateChangeCallback(GameState.GAME_OVER, () => {
            this.gameLoop.stop();
        });
    }
    
    // Game Control Methods
    startGame() {
        if (this.stateManager.isState(GameState.MENU) || this.stateManager.isState(GameState.PAUSED)) {
            this.stateManager.changeState(GameState.PLAYING);
            this.uiManager.setButtonStates(true, false);
            
            if (!this.gameLoop.isRunning) {
                this.gameLoop.start();
            }
            
            console.log('Game started');
        }
    }
    
    pauseGame() {
        if (this.stateManager.isState(GameState.PLAYING)) {
            this.stateManager.changeState(GameState.PAUSED);
            this.uiManager.setButtonStates(true, true);
            console.log('Game paused');
        }
    }
    
    restartGame() {
        this.gameLoop.stop();
        this.stateManager.changeState(GameState.MENU);
        
        // Reset game statistics
        this.gameStats.score = 0;
        this.gameStats.wave = 1;
        this.gameStats.lives = 3;
        
        // Clear all entities
        this.entityManager.clear();
        
        // Update UI
        this.uiManager.setButtonStates(false, false);
        this.uiManager.updateGameStats(this.gameStats.score, this.gameStats.wave, this.gameStats.lives);
        
        // Render welcome screen
        this.renderer.clear();
        this.renderer.renderMenu();
        
        console.log('Game restarted');
    }
    
    gameOver() {
        this.stateManager.changeState(GameState.GAME_OVER);
        this.uiManager.setButtonStates(false, false);
        
        this.uiManager.showModal(
            'Game Over', 
            `Your final score: <span id="final-score">${this.gameStats.score}</span>`,
            this.gameStats.score
        );
        
        console.log('Game Over - Final Score:', this.gameStats.score);
    }
    
    // Game Loop Methods
    update(deltaTime) {
        // Update input state
        this.inputManager.update();
        
        // Update based on current game state
        switch (this.stateManager.getCurrentState()) {
        case GameState.PLAYING:
            this.updateGameplay(deltaTime);
            break;
        case GameState.PAUSED:
            // Game is paused, don't update gameplay logic
            break;
        case GameState.MENU:
            this.updateMenu(deltaTime);
            break;
        case GameState.GAME_OVER:
            this.updateGameOver(deltaTime);
            break;
        }
    }
    
    updateGameplay(deltaTime) {
        // Update all entities
        this.entityManager.update(deltaTime);
        
        // Check for collisions
        const collisions = this.entityManager.checkCollisions();
        
        // Process collisions (placeholder for future implementation)
        if (collisions.length > 0) {
            console.log(`Detected ${collisions.length} collision(s)`);
        }
        
        // Example: Simple score increment for demonstration
        if (this.gameLoop.getFrameCount() % 60 === 0) { // Every second at 60 FPS
            this.gameStats.score += 10;
            this.uiManager.updateGameStats(this.gameStats.score, this.gameStats.wave, this.gameStats.lives);
        }
        
        // Add some test entities for demonstration (only once)
        if (this.gameLoop.getFrameCount() === 120) { // After 2 seconds
            this.addTestEntities();
        }
    }
    
    addTestEntities() {
        // Create some test entities to demonstrate the system
        const testTarget = new Entity(100, 100, 64, 64);
        testTarget.colour = '#4a90e2';
        testTarget.velocityX = 50; // Move right slowly
        
        const testMissile = new Entity(50, 120, 32, 16);
        testMissile.colour = '#ff4444';
        testMissile.velocityX = 100; // Move right faster
        
        const testDefence = new Entity(200, 150, 48, 48);
        testDefence.colour = '#44ff44';
        testDefence.velocityY = -30; // Move up slowly
        
        this.entityManager.addEntity(testTarget, 'targets');
        this.entityManager.addEntity(testMissile, 'missiles');
        this.entityManager.addEntity(testDefence, 'defences');
        
        console.log('Added test entities for demonstration');
    }
    
    updateMenu(_deltaTime) {
        // Placeholder for menu animations or updates
    }
    
    updateGameOver(_deltaTime) {
        // Placeholder for game over screen updates
    }
    
    render() {
        this.renderer.clear();
        
        // Render based on current game state
        switch (this.stateManager.getCurrentState()) {
        case GameState.MENU:
            this.renderer.renderMenu();
            break;
        case GameState.PLAYING:
            this.renderer.renderGameplay(this.entityManager, this.gameStats);
            break;
        case GameState.PAUSED:
            this.renderer.renderGameplay(this.entityManager, this.gameStats);
            this.renderer.renderPauseOverlay();
            break;
        case GameState.GAME_OVER:
            this.renderer.renderGameOver(this.gameStats.score);
            break;
        case GameState.LOADING:
            this.renderer.renderLoading();
            break;
        }
        
        // Always render debug info in development
        this.renderer.renderDebugInfo(
            this.gameLoop.getFPS(),
            this.stateManager.getCurrentState(),
            this.inputManager.mouse
        );
    }
    
    // Event Handlers
    handleCanvasClick(_x, _y) {
        // Placeholder for future defence deployment logic
        if (this.stateManager.isState(GameState.PLAYING)) {
            // Future: Deploy defence at clicked position
        }
    }
    
    handleSpaceKey() {
        if (this.stateManager.isState(GameState.PLAYING)) {
            this.pauseGame();
        } else if (this.stateManager.isState(GameState.PAUSED)) {
            this.startGame();
        }
    }
    
    handleEscapeKey() {
        if (this.stateManager.isState(GameState.PLAYING)) {
            this.pauseGame();
        }
    }
    
    handleWindowBlur() {
        // Auto-pause when window loses focus
        if (this.stateManager.isState(GameState.PLAYING)) {
            this.pauseGame();
        }
    }
    
    handleWindowFocus() {
        // Reset frame timing when window regains focus
        this.gameLoop.resetFrameTiming();
    }
    
    // Cleanup
    destroy() {
        this.gameLoop.stop();
        if (this.eventHandler) {
            this.eventHandler.destroy();
        }
    }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine };
} else {
    window.GameEngine = GameEngine;
}