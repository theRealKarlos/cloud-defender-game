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
            
            // Add targets FIRST before starting wave systems
            this.addInitialTargets();
            
            // Start game systems AFTER targets are added
            this.gameConditions.startGame();
            this.waveManager.startWave();
            
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
        
        // Check for explosion collisions (bombs destroying missiles)
        this.checkExplosionCollisions();
        
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
                
                // Check if target was destroyed after collision processing
                if (target.justDestroyed) {
                    this.gameConditions.onTargetDestroyed(target, missile);
                    target.justDestroyed = false; // Reset flag
                }
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
    handleCanvasClick(x, y) {
        // Deploy explosive bomb at clicked position (Missile Command style)
        if (this.stateManager.isState(GameState.PLAYING)) {
            this.deployExplosiveBomb(x, y);
        }
    }
    
    deployExplosiveBomb(targetX, targetY) {
        // Check countermeasure limit (max 4 on screen at once)
        const activeBombs = this.entityManager.getEntitiesByLayer('countermeasures');
        const maxCountermeasures = 4;
        
        if (activeBombs && activeBombs.length >= maxCountermeasures) {
            console.log(`Cannot deploy bomb: ${activeBombs.length}/${maxCountermeasures} countermeasures already active`);
            return; // Don't deploy if at limit
        }
        
        // Deploy bomb from bottom center of screen (like Missile Command)
        const startX = this.canvas.width / 2;
        const startY = this.canvas.height - 20;
        
        // Create explosive bomb
        const bomb = new ExplosiveBomb(startX, startY, targetX, targetY);
        
        // Apply countermeasure speed scaling: 1% slower per wave
        const currentWave = this.waveManager.getCurrentWave();
        const countermeasureSpeedMultiplier = 1.0 - (currentWave - 1) * 0.01;
        const originalSpeed = bomb.speed;
        bomb.speed *= countermeasureSpeedMultiplier;
        
        console.log(`Wave ${currentWave}: Countermeasure speed ${originalSpeed} → ${bomb.speed.toFixed(1)} (${(countermeasureSpeedMultiplier * 100).toFixed(1)}%)`);
        
        // Add to entity manager
        this.entityManager.addEntity(bomb, 'countermeasures');
        
        const currentBombCount = (activeBombs ? activeBombs.length : 0) + 1;
        console.log(`Deployed bomb from (${startX}, ${startY}) to (${targetX}, ${targetY}) [${currentBombCount}/${maxCountermeasures}]`);
    }
    
    checkExplosionCollisions() {
        // Get all active bombs
        const bombs = this.entityManager.getEntitiesByLayer('countermeasures');
        
        bombs.forEach(bomb => {
            if (bomb.isExploding && bomb.explosionRadius > 0) {
                // Check for missiles in explosion radius
                const destroyedMissiles = bomb.getMissilesInExplosionRadius(this.entityManager);
                
                // Destroy missiles and award points (only destroy each missile once)
                destroyedMissiles.forEach(missile => {
                    if (!missile.markedForDestruction) {
                        this.onMissileDestroyed(missile, bomb);
                        missile.destroy();
                    }
                });
            }
        });
    }
    
    onMissileDestroyed(missile, bomb) {
        // Award points for destroying missile
        const basePoints = 100;
        const typeMultiplier = this.getMissileTypeMultiplier(missile.type);
        const points = Math.floor(basePoints * typeMultiplier);
        
        // Add points through game conditions
        if (this.gameConditions && this.gameConditions.addScore) {
            this.gameConditions.addScore(points);
        }
        
        console.log(`Missile ${missile.type} destroyed! +${points} points`);
    }
    
    getMissileTypeMultiplier(missileType) {
        // Different missile types worth different points
        const multipliers = {
            'cost-spike': 1.2,      // Slightly more valuable
            'data-breach': 1.5,     // High value security threat
            'latency-ghost': 1.8,   // Hard to hit, high value
            'policy-violator': 1.0  // Standard value
        };
        return multipliers[missileType] || 1.0;
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