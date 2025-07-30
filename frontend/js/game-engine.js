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
        
        // Initialize wave management and game conditions
        this.waveManager = new WaveManager(this.entityManager, this.canvas.width, this.canvas.height);
        this.gameConditions = new GameConditions(this.entityManager, this.waveManager, this.uiManager);
        
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
        this.setupWaveCallbacks();
        this.setupGameConditionCallbacks();
        
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
    
    setupWaveCallbacks() {
        this.waveManager.setOnWaveStartCallback((waveNumber, config) => {
            console.log(`Wave ${waveNumber} started with ${config.missileCount} missiles`);
            this.gameStats.wave = waveNumber;
            this.uiManager.updateGameStats(this.gameStats.score, this.gameStats.wave, this.gameStats.lives);
        });
        
        this.waveManager.setOnWaveCompleteCallback((waveNumber) => {
            console.log(`Wave ${waveNumber} completed!`);
            this.gameConditions.onWaveCompleted(waveNumber);
        });
        
        this.waveManager.setOnAllWavesCompleteCallback(() => {
            console.log('All waves completed!');
            // Victory will be handled by GameConditions
        });
    }
    
    setupGameConditionCallbacks() {
        this.gameConditions.setOnVictoryCallback((victoryType, finalScore) => {
            this.stateManager.changeState(GameState.GAME_OVER);
            this.gameStats.score = finalScore;
            console.log(`Victory achieved: ${victoryType}`);
        });
        
        this.gameConditions.setOnDefeatCallback((defeatReason, finalScore) => {
            this.stateManager.changeState(GameState.GAME_OVER);
            this.gameStats.score = finalScore;
            console.log(`Defeat: ${defeatReason}`);
        });
        
        this.gameConditions.setOnScoreChangedCallback((newScore) => {
            this.gameStats.score = newScore;
            this.uiManager.updateGameStats(this.gameStats.score, this.gameStats.wave, this.gameStats.lives);
        });
        
        this.gameConditions.setOnLivesChangedCallback((newLives) => {
            this.gameStats.lives = newLives;
            this.uiManager.updateGameStats(this.gameStats.score, this.gameStats.wave, this.gameStats.lives);
        });
    }
    
    // Game Control Methods
    startGame() {
        if (this.stateManager.isState(GameState.MENU) || this.stateManager.isState(GameState.PAUSED)) {
            this.stateManager.changeState(GameState.PLAYING);
            this.uiManager.setButtonStates(true, false);
            
            // Start game systems
            this.gameConditions.startGame();
            this.waveManager.startWave();
            
            // Add some initial targets for the game
            this.addInitialTargets();
            
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
        
        // Reset game systems
        this.waveManager.reset();
        this.gameConditions.reset();
        
        // Reset game statistics
        this.gameStats.score = 0;
        this.gameStats.wave = 1;
        this.gameStats.lives = 3;
        
        // Clear all entities
        this.entityManager.clear();
        
        // Update UI
        this.uiManager.setButtonStates(false, false);
        this.uiManager.updateGameStats(this.gameStats.score, this.gameStats.wave, this.gameStats.lives);
        this.uiManager.hideModal();
        
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
        // Update wave management
        this.waveManager.update(deltaTime);
        
        // Update game conditions (victory/defeat checking)
        this.gameConditions.update(deltaTime);
        
        // Update all entities
        this.entityManager.update(deltaTime);
        
        // Check for collisions
        const collisions = this.entityManager.checkCollisions();
        
        // Process collisions
        this.processCollisions(collisions);
    }
    
    addInitialTargets() {
        // Add AWS service targets for the player to defend
        const targetPositions = [
            { type: 's3', x: 150, y: 400 },
            { type: 'lambda', x: 300, y: 350 },
            { type: 'rds', x: 450, y: 400 },
            { type: 'ec2', x: 600, y: 350 },
            { type: 'dynamodb', x: 375, y: 450 }
        ];
        
        targetPositions.forEach(pos => {
            const target = new Target(pos.type, pos.x, pos.y);
            this.entityManager.addEntity(target, 'targets');
        });
        
        console.log('Added initial AWS service targets');
    }
    
    processCollisions(collisions) {
        collisions.forEach(([entity1, entity2]) => {
            // Handle missile-target collisions
            if ((entity1.collisionLayer === 'missiles' && entity2.collisionLayer === 'targets') ||
                (entity1.collisionLayer === 'targets' && entity2.collisionLayer === 'missiles')) {
                
                const missile = entity1.collisionLayer === 'missiles' ? entity1 : entity2;
                const target = entity1.collisionLayer === 'targets' ? entity1 : entity2;
                
                // Notify game conditions about target hit
                this.gameConditions.onTargetHit(target, missile);
            }
            
            // Handle missile-defence collisions
            if ((entity1.collisionLayer === 'missiles' && entity2.collisionLayer === 'defences') ||
                (entity1.collisionLayer === 'defences' && entity2.collisionLayer === 'missiles')) {
                
                const missile = entity1.collisionLayer === 'missiles' ? entity1 : entity2;
                const defence = entity1.collisionLayer === 'defences' ? entity1 : entity2;
                
                // Notify game conditions about missile interception
                this.gameConditions.onMissileIntercepted(missile);
            }
        });
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