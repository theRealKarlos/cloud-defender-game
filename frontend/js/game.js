/**
 * Cloud Defenders - Game Engine Initialisation
 * Basic HTML5 Canvas setup and game container management
 */

class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.lastFrameTime = 0;
        
        // Game stats
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        
        // UI elements
        this.scoreElement = document.getElementById('score');
        this.waveElement = document.getElementById('wave');
        this.livesElement = document.getElementById('lives');
        this.modal = document.getElementById('game-modal');
        
        this.initializeEventListeners();
        this.updateUI();
        
        console.log('Cloud Defenders Game Engine initialized');
        console.log(`Canvas size: ${this.canvas.width}x${this.canvas.height}`);
    }
    
    initializeEventListeners() {
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
        
        // Canvas click events (for future defence deployment)
        this.canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
        
        // Keyboard events
        document.addEventListener('keydown', (event) => this.handleKeyPress(event));
    }
    
    startGame() {
        if (this.gameState === 'menu' || this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('start-btn').disabled = true;
            document.getElementById('pause-btn').disabled = false;
            
            if (!this.gameLoopRunning) {
                this.gameLoopRunning = true;
                this.gameLoop();
            }
            
            console.log('Game started');
        }
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('start-btn').disabled = false;
            document.getElementById('pause-btn').disabled = true;
            console.log('Game paused');
        }
    }
    
    restartGame() {
        this.gameState = 'menu';
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        this.gameLoopRunning = false;
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        
        this.updateUI();
        this.clearCanvas();
        this.drawWelcomeScreen();
        
        console.log('Game restarted');
    }
    
    gameLoop(timestamp = 0) {
        if (!this.gameLoopRunning || this.gameState !== 'playing') {
            return;
        }
        
        const deltaTime = timestamp - this.lastFrameTime;
        
        // Update game logic (placeholder for future implementation)
        this.update(deltaTime);
        
        // Render game (placeholder for future implementation)
        this.render();
        
        this.lastFrameTime = timestamp;
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    update(deltaTime) {
        // Placeholder for game logic updates
        // This will be implemented in future tasks
    }
    
    render() {
        this.clearCanvas();
        
        // Draw game background
        this.drawBackground();
        
        // Placeholder text for development
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Engine Running', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Wave ${this.wave} - Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
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
    
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        console.log(`Canvas clicked at: (${x}, ${y})`);
        
        // Placeholder for future defence deployment logic
        if (this.gameState === 'playing') {
            // Future: Deploy defence at clicked position
        }
    }
    
    handleKeyPress(event) {
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.startGame();
                }
                break;
            case 'KeyR':
                event.preventDefault();
                this.restartGame();
                break;
        }
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
        this.gameState = 'gameOver';
        this.gameLoopRunning = false;
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = true;
        
        this.showModal('Game Over', `Your final score: <span id="final-score">${this.score}</span>`);
        console.log('Game Over - Final Score:', this.score);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check for Canvas support
    const canvas = document.getElementById('game-canvas');
    if (!canvas.getContext) {
        alert('Your browser does not support HTML5 Canvas. Please upgrade to a modern browser.');
        return;
    }
    
    // Initialize the game engine
    window.gameEngine = new GameEngine('game-canvas');
    
    // Draw welcome screen
    window.gameEngine.drawWelcomeScreen();
    
    console.log('Cloud Defenders initialized successfully');
});