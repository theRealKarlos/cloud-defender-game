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
      { element: this.restartBtn, name: 'restart-btn' },
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

      // Ensure form is enabled
      this.setFormEnabled(true);

      // Focus the input field after a short delay to ensure the modal is visible
      setTimeout(() => {
        const input = document.getElementById('player-name');
        if (input) {
          input.focus();
          console.log('Input field focused for score submission');
        }
      }, 100);
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
      let html = '';

      // Add message if it exists (for mock leaderboard)
      if (leaderboardData.message) {
        html += `<div class="leaderboard-message">${leaderboardData.message}</div>`;
      }

      html += leaderboardData.leaderboard
        .map((entry) => {
          const isCurrentUser = entry.isCurrentUser ? ' current-user' : '';
          return `
                    <div class="leaderboard-entry${isCurrentUser}">
                        <span class="rank">#${entry.rank}</span>
                        <span class="player-name">${this.escapeHtml(entry.playerName)}</span>
                        <span class="score">${entry.score.toLocaleString()}</span>
                        <span class="wave">Wave ${entry.wave}</span>
                        ${entry.isCurrentUser ? '<span class="you-indicator">← YOU</span>' : ''}
                    </div>
                `;
        })
        .join('');

      leaderboardList.innerHTML = html;
    } else {
      leaderboardList.innerHTML =
        '<div class="no-scores">No scores yet. Be the first!</div>';
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

    const scoreData = {
      playerName: playerName,
      score: this.currentGameStats.score,
      wave: this.currentGameStats.wave,
      gameMode: 'normal',
    };

    try {
      const _result = await window.apiService.submitScore(
        scoreData,
        this.currentGameStats.validationData
      );

      this.showSubmissionStatus('Score submitted successfully!', 'success');

      // Re-enable form after successful submission
      this.setFormEnabled(true);

      // Load and show leaderboard after successful submission
      setTimeout(async () => {
        await this.loadLeaderboard();
      }, 1500);
    } catch (error) {
      console.error('Score submission failed:', error);

      // Check if this is a network/server error (backend not deployed yet)
      if (
        error.message.includes('Unable to connect') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('timed out')
      ) {
        this.showSubmissionStatus(
          `Backend not available yet. Your score: ${this.currentGameStats.score} (Wave ${this.currentGameStats.wave})`,
          'info'
        );

        // Show a mock leaderboard after a delay
        setTimeout(() => {
          this.showMockLeaderboard(scoreData);
        }, 2000);
      } else {
        this.showSubmissionStatus(
          `Failed to submit score: ${error.message}`,
          'error'
        );
        this.setFormEnabled(true);
      }
    }
  }

  async skipScoreSubmission() {
    this.showSubmissionStatus('Loading leaderboard...', 'loading');

    // Try to load real leaderboard, fall back to mock if backend unavailable
    try {
      await this.loadLeaderboard();
    } catch {
      // If that fails too, just show mock leaderboard
      setTimeout(() => {
        this.showMockLeaderboard();
      }, 1000);
    }
  }

  async loadLeaderboard() {
    try {
      const leaderboardData = await window.apiService.getLeaderboard({
        limit: 10,
      });
      this.showLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);

      // If backend is not available, show mock leaderboard
      if (
        error.message.includes('Unable to connect') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('timed out')
      ) {
        this.showMockLeaderboard();
      } else {
        this.showSubmissionStatus(
          `Failed to load leaderboard: ${error.message}`,
          'error'
        );
      }
    }
  }

  showMockLeaderboard(newScore = null) {
    // Create a mock leaderboard with some sample scores
    const mockScores = [
      { rank: 1, playerName: 'CloudMaster', score: 15420, wave: 12 },
      { rank: 2, playerName: 'AWSNinja', score: 12350, wave: 10 },
      { rank: 3, playerName: 'DefenderPro', score: 9870, wave: 8 },
      { rank: 4, playerName: 'ServerGuard', score: 8200, wave: 7 },
      { rank: 5, playerName: 'CodeWarrior', score: 6540, wave: 6 },
    ];

    // If user just submitted a score, add it to the mock leaderboard
    if (newScore) {
      const userEntry = {
        rank: 0, // Will be calculated
        playerName: newScore.playerName,
        score: newScore.score,
        wave: newScore.wave,
        isCurrentUser: true,
      };

      // Find where the user's score should be inserted
      let insertIndex = mockScores.findIndex(
        (entry) => newScore.score > entry.score
      );
      if (insertIndex === -1) {
        insertIndex = mockScores.length;
      }

      mockScores.splice(insertIndex, 0, userEntry);

      // Update ranks
      mockScores.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // Keep only top 10
      mockScores.splice(10);
    }

    const mockLeaderboardData = {
      leaderboard: mockScores,
      message: 'Demo leaderboard (backend not deployed yet)',
    };

    this.showLeaderboard(mockLeaderboardData);
  }

  showSubmissionStatus(message, type) {
    const status = document.getElementById('submission-status');
    if (!status) return;

    // Safely render status message without interpreting it as HTML
    status.textContent = '';
    const messageDiv = document.createElement('div');
    messageDiv.className = `status-${type}`;
    messageDiv.textContent = message;
    status.appendChild(messageDiv);

    status.classList.remove('hidden');
  }

  setFormEnabled(enabled) {
    const form = document.getElementById('score-form');
    if (!form) return;

    const inputs = form.querySelectorAll('input, button');
    inputs.forEach((input) => {
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
