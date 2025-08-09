/**
 * Main application entry point for Cloud Defenders
 * Loads configuration and initializes the game
 */

class ConfigLoader {
  constructor() {
    this.config = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Load configuration from config.json
   */
  async loadConfig() {
    try {
      console.log('Loading application configuration...');

      const response = await fetch('/config.json', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to load config: ${response.status} ${response.statusText}`
        );
      }

      this.config = await response.json();
      console.log('Configuration loaded successfully:', this.config);

      // Set global config for backwards compatibility
      window.API_CONFIG = {
        baseUrl: this.config.apiBaseUrl,
        timeout: this.config.timeout,
        version: this.config.version,
        features: this.config.features,
      };

      return this.config;
    } catch (error) {
      console.error('Error loading configuration:', error);

      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(
          `Retrying configuration load (${this.retryCount}/${this.maxRetries}) in ${this.retryDelay}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.loadConfig();
      } else {
        // Fallback to default configuration
        console.warn('Using fallback configuration due to load failure');
        this.config = {
          apiBaseUrl: 'https://api-placeholder.example.com',
          timeout: 10000,
          version: '1.0.0',
          features: {
            scoreValidation: true,
            leaderboard: true,
            realTimeUpdates: false,
          },
        };

        window.API_CONFIG = {
          baseUrl: this.config.apiBaseUrl,
          timeout: this.config.timeout,
          version: this.config.version,
          features: this.config.features,
        };

        return this.config;
      }
    }
  }

  /**
   * Initialize the application after config is loaded
   */
  async initializeApp() {
    try {
      console.log('Initializing Cloud Defenders application...');

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Initialize game components in order
      if (typeof Game !== 'undefined') {
        console.log('Starting game engine...');
        // Game initialization will happen automatically via existing script loading
      } else {
        console.warn('Game class not found - scripts may still be loading');
      }

      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Error initializing application:', error);
      this.showErrorMessage(
        'Failed to initialize game. Please refresh the page.'
      );
    }
  }

  /**
   * Show error message to user
   */
  showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff4444;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  }

  /**
   * Main startup function
   */
  async start() {
    try {
      // Load configuration first
      await this.loadConfig();

      // Then initialize the application
      await this.initializeApp();
    } catch (error) {
      console.error('Fatal error during application startup:', error);
      this.showErrorMessage(
        'Failed to start Cloud Defenders. Please check your connection and refresh.'
      );
    }
  }
}

// Start the application when this script loads
const configLoader = new ConfigLoader();

// Start immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => configLoader.start());
} else {
  configLoader.start();
}

// Make config loader available globally for debugging
window.configLoader = configLoader;
