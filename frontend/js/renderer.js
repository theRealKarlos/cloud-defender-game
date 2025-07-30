/**
 * Rendering System
 * Handles all canvas rendering operations
 */

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        if (!this.ctx) {
            throw new Error('Unable to get 2D rendering context');
        }
        
        this.initialiseCanvasSettings();
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
    
    clear() {
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
    
    renderGameplay(entityManager, gameStats) {
        this.drawBackground();
        
        // Render all entities
        entityManager.render(this.ctx);
        
        // Show game info
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Entities: ${entityManager.getEntityCount()}`, 10, this.canvas.height - 80);
        this.ctx.fillText(`Wave ${gameStats.wave} - Score: ${gameStats.score}`, 10, this.canvas.height - 60);
        
        // Show countermeasure availability
        const activeBombs = entityManager.getEntitiesByLayer('countermeasures');
        const bombCount = activeBombs ? activeBombs.length : 0;
        const maxBombs = 4;
        this.ctx.fillText(`Countermeasures: ${bombCount}/${maxBombs}`, 10, this.canvas.height - 40);
    }
    
    renderPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    renderGameOver(score) {
        this.drawBackground();
        
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
    
    renderLoading() {
        this.drawBackground();
        
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    renderDebugInfo(fps, gameState, mousePos) {
        // Show FPS and debug info in top-left corner
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(5, 5, 120, 60);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${fps}`, 10, 20);
        this.ctx.fillText(`State: ${gameState}`, 10, 35);
        this.ctx.fillText(`Mouse: ${Math.round(mousePos.x)},${Math.round(mousePos.y)}`, 10, 50);
    }
    
    handleResize() {
        this.initialiseCanvasSettings();
    }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Renderer };
} else {
    window.Renderer = Renderer;
}