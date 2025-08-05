/**
 * Cloud Defenders - Main Application Entry Point
 * Initializes the game engine and handles application startup
 */

// Note: All required modules should be loaded before this file

// Initialise the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Check for Canvas support
    const canvas = document.getElementById('game-canvas');
    if (!canvas || !canvas.getContext) {
      alert(
        'Your browser does not support HTML5 Canvas. Please upgrade to a modern browser.'
      );
      return;
    }

    // Initialize the game engine
    window.gameEngine = new GameEngine('game-canvas');

    // Start the render loop (but not the game logic)
    window.gameEngine.gameLoop.start();

    console.log('Cloud Defenders initialised successfully');
  } catch (error) {
    console.error('Failed to initialize Cloud Defenders:', error);
    alert(
      'Failed to initialise the game. Please refresh the page and try again.'
    );
  }
});
