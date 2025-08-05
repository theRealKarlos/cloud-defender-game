/**
 * API Service for Cloud Defenders
 * Handles communication with the backend API
 */

class ApiService {
  constructor() {
    // Configure API base URL from config.js
    this.API_BASE_URL = this.getApiBaseUrl();
    // Use timeout from config, with fallback
    this.timeout = (window.API_CONFIG && window.API_CONFIG.timeout) || 10000;
  }

  /**
   * Get the API base URL from configuration
   * Reads from window.API_CONFIG.baseUrl as single source of truth
   */
  getApiBaseUrl() {
    // Always use the configured API URL from config.js as single source of truth
    if (window.API_CONFIG && window.API_CONFIG.baseUrl) {
      return window.API_CONFIG.baseUrl;
    }

    // If config is not available, throw an error rather than using a hardcoded fallback
    throw new Error(
      'API configuration not found. Make sure config.js is loaded before api-service.js'
    );
  }

  /**
   * Submit a score to the leaderboard with security validation
   */
  async submitScore(scoreData, validationData = null) {
    try {
      // Prepare secure payload
      const securePayload = {
        ...scoreData,
        timestamp: Date.now(),
        clientVersion: '1.0.0',

        // Include validation data if provided
        ...(validationData && {
          validation: {
            sessionData: validationData.sessionData,
            confidence: validationData.confidence,
            flags: validationData.flags,
            isValid: validationData.isValid,
          },
        }),
      };

      console.log('Submitting score with security validation:', {
        ...securePayload,
        validation: validationData ? 'included' : 'none',
      });

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.API_BASE_URL}/api/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': '1.0.0',
          'X-Timestamp': Date.now().toString(),
        },
        body: JSON.stringify(securePayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log('Score submitted successfully:', result);
      return result;
    } catch (error) {
      console.error('Error submitting score:', error);

      // Enhanced error handling with CORS detection
      if (error.name === 'AbortError') {
        throw new Error(
          'Request timed out. Please check your connection and try again.'
        );
      } else if (error.message.includes('Failed to fetch')) {
        // Detailed CORS error detection
        const isLocalhost =
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1';
        const isHttps = this.API_BASE_URL.startsWith('https://');

        if (isLocalhost && isHttps) {
          // Provide detailed guidance for CORS issues
          const corsError = new Error(
            `CORS Error: Cannot make requests from ${window.location.origin} to ${this.API_BASE_URL}. ` +
              '\n\nQuick Solutions:\n' +
              '1. Deploy the Lambda function with updated CORS headers\n' +
              '2. Use Chrome with CORS disabled for testing\n' +
              '3. Test with PowerShell/Postman instead\n' +
              '\nSee http://localhost:3000/cors-proxy.html for detailed solutions.'
          );
          corsError.isCorsError = true;
          corsError.solutions = {
            deployCommand:
              'cd infra && terraform apply -target="module.lambda_function" -auto-approve',
            chromeCommand:
              'chrome.exe --user-data-dir="C:/temp/chrome-cors" --disable-web-security --disable-features=VizDisplayCompositor',
            helpUrl: `${window.location.origin}/cors-proxy.html`,
          };
          throw corsError;
        } else {
          throw new Error(
            `Network Error: Failed to connect to ${this.API_BASE_URL}. ` +
              'This could be due to CORS restrictions, network connectivity issues, or server unavailability. ' +
              `Origin: ${window.location.origin}`
          );
        }
      } else if (
        error.message.includes('CORS') ||
        error.message.includes('cross-origin')
      ) {
        throw new Error(
          'CORS Error: Cross-origin request blocked by browser security policy.'
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(options = {}) {
    try {
      const params = new URLSearchParams();

      if (options.limit) params.append('limit', options.limit);
      if (options.gameMode) params.append('gameMode', options.gameMode);
      if (options.timeframe) params.append('timeframe', options.timeframe);

      const url = `${this.API_BASE_URL}/api/leaderboard${
        params.toString() ? '?' + params.toString() : ''
      }`;
      console.log('Fetching leaderboard:', url);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log('Leaderboard fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);

      // Provide user-friendly error messages
      if (error.name === 'AbortError') {
        throw new Error(
          'Request timed out. Please check your connection and try again.'
        );
      } else if (error.message.includes('Failed to fetch')) {
        // Detailed CORS error detection for leaderboard
        const isLocalhost =
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1';
        const isHttps = this.API_BASE_URL.startsWith('https://');

        if (isLocalhost && isHttps) {
          const corsError = new Error(
            `CORS Error: Cannot fetch leaderboard from ${window.location.origin} to ${this.API_BASE_URL}. ` +
              'See http://localhost:3000/cors-proxy.html for solutions.'
          );
          corsError.isCorsError = true;
          throw corsError;
        } else {
          throw new Error(
            `Network Error: Failed to fetch leaderboard from ${this.API_BASE_URL}. ` +
              `Origin: ${window.location.origin}`
          );
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection() {
    try {
      await this.getLeaderboard({ limit: 1 });
      return true;
    } catch (error) {
      console.warn('API connection test failed:', error.message);
      return false;
    }
  }
}

// Create global instance
window.apiService = new ApiService();
