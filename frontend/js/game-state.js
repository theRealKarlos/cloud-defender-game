/**
 * Game State Management
 * Defines game states and handles state transitions
 */

// Game State Enumeration
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LOADING: 'loading'
};

class GameStateManager {
    constructor() {
        this.currentState = GameState.MENU;
        this.previousState = GameState.MENU;
        this.stateChangeCallbacks = new Map();
    }

    changeState(newState) {
        if (this.currentState !== newState) {
            this.previousState = this.currentState;
            this.currentState = newState;
            this.onStateChange(this.previousState, newState);
        }
    }

    onStateChange(oldState, newState) {
        console.log(`Game state changed: ${oldState} -> ${newState}`);

        // Call registered callbacks
        const callback = this.stateChangeCallbacks.get(newState);
        if (callback) {
            callback(oldState, newState);
        }
    }

    registerStateChangeCallback(state, callback) {
        this.stateChangeCallbacks.set(state, callback);
    }

    getCurrentState() {
        return this.currentState;
    }

    getPreviousState() {
        return this.previousState;
    }

    isState(state) {
        return this.currentState === state;
    }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameState, GameStateManager };
} else {
    window.GameState = GameState;
    window.GameStateManager = GameStateManager;
}
