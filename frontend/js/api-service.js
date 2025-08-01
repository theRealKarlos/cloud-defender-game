/**
 * API Service for Cloud Defenders
 * Handles communication with the backend API
 */

class ApiService {
    constructor() {
        // Configure API base URL - will use custom domain after deployment
        this.API_BASE_URL = 'https://cloud-defenders-api.lucky4some.com';
        this.timeout = 10000; // 10 second timeout
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
                        isValid: validationData.isValid
                    }
                })
            };
            
            console.log('Submitting score with security validation:', {
                ...securePayload,
                validation: validationData ? 'included' : 'none'
            });
            
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(`${this.API_BASE_URL}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Version': '1.0.0',
                    'X-Timestamp': Date.now().toString()
                },
                body: JSON.stringify(securePayload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Score submitted successfully:', result);
            return result;

        } catch (error) {
            console.error('Error submitting score:', error);
            
            // Provide user-friendly error messages
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please check your connection and try again.');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('Unable to connect to the server. Please check your internet connection.');
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
            
            const url = `${this.API_BASE_URL}/leaderboard${params.toString() ? '?' + params.toString() : ''}`;  
            console.log('Fetching leaderboard:', url);
            
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Leaderboard fetched successfully:', result);
            return result;

        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            
            // Provide user-friendly error messages
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please check your connection and try again.');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('Unable to connect to the server. Please check your internet connection.');
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


