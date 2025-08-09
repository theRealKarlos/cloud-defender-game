/**
 * Cloud Defenders - Main Application Entry Point
 * Initialises the game engine and handles application startup
 *
 * This module has been refactored to support centralised asynchronous initialisation.
 * Instead of automatically initialising on DOMContentLoaded, it now provides a
 * callable function that is invoked by main.js after all dependencies are ready.
 */

// Note: All required modules should be loaded before this file

/**
 * Initialise the game engine
 * Called by main.js after all dependencies are ready and configuration is loaded.
 * This approach prevents race conditions and ensures proper initialisation order.
 *
 * @returns {boolean} True if initialisation succeeded, false otherwise
 */
function initializeGame() {
  try {
    // Check for Canvas support before proceeding
    // This prevents the game from attempting to run on unsupported browsers
    const canvas = document.getElementById('game-canvas');
    if (!canvas || !canvas.getContext) {
      alert(
        'Your browser does not support HTML5 Canvas. Please upgrade to a modern browser.'
      );
      return false;
    }

    // Initialise the game engine with the canvas element
    // This creates all the core game systems and prepares them for use
    window.gameEngine = new GameEngine('game-canvas');

    // Start the render loop (but not the game logic)
    // This begins the visual updates but waits for user input to start gameplay
    window.gameEngine.gameLoop.start();

    console.log('Cloud Defenders initialised successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialise Cloud Defenders:', error);
    alert(
      'Failed to initialise the game. Please refresh the page and try again.'
    );
    return false;
  }
}

// Make the initialisation function available globally
// This allows main.js to call it during the centralised startup sequence
window.initializeGame = initializeGame;
