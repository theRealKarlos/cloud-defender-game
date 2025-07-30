/**
 * UI Management
 * Handles DOM UI elements and modal interactions
 */

class UIManager {
    constructor() {
    // UI elements
        this.scoreElement = document.getElementById('score');
        this.waveElement = document.getElementById('wave');
        this.livesElement = document.getElementById('lives');
        this.modal = document.getElementById('game-modal');

        // Button elements
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.restartBtn = document.getElementById('restart-btn');

        this.validateElements();
    }

    validateElements() {
        const requiredElements = [
            { element: this.scoreElement, name: 'score' },
            { element: this.waveElement, name: 'wave' },
            { element: this.livesElement, name: 'lives' },
            { element: this.modal, name: 'game-modal' },
            { element: this.startBtn, name: 'start-btn' },
            { element: this.pauseBtn, name: 'pause-btn' },
            { element: this.restartBtn, name: 'restart-btn' }
        ];

        for (const { element, name } of requiredElements) {
            if (!element) {
                console.warn(`UI element '${name}' not found`);
            }
        }
    }

    updateGameStats(score, wave, lives) {
        if (this.scoreElement) {
            this.scoreElement.textContent = `Score: ${score}`;
        }
        if (this.waveElement) {
            this.waveElement.textContent = `Wave: ${wave}`;
        }
        if (this.livesElement) {
            this.livesElement.textContent = `Lives: ${lives}`;
        }
    }

    setButtonStates(gameStarted, gamePaused) {
        if (this.startBtn) {
            this.startBtn.disabled = gameStarted && !gamePaused;
        }
        if (this.pauseBtn) {
            this.pauseBtn.disabled = !gameStarted || gamePaused;
        }
    }

    showModal(title, message, score) {
        if (!this.modal) return;

        const titleElement = document.getElementById('modal-title');
        const messageElement = document.getElementById('modal-message');
        const finalScoreElement = document.getElementById('final-score');

        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.innerHTML = message;
        if (finalScoreElement) finalScoreElement.textContent = score;

        this.modal.classList.remove('hidden');
    }

    hideModal() {
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
    }

    setupEventListeners(callbacks) {
    // Game control buttons
        if (this.startBtn) {
            this.startBtn.addEventListener('click', callbacks.onStart);
        }
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', callbacks.onPause);
        }
        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', callbacks.onRestart);
        }

        // Modal buttons
        const modalClose = document.getElementById('modal-close');
        const modalRestart = document.getElementById('modal-restart');

        if (modalClose) {
            modalClose.addEventListener('click', callbacks.onModalClose);
        }
        if (modalRestart) {
            modalRestart.addEventListener('click', callbacks.onModalRestart);
        }
    }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager };
} else {
    window.UIManager = UIManager;
}
