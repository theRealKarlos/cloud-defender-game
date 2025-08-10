/**
 * Main application entry point for Cloud Defenders
 * Loads configuration and initialises the game
 *
 * This module implements a centralised asynchronous initialisation system
 * to prevent race conditions between configuration loading and component setup.
 */

/**
 * Configuration loader class
 * Handles asynchronous loading of runtime configuration and manages
 * the initialisation sequence of all application components.
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
   * Implements retry logic with fallback configuration to ensure
   * the application can start even if the config file is unavailable.
   */
  async loadConfig() {
    try {
      console.log('Loading application configuration...');

      // Fetch configuration with cache-busting headers
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

      // Set global config for backwards compatibility with existing code
      // This ensures that components expecting window.API_CONFIG continue to work
      window.API_CONFIG = {
        baseUrl: this.config.apiBaseUrl,
        timeout: this.config.timeout,
        version: this.config.version,
        features: this.config.features,
      };

      return this.config;
    } catch (error) {
      console.error('Error loading configuration:', error);

      // Implement retry logic with exponential backoff
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(
          `Retrying configuration load (${this.retryCount}/${this.maxRetries}) in ${this.retryDelay}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.loadConfig();
      } else {
        // Fallback to default configuration to prevent application failure
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

        // Set fallback config globally
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
   * Initialise the application after config is loaded
   * This method ensures all components are initialised in the correct order
   * to prevent race conditions and undefined reference errors.
   */
  async initializeApp() {
    try {
      console.log('Initialising Cloud Defenders application...');

      // Wait for DOM to be ready before proceeding with component initialisation
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Load all required scripts in the correct dependency order
      // This ensures all components are available before initialisation begins
      await this.loadScripts();

      // Initialise core services in the correct dependency order
      // API Service must be first as other components depend on it
      console.log('Initialising API service...');
      if (typeof ApiService !== 'undefined') {
        window.apiService = new ApiService();
        // Initialize the service with the loaded configuration
        window.apiService.init(this.config);
        console.log('API service initialised successfully');
      } else {
        throw new Error('ApiService class not found');
      }

      // Initialise UI manager after API service is available
      // UI manager needs API service for score submission functionality
      console.log('Initialising UI manager...');
      if (typeof UIManager !== 'undefined') {
        window.uiManager = new UIManager();
        console.log('UI manager initialised successfully');
      } else {
        throw new Error('UIManager class not found');
      }

      // Initialise game engine last as it coordinates all other systems
      // Pass the UIManager instance to ensure proper dependency injection
      console.log('Initialising game engine...');
      if (typeof initializeGame !== 'undefined') {
        const gameInitialised = initializeGame(window.uiManager);
        if (gameInitialised) {
          console.log('Game engine initialised successfully');
        } else {
          throw new Error('Game engine initialisation failed');
        }
      } else {
        throw new Error('Game initialisation function not found');
      }

      console.log('Application initialised successfully');
    } catch (error) {
      console.error('Error initialising application:', error);
      this.showErrorMessage(
        'Failed to initialise game. Please refresh the page.'
      );
    }
  }

  /**
   * Dynamically load all required scripts in the correct dependency order
   * This ensures all components are available before initialisation begins.
   */
  async loadScripts() {
    const scripts = [
      'js/aws-icons.js',
      'js/entities.js',
      'js/target.js', 
      'js/defense.js',
      'js/missile.js',
      'js/explosive-bomb.js',
      'js/wave-manager.js',
      'js/game-conditions.js',
      'js/game-state.js',
      'js/renderer.js',
      'js/input-manager.js',
      'js/game-loop.js',
      'js/game-security.js',
      'js/event-handler.js',
      'js/game-engine.js',
      'js/game.js',
      'js/api-service.js',
      'js/ui-manager.js'
    ];

    console.log('Loading required scripts...');

    for (const scriptSrc of scripts) {
      try {
        await this.loadScript(scriptSrc);
        console.log(`✅ Loaded: ${scriptSrc}`);
      } catch (error) {
        console.error(`❌ Failed to load ${scriptSrc}:`, error);
        throw new Error(`Script loading failed: ${scriptSrc}`);
      }
    }

    console.log('All scripts loaded successfully');
  }

  /**
   * Load a single script and return a promise that resolves when loaded
   * @param {string} src - The script source path
   * @returns {Promise} Promise that resolves when script is loaded
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false; // Ensure scripts load in order
      
      script.onload = () => {
        // Additional verification for critical dependencies
        if (src === 'js/entities.js') {
          // Wait for Entity class to be available before proceeding
          this.waitForDependency('Entity', resolve, reject);
        } else if (src === 'js/defense.js') {
          // Verify Defense class is available
          this.waitForDependency('Defense', resolve, reject);
        } else {
          resolve();
        }
      };
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      
      document.head.appendChild(script);
    });
  }

  /**
   * Wait for a specific dependency to be available in the global scope
   * This prevents race conditions where scripts execute before their dependencies are ready
   * @param {string} dependencyName - Name of the dependency to wait for
   * @param {Function} resolve - Promise resolve function
   * @param {Function} reject - Promise reject function
   */
  waitForDependency(dependencyName, resolve, reject) {
    let attempts = 0;
    const maxAttempts = 50; // Maximum 5 seconds (50 * 100ms)
    
    const checkDependency = () => {
      attempts++;
      
      if (window[dependencyName]) {
        console.log(`✅ Dependency ${dependencyName} is ready`);
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error(`Timeout waiting for dependency: ${dependencyName}`));
      } else {
        // Retry after 100ms
        setTimeout(checkDependency, 100);
      }
    };
    
    // Start checking immediately
    checkDependency();
  }

  /**
   * Show error message to user
   * Displays a user-friendly error notification when initialisation fails.
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

    // Auto-remove error message after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  }

  /**
   * Main startup function
   * Coordinates the entire application startup sequence.
   */
  async start() {
    try {
      // Load configuration first - everything depends on this
      await this.loadConfig();

      // Then initialise the application components in order
      await this.initializeApp();
    } catch (error) {
      console.error('Fatal error during application startup:', error);
      this.showErrorMessage(
        'Failed to start Cloud Defenders. Please check your connection and refresh.'
      );
    }
  }
}

// Create global config loader instance
const configLoader = new ConfigLoader();

// Start the application when this script loads
// Handle both cases: DOM already loaded or still loading
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded event
  document.addEventListener('DOMContentLoaded', () => configLoader.start());
} else {
  // DOM is already loaded, start immediately
  configLoader.start();
}

// Make config loader available globally for debugging purposes
window.configLoader = configLoader;
