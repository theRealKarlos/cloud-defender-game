/**
 * Cloud Defenders - Game Engine Implementation
 * Enhanced HTML5 Canvas game engine with proper game loop and state management
 */

// Import entity system
// Note: In browser, entities.js should be loaded before this file

// Game State Enumeration
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LOADING: 'loading'
};

// Input State Management
class InputManager {
    constructor() {
        this.keys = new Map();
        this.mouse = {
            x: 0,
            y: 0,
            isPressed: false,
            justPressed: false,
            justReleased: false
        };
        this.previousMouseState = false;
    }
    
    update() {
        // Update mouse state for frame-based detection
        this.mouse.justPressed = this.mouse.isPressed && !this.previousMouseState;
        this.mouse.justReleased = !this.mouse.isPressed && this.previousMouseState;
        this.previousMouseState = this.mouse.isPressed;
    }
    
    isKeyPressed(key) {
        return this.keys.get(key) || false;
    }
    
    setKeyState(key, pressed) {
        this.keys.set(key, pressed);
    }
    
    updateMousePosition(x, y) {
        this.mouse.x = x;
        this.mouse.y = y;
    }
    
    setMousePressed(pressed) {
        this.mouse.isPressed = pressed;
    }
}

class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Unable to get 2D rendering context');
        }
        
        // Game state management
        this.gameState = GameState.MENU;
        this.previousGameState = GameState.MENU;
        
        // Frame timing
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        // Input management
        this.inputManager = new InputManager();
        
        // Entity management
        this.entityManager = new EntityManager();
        
        // Game loop control
        this.isRunning = false;
        this.animationFrameId = null;
        
        // Game stats
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        
        // UI elements
        this.scoreElement = document.getElementById('score');
        this.waveElement = document.getElementById('wave');
        this.livesElement = document.getElementById('lives');
        this.modal = document.getElementById('game-modal');
        
        this.initialiseEventListeners();
        this.initialiseCanvasSettings();
        this.updateUI();
        
        console.log('Cloud Defenders Game Engine initialised');
        console.log(`Canvas size: ${this.canvas.width}x${this.canvas.height}`);
    }
    
    initialiseCanvasSettings() {
        // Set canvas to handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        // Set CSS size to maintain layout
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Optimise canvas rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    initialiseEventListeners() {
        // Game control buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        
        // Modal buttons
        document.getElementById('modal-close').addEventListener('click', () => this.hideModal());
        document.getElementById('modal-restart').addEventListener('click', () => {
            this.hideModal();
            this.restartGame();
        });
        
        // Canvas mouse events
        this.canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
        this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        this.canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        this.canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
        
        // Keyboard events
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
        
        // Window events
        window.addEventListener('blur', () => this.handleWindowBlur());
        window.addEventListener('focus', () => this.handleWindowFocus());
        window.addEventListener('resize', () => this.handleWindowResize());
    }
    
    startGame() {
        if (this.gameState === GameState.MENU || this.gameState === GameState.PAUSED) {
            this.changeGameState(GameState.PLAYING);
            document.getElementById('start-btn').disabled = true;
            document.getElementById('pause-btn').disabled = false;
            
            if (!this.isRunning) {
                this.startGameLoop();
            }
            
            console.log('Game started');
        }
    }
    
    pauseGame() {
        if (this.gameState === GameState.PLAYING) {
            this.changeGameState(GameState.PAUSED);
            document.getElementById('start-btn').disabled = false;
            document.getElementById('pause-btn').disabled = true;
            console.log('Game paused');
        }
    }
    
    restartGame() {
        this.stopGameLoop();
        this.changeGameState(GameState.MENU);
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        
        // Clear all entities
        this.entityManager.clear();
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        
        this.updateUI();
        this.clearCanvas();
        this.drawWelcomeScreen();
        
        console.log('Game restarted');
    }
    
    changeGameState(newState) {
        if (this.gameState !== newState) {
            this.previousGameState = this.gameState;
            this.gameState = newState;
            this.onGameStateChange(this.previousGameState, newState);
        }
    }
    
    onGameStateChange(oldState, newState) {
        console.log(`Game state changed: ${oldState} -> ${newState}`);
        
        // Handle state-specific logic
        switch (newState) {
            case GameState.PLAYING:
                // Reset frame timing when starting/resuming
                this.lastFrameTime = performance.now();
                break;
            case GameState.PAUSED:
                // Could save game state here
                break;
            case GameState.GAME_OVER:
                this.stopGameLoop();
                break;
        }
    }
    
    startGameLoop() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            this.lastFpsUpdate = this.lastFrameTime;
            this.frameCount = 0;
            this.gameLoop(this.lastFrameTime);
        }
    }
    
    stopGameLoop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    gameLoop(timestamp) {
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
        
        // Update input state
        this.inputManager.update();
        
        // Update game logic based on current state
        this.update(this.deltaTime);
        
        // Render the current frame
        this.render();
        
        // Schedule next frame
        this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    update(deltaTime) {
        // Update based on current game state
        switch (this.gameState) {
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
        if (this.frameCount % 60 === 0) { // Every second at 60 FPS
            this.score += 10;
            this.updateUI();
        }
        
        // Add some test entities for demonstration (only once)
        if (this.frameCount === 120) { // After 2 seconds
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
    
    updateMenu(deltaTime) {
        // Placeholder for menu animations or updates
    }
    
    updateGameOver(deltaTime) {
        // Placeholder for game over screen updates
    }
    
    render() {
        this.clearCanvas();
        
        // Render based on current game state
        switch (this.gameState) {
            case GameState.MENU:
                this.renderMenu();
                break;
            case GameState.PLAYING:
            case GameState.PAUSED:
                this.renderGameplay();
                break;
            case GameState.GAME_OVER:
                this.renderGameOver();
                break;
            case GameState.LOADING:
                this.renderLoading();
                break;
        }
        
        // Always render debug info in development
        this.renderDebugInfo();
    }
    
    renderMenu() {
        this.drawBackground();
        
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Cloud Defenders', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Defend your AWS infrastructure!', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('Click Start Game to begin', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
    
    renderGameplay() {
        this.drawBackground();
        
        // Render all entities
        this.entityManager.render(this.ctx);
        
        // Show game info
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Entities: ${this.entityManager.getEntityCount()}`, 10, this.canvas.height - 60);
        this.ctx.fillText(`Wave ${this.wave} - Score: ${this.score}`, 10, this.canvas.height - 40);
        
        // Show pause indicator if paused
        if (this.gameState === GameState.PAUSED) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    renderGameOver() {
        this.drawBackground();
        
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
    
    renderLoading() {
        this.drawBackground();
        
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    renderDebugInfo() {
        // Show FPS and debug info in top-left corner
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(5, 5, 120, 60);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
        this.ctx.fillText(`State: ${this.gameState}`, 10, 35);
        this.ctx.fillText(`Mouse: ${Math.round(this.inputManager.mouse.x)},${Math.round(this.inputManager.mouse.y)}`, 10, 50);
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawBackground() {
        // Draw a simple gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(1, '#003366');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawWelcomeScreen() {
        this.renderMenu();
    }
    
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        console.log(`Canvas clicked at: (${x}, ${y})`);
        
        // Placeholder for future defence deployment logic
        if (this.gameState === GameState.PLAYING) {
            // Future: Deploy defence at clicked position
        }
    }
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.inputManager.updateMousePosition(x, y);
    }
    
    handleMouseDown(event) {
        this.inputManager.setMousePressed(true);
        event.preventDefault();
    }
    
    handleMouseUp(event) {
        this.inputManager.setMousePressed(false);
        event.preventDefault();
    }
    
    handleKeyDown(event) {
        this.inputManager.setKeyState(event.code, true);
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                if (this.gameState === GameState.PLAYING) {
                    this.pauseGame();
                } else if (this.gameState === GameState.PAUSED) {
                    this.startGame();
                }
                break;
            case 'KeyR':
                event.preventDefault();
                this.restartGame();
                break;
            case 'Escape':
                event.preventDefault();
                if (this.gameState === GameState.PLAYING) {
                    this.pauseGame();
                }
                break;
        }
    }
    
    handleKeyUp(event) {
        this.inputManager.setKeyState(event.code, false);
    }
    
    handleWindowBlur() {
        // Auto-pause when window loses focus
        if (this.gameState === GameState.PLAYING) {
            this.pauseGame();
        }
    }
    
    handleWindowFocus() {
        // Reset frame timing when window regains focus
        this.lastFrameTime = performance.now();
    }
    
    handleWindowResize() {
        // Reinitialise canvas settings on window resize
        this.initialiseCanvasSettings();
    }
    
    updateUI() {
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.waveElement.textContent = `Wave: ${this.wave}`;
        this.livesElement.textContent = `Lives: ${this.lives}`;
    }
    
    showModal(title, message) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').innerHTML = message;
        document.getElementById('final-score').textContent = this.score;
        this.modal.classList.remove('hidden');
    }
    
    hideModal() {
        this.modal.classList.add('hidden');
    }
    
    gameOver() {
        this.changeGameState(GameState.GAME_OVER);
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = true;
        
        this.showModal('Game Over', `Your final score: <span id="final-score">${this.score}</span>`);
        console.log('Game Over - Final Score:', this.score);
    }
}

// Initialise the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check for Canvas support
        const canvas = document.getElementById('game-canvas');
        if (!canvas || !canvas.getContext) {
            alert('Your browser does not support HTML5 Canvas. Please upgrade to a modern browser.');
            return;
        }
        
        // Initialise the game engine
        window.gameEngine = new GameEngine('game-canvas');
        
        // Start the render loop (but not the game logic)
        window.gameEngine.startGameLoop();
        
        console.log('Cloud Defenders initialised successfully');
    } catch (error) {
        console.error('Failed to initialise Cloud Defenders:', error);
        alert('Failed to initialise the game. Please refresh the page and try again.');
    }
});