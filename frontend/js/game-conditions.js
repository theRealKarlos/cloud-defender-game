/**
 * Game Conditions - Victory and Defeat Logic
 * Handles win/lose condition checking and game state transitions
 */

class GameConditions {
    constructor(entityManager, waveManager, uiManager) {
        this.entityManager = entityManager;
        this.waveManager = waveManager;
        this.uiManager = uiManager;
        
        // Game state
        this.gameWon = false;
        this.gameOver = false;
        this.gameActive = false;
        
        // Victory conditions
        this.victoryConditions = {
            allWavesCompleted: false,
            allTargetsSurvived: false
        };
        
        // Defeat conditions
        this.defeatConditions = {
            allTargetsDestroyed: false,
            livesExhausted: false
        };
        
        // Lives system
        this.maxLives = 3;
        this.currentLives = this.maxLives;
        
        // Score tracking
        this.currentScore = 0;
        this.scoreMultiplier = 1.0;
        
        // Callbacks
        this.onVictoryCallback = null;
        this.onDefeatCallback = null;
        this.onLivesChangedCallback = null;
        this.onScoreChangedCallback = null;
        
        console.log('GameConditions initialised');
    }
    
    startGame() {
        this.gameActive = true;
        this.gameWon = false;
        this.gameOver = false;
        this.currentLives = this.maxLives;
        this.currentScore = 0;
        this.scoreMultiplier = 1.0;
        
        // Reset conditions
        this.victoryConditions.allWavesCompleted = false;
        this.victoryConditions.allTargetsSurvived = false;
        this.defeatConditions.allTargetsDestroyed = false;
        this.defeatConditions.livesExhausted = false;
        
        console.log('Game conditions reset for new game');
    }
    
    update(deltaTime) {
        if (!this.gameActive || this.gameWon || this.gameOver) {
            return;
        }
        
        // Check victory conditions
        this.checkVictoryConditions();
        
        // Check defeat conditions
        this.checkDefeatConditions();
        
        // Update score based on active gameplay
        this.updateScore(deltaTime);
    }
    
    checkVictoryConditions() {
        // Victory condition 1: All waves completed
        if (this.waveManager.areAllWavesCompleted()) {
            this.victoryConditions.allWavesCompleted = true;
            
            // Check if any targets survived
            const targets = this.entityManager.getEntitiesByLayer('targets');
            const aliveTargets = targets.filter(target => !target.isDestroyed);
            
            if (aliveTargets.length > 0) {
                this.victoryConditions.allTargetsSurvived = true;
                this.triggerVictory('perfect');
            } else {
                // Victory even if all targets destroyed, but with lower score
                this.triggerVictory('pyrrhic');
            }
        }
    }
    
    checkDefeatConditions() {
        // Defeat condition 1: All targets destroyed
        const targets = this.entityManager.getEntitiesByLayer('targets');
        const aliveTargets = targets.filter(target => !target.isDestroyed);
        
        if (targets.length > 0 && aliveTargets.length === 0) {
            this.defeatConditions.allTargetsDestroyed = true;
            this.triggerDefeat('targets_destroyed');
            return;
        }
        
        // Defeat condition 2: Lives exhausted
        if (this.currentLives <= 0) {
            this.defeatConditions.livesExhausted = true;
            this.triggerDefeat('lives_exhausted');
            return;
        }
    }
    
    triggerVictory(victoryType) {
        if (this.gameWon || this.gameOver) return;
        
        this.gameWon = true;
        this.gameActive = false;
        
        // Calculate final score bonus
        let scoreBonus = 0;
        let victoryMessage = '';
        
        switch (victoryType) {
        case 'perfect':
            scoreBonus = this.currentScore * 0.5; // 50% bonus for perfect victory
            victoryMessage = 'Perfect Victory! All infrastructure defended successfully!';
            break;
        case 'pyrrhic':
            scoreBonus = this.currentScore * 0.1; // 10% bonus for pyrrhic victory
            victoryMessage = 'Victory achieved, but at great cost. Infrastructure was compromised.';
            break;
        }
        
        this.currentScore += Math.floor(scoreBonus);
        
        // Display victory screen
        this.showVictoryScreen(victoryMessage, this.currentScore);
        
        // Trigger callback
        if (this.onVictoryCallback) {
            this.onVictoryCallback(victoryType, this.currentScore);
        }
        
        console.log(`Victory achieved: ${victoryType}, Final Score: ${this.currentScore}`);
    }
    
    triggerDefeat(defeatReason) {
        if (this.gameWon || this.gameOver) return;
        
        this.gameOver = true;
        this.gameActive = false;
        
        let defeatMessage = '';
        
        switch (defeatReason) {
        case 'targets_destroyed':
            defeatMessage = 'Game Over! All AWS infrastructure has been compromised.';
            break;
        case 'lives_exhausted':
            defeatMessage = 'Game Over! No more chances remaining.';
            break;
        }
        
        // Display game over screen
        this.showGameOverScreen(defeatMessage, this.currentScore);
        
        // Trigger callback
        if (this.onDefeatCallback) {
            this.onDefeatCallback(defeatReason, this.currentScore);
        }
        
        console.log(`Defeat: ${defeatReason}, Final Score: ${this.currentScore}`);
    }
    
    showVictoryScreen(message, finalScore) {
        if (this.uiManager) {
            const fullMessage = `
                <div class="victory-content">
                    <p>${message}</p>
                    <div class="score-breakdown">
                        <p><strong>Final Score: ${finalScore}</strong></p>
                        <p>Waves Completed: ${this.waveManager.getCurrentWave() - 1}/${this.waveManager.getMaxWaves()}</p>
                        <p>Lives Remaining: ${this.currentLives}</p>
                    </div>
                </div>
            `;
            
            this.uiManager.showModal('Victory!', fullMessage, finalScore);
        }
    }
    
    showGameOverScreen(message, finalScore) {
        if (this.uiManager) {
            const fullMessage = `
                <div class="game-over-content">
                    <p>${message}</p>
                    <div class="score-breakdown">
                        <p><strong>Final Score: ${finalScore}</strong></p>
                        <p>Waves Survived: ${this.waveManager.getCurrentWave() - 1}/${this.waveManager.getMaxWaves()}</p>
                        <p>Lives Used: ${this.maxLives - this.currentLives}</p>
                    </div>
                </div>
            `;
            
            // Create game stats object for score submission
            const gameStats = {
                score: finalScore,
                wave: this.waveManager.getCurrentWave(),
                lives: this.currentLives,
                validationData: null // Will be set by game security if needed
            };
            
            this.uiManager.showModal('Game Over', fullMessage, finalScore, gameStats);
        }
    }
    
    updateScore(deltaTime) {
        // Base score increment for surviving
        const baseScorePerSecond = 10;
        this.currentScore += Math.floor(baseScorePerSecond * deltaTime * this.scoreMultiplier);
        
        // Trigger score changed callback
        if (this.onScoreChangedCallback) {
            this.onScoreChangedCallback(this.currentScore);
        }
    }
    
    // Event handlers for game events
    onMissileIntercepted(missile) {
        if (!this.gameActive) return;
        
        // Award points for intercepting missiles
        const basePoints = {
            'cost-spike': 100,
            'data-breach': 150,
            'latency-ghost': 75,
            'policy-violator': 125
        };
        
        const points = (basePoints[missile.type] || 100) * this.scoreMultiplier;
        this.currentScore += Math.floor(points);
        
        console.log(`Missile intercepted: +${Math.floor(points)} points`);
        
        // Trigger score changed callback
        if (this.onScoreChangedCallback) {
            this.onScoreChangedCallback(this.currentScore);
        }
    }
    
    onTargetDestroyed(target, _missile) {
        if (!this.gameActive) return;
        
        // Lose a life when a target is destroyed
        this.currentLives = Math.max(0, this.currentLives - 1);
        
        console.log(`Target ${target.type} destroyed! Lives remaining: ${this.currentLives}`);
        
        // Trigger lives changed callback
        if (this.onLivesChangedCallback) {
            this.onLivesChangedCallback(this.currentLives);
        }
        
        // Check if this triggers defeat
        this.checkDefeatConditions();
    }
    
    onWaveCompleted(waveNumber) {
        if (!this.gameActive) return;
        
        // Award bonus points for completing waves
        const waveBonus = waveNumber * 500 * this.scoreMultiplier;
        this.currentScore += Math.floor(waveBonus);
        
        // Increase score multiplier slightly
        this.scoreMultiplier += 0.1;
        
        console.log(`Wave ${waveNumber} completed: +${Math.floor(waveBonus)} points`);
        
        // Trigger score changed callback
        if (this.onScoreChangedCallback) {
            this.onScoreChangedCallback(this.currentScore);
        }
    }
    
    onPowerUpCollected(_powerUpType) {
        if (!this.gameActive) return;
        
        // Award points for collecting power-ups
        const powerUpPoints = 200 * this.scoreMultiplier;
        this.currentScore += Math.floor(powerUpPoints);
        
        console.log(`Power-up collected: +${Math.floor(powerUpPoints)} points`);
        
        // Trigger score changed callback
        if (this.onScoreChangedCallback) {
            this.onScoreChangedCallback(this.currentScore);
        }
    }
    
    onTargetHit(_target, _missile) {
        if (!this.gameActive) return;
        
        // Lose a life when a target is hit by a missile
        this.currentLives = Math.max(0, this.currentLives - 1);
        
        // Trigger callback
        if (this.onLivesChangedCallback) {
            this.onLivesChangedCallback(this.currentLives);
        }
        
        // Check if game should end due to no lives remaining
        if (this.currentLives <= 0) {
            this.defeatConditions.livesExhausted = true;
            this.triggerDefeat('lives_exhausted');
        }
    }
    
    // Getters for game state
    isGameWon() {
        return this.gameWon;
    }
    
    isGameOver() {
        return this.gameOver;
    }
    
    isGameActive() {
        return this.gameActive;
    }
    
    getCurrentScore() {
        return this.currentScore;
    }
    
    getCurrentLives() {
        return this.currentLives;
    }
    
    getMaxLives() {
        return this.maxLives;
    }
    
    getScoreMultiplier() {
        return this.scoreMultiplier;
    }
    
    getVictoryConditions() {
        return { ...this.victoryConditions };
    }
    
    getDefeatConditions() {
        return { ...this.defeatConditions };
    }
    
    // Callback registration
    setOnVictoryCallback(callback) {
        this.onVictoryCallback = callback;
    }
    
    setOnDefeatCallback(callback) {
        this.onDefeatCallback = callback;
    }
    
    setOnLivesChangedCallback(callback) {
        this.onLivesChangedCallback = callback;
    }
    
    setOnScoreChangedCallback(callback) {
        this.onScoreChangedCallback = callback;
    }
    
    // Manual control methods (for testing)
    setLives(lives) {
        this.currentLives = Math.max(0, Math.min(lives, this.maxLives));
        
        if (this.onLivesChangedCallback) {
            this.onLivesChangedCallback(this.currentLives);
        }
    }
    
    setScore(score) {
        this.currentScore = Math.max(0, score);
        
        if (this.onScoreChangedCallback) {
            this.onScoreChangedCallback(this.currentScore);
        }
    }
    
    addScore(points) {
        this.currentScore += Math.max(0, points);
        
        if (this.onScoreChangedCallback) {
            this.onScoreChangedCallback(this.currentScore);
        }
    }
    
    reset() {
        this.gameWon = false;
        this.gameOver = false;
        this.gameActive = false;
        this.currentLives = this.maxLives;
        this.currentScore = 0;
        this.scoreMultiplier = 1.0;
        
        // Reset conditions
        this.victoryConditions.allWavesCompleted = false;
        this.victoryConditions.allTargetsSurvived = false;
        this.defeatConditions.allTargetsDestroyed = false;
        this.defeatConditions.livesExhausted = false;
        
        console.log('GameConditions reset');
    }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameConditions };
} else {
    // Browser global
    window.GameConditions = GameConditions;
}