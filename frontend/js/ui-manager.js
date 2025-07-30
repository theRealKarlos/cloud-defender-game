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

    showModal(title, message, score, gameStats) {
        if (!this.modal) return;

        const titleElement = document.getElementById('modal-title');
        const messageElement = document.getElementById('modal-message');
        const finalScoreElement = document.getElementById('final-score');

        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.innerHTML = message;
        if (finalScoreElement) finalScoreElement.textContent = score;

        // Store game stats for score submission
        this.currentGameStats = gameStats;
        
        // Show score submission form if this is a game over
        if (title === 'Game Over' && score > 0) {
            this.showScoreSubmission();
        }

        this.modal.classList.remove('hidden');
    }

    showScoreSubmission() {
        const scoreSubmission = document.getElementById('score-submission');
        const leaderboardDisplay = document.getElementById('leaderboard-display');
        
        if (scoreSubmission) {
            scoreSubmission.classList.remove('hidden');
            
            // Reset form
            const form = document.getElementById('score-form');
            if (form) form.reset();
            
            // Clear any previous status
            const status = document.getElementById('submission-status');
            if (status) {
                status.classList.add('hidden');
                status.innerHTML = '';
            }
        }
        
        if (leaderboardDisplay) {
            leaderboardDisplay.classList.add('hidden');
        }
    }

    hideScoreSubmission() {
        const scoreSubmission = document.getElementById('score-submission');
        if (scoreSubmission) {
            scoreSubmission.classList.add('hidden');
        }
    }

    showLeaderboard(leaderboardData) {
        const leaderboardDisplay = document.getElementById('leaderboard-display');
        const leaderboardList = document.getElementById('leaderboard-list');
        
        if (!leaderboardDisplay || !leaderboardList) return;
        
        // Hide score submission form
        this.hideScoreSubmission();
        
        // Generate leaderboard HTML
        if (leaderboardData.leaderboard && leaderboardData.leaderboard.length > 0) {
            const html = leaderboardData.leaderboard.map(entry => `
                <div class="leaderboard-entry">
                    <span class="rank">#${entry.rank}</span>
                    <span class="player-name">${this.escapeHtml(entry.playerName)}</span>
                    <span class="score">${entry.score.toLocaleString()}</span>
                    <span class="wave">Wave ${entry.wave}</span>
                </div>
            `).join('');
            
            leaderboardList.innerHTML = html;
        } else {
            leaderboardList.innerHTML = '<div class="no-scores">No scores yet. Be the first!</div>';
        }
        
        leaderboardDisplay.classList.remove('hidden');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

        // Score submission form
        const scoreForm = document.getElementById('score-form');
        const skipSubmissionBtn = document.getElementById('skip-submission-btn');

        if (scoreForm) {
            scoreForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleScoreSubmission(e);
            });
        }

        if (skipSubmissionBtn) {
            skipSubmissionBtn.addEventListener('click', async () => {
                await this.skipScoreSubmission();
            });
        }
    }

    async handleScoreSubmission(event) {
        const form = event.target;
        const formData = new FormData(form);
        const playerName = formData.get('playerName').trim();
        
        if (!playerName) {
            this.showSubmissionStatus('Please enter your name.', 'error');
            return;
        }

        if (!this.currentGameStats) {
            this.showSubmissionStatus('Game data not available.', 'error');
            return;
        }

        // Disable form during submission
        this.setFormEnabled(false);
        this.showSubmissionStatus('Submitting score...', 'loading');

        try {
            const scoreData = {
                playerName: playerName,
                score: this.currentGameStats.score,
                wave: this.currentGameStats.wave,
                gameMode: 'normal'
            };

            const result = await window.apiService.submitScore(scoreData);
            
            this.showSubmissionStatus('Score submitted successfully!', 'success');
            
            // Load and show leaderboard after successful submission
            setTimeout(async () => {
                await this.loadLeaderboard();
            }, 1500);

        } catch (error) {
            console.error('Score submission failed:', error);
            this.showSubmissionStatus(`Failed to submit score: ${error.message}`, 'error');
            this.setFormEnabled(true);
        }
    }

    async skipScoreSubmission() {
        this.showSubmissionStatus('Loading leaderboard...', 'loading');
        await this.loadLeaderboard();
    }

    async loadLeaderboard() {
        try {
            const leaderboardData = await window.apiService.getLeaderboard({ limit: 10 });
            this.showLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.showSubmissionStatus(`Failed to load leaderboard: ${error.message}`, 'error');
        }
    }

    showSubmissionStatus(message, type) {
        const status = document.getElementById('submission-status');
        if (!status) return;

        status.innerHTML = `<div class="status-${type}">${message}</div>`;
        status.classList.remove('hidden');
    }

    setFormEnabled(enabled) {
        const form = document.getElementById('score-form');
        if (!form) return;

        const inputs = form.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = !enabled;
        });
    }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager };
} else {
    window.UIManager = UIManager;
}
