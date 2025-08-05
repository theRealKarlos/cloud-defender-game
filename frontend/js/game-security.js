/**
 * Game Security Module
 * Implements client-side security measures to deter score manipulation
 * Note: This is NOT foolproof - real security must be server-side
 */

class GameSecurity {
  constructor() {
    this.gameStartTime = null;
    this.gameEvents = [];
    this.checksumSeed = this.generateSeed();
    this.antiTamperChecks = [];

    // Start monitoring
    this.startAntiTamperMonitoring();
  }

  generateSeed() {
    return Math.floor(Math.random() * 1000000) + Date.now();
  }

  startGame() {
    this.gameStartTime = Date.now();
    this.gameEvents = [];
    this.recordEvent('game_start', { timestamp: this.gameStartTime });
  }

  recordEvent(eventType, data) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      data: data,
      checksum: this.calculateChecksum(eventType, data),
    };

    this.gameEvents.push(event);

    // Keep only last 1000 events to prevent memory issues
    if (this.gameEvents.length > 1000) {
      this.gameEvents.shift();
    }
  }

  calculateChecksum(eventType, data) {
    // Simple checksum calculation (can be made more complex)
    const str = eventType + JSON.stringify(data) + this.checksumSeed;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  validateGameSession(finalScore, wave, _gameStats) {
    const validationResult = {
      isValid: true,
      confidence: 1.0,
      flags: [],
      sessionData: this.generateSessionData(finalScore, wave, _gameStats),
    };

    // Check 1: Minimum game duration
    const gameDuration = Date.now() - this.gameStartTime;
    const minExpectedDuration = (wave - 1) * 10000; // 10 seconds per wave minimum

    if (gameDuration < minExpectedDuration) {
      validationResult.flags.push('SUSPICIOUS_DURATION');
      validationResult.confidence *= 0.3;
    }

    // Check 2: Score vs Wave ratio
    const scorePerWave = finalScore / wave;
    if (scorePerWave > 2000) {
      // Adjust based on game balance
      validationResult.flags.push('SUSPICIOUS_SCORE_RATIO');
      validationResult.confidence *= 0.5;
    }

    // Check 3: Event sequence validation
    const hasGameStart = this.gameEvents.some((e) => e.type === 'game_start');
    const hasWaveEvents = this.gameEvents.some(
      (e) => e.type === 'wave_complete'
    );

    if (!hasGameStart || !hasWaveEvents) {
      validationResult.flags.push('MISSING_GAME_EVENTS');
      validationResult.confidence *= 0.2;
    }

    // Check 4: Browser environment checks
    if (this.detectSuspiciousEnvironment()) {
      validationResult.flags.push('SUSPICIOUS_ENVIRONMENT');
      validationResult.confidence *= 0.6;
    }

    // Check 5: Anti-tamper checks
    if (this.antiTamperChecks.length > 0) {
      validationResult.flags.push('TAMPER_DETECTED');
      validationResult.confidence *= 0.1;
    }

    // Overall validation
    if (validationResult.confidence < 0.5) {
      validationResult.isValid = false;
    }

    return validationResult;
  }

  generateSessionData(finalScore, wave, _gameStats) {
    // Create a session fingerprint that can be validated server-side
    const sessionData = {
      startTime: this.gameStartTime,
      endTime: Date.now(),
      duration: Date.now() - this.gameStartTime,
      eventCount: this.gameEvents.length,
      checksumSeed: this.checksumSeed,
      browserFingerprint: this.getBrowserFingerprint(),
      gameVersion: '1.0.0',

      // Game-specific metrics
      finalScore: finalScore,
      wave: wave,
      avgScorePerWave: finalScore / wave,

      // Event summary
      eventSummary: this.summarizeEvents(),

      // Security checksum
      sessionChecksum: this.calculateSessionChecksum(finalScore, wave),
    };

    return sessionData;
  }

  calculateSessionChecksum(finalScore, wave) {
    const data = {
      score: finalScore,
      wave: wave,
      duration: Date.now() - this.gameStartTime,
      seed: this.checksumSeed,
    };

    return this.calculateChecksum('session_end', data);
  }

  summarizeEvents() {
    const summary = {};
    this.gameEvents.forEach((event) => {
      summary[event.type] = (summary[event.type] || 0) + 1;
    });
    return summary;
  }

  getBrowserFingerprint() {
    // Return mock data in Node.js environment (testing)
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        userAgent: 'Node.js Test Environment',
        language: 'en-US',
        platform: 'test',
        screenResolution: '1920x1080',
        timezone: 'UTC',
        cookieEnabled: true,
        onlineStatus: true,
      };
    }

    // Create a basic browser fingerprint
    return {
      userAgent: navigator.userAgent.substring(0, 100), // Truncate for privacy
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
    };
  }

  detectSuspiciousEnvironment() {
    // Return false in Node.js environment (testing)
    if (typeof window === 'undefined') {
      return false;
    }

    let suspiciousFlags = 0;

    // Check for developer tools (basic detection)
    if (window.outerHeight - window.innerHeight > 200) {
      suspiciousFlags++;
    }

    // Check for common automation tools
    if (window.webdriver || window.phantom || window.callPhantom) {
      suspiciousFlags++;
    }

    // Check for suspicious global variables
    const suspiciousGlobals = [
      '__nightmare',
      '_phantom',
      'callPhantom',
      'webdriver',
    ];
    suspiciousGlobals.forEach((global) => {
      if (window[global]) suspiciousFlags++;
    });

    // Check for modified native functions (basic)
    if (Date.now.toString().indexOf('[native code]') === -1) {
      suspiciousFlags++;
    }

    return suspiciousFlags > 1;
  }

  startAntiTamperMonitoring() {
    // Skip monitoring in Node.js environment (testing)
    if (typeof window === 'undefined') {
      return;
    }

    // Monitor for console usage
    const devtools = {
      open: false,
      orientation: null,
    };

    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > 200 ||
        window.outerWidth - window.innerWidth > 200
      ) {
        if (!devtools.open) {
          devtools.open = true;
          this.antiTamperChecks.push({
            type: 'devtools_opened',
            timestamp: Date.now(),
          });
        }
      } else {
        devtools.open = false;
      }
    }, 1000);

    // Monitor for suspicious function calls
    this.monitorCriticalFunctions();
  }

  monitorCriticalFunctions() {
    // Skip monitoring in Node.js environment (testing)
    if (typeof window === 'undefined') {
      return;
    }

    // Store original functions
    const originalFetch = window.fetch;
    const _originalXHR = window.XMLHttpRequest;

    // Monitor fetch calls
    window.fetch = function (...args) {
      // Log suspicious API calls
      if (args[0] && args[0].includes('/scores')) {
        console.warn('Score submission detected via fetch');
      }
      return originalFetch.apply(this, args);
    };

    // Note: This is basic monitoring - sophisticated attackers can bypass this
  }

  // Public methods for game integration
  onWaveComplete(waveNumber, score) {
    this.recordEvent('wave_complete', {
      wave: waveNumber,
      score: score,
      timestamp: Date.now(),
    });
  }

  onMissileDestroyed(missileType, score) {
    this.recordEvent('missile_destroyed', {
      type: missileType,
      score: score,
      timestamp: Date.now(),
    });
  }

  onTargetHit(targetType, damage) {
    this.recordEvent('target_hit', {
      type: targetType,
      damage: damage,
      timestamp: Date.now(),
    });
  }

  onGameOver(finalScore, wave) {
    this.recordEvent('game_over', {
      finalScore: finalScore,
      wave: wave,
      timestamp: Date.now(),
    });

    return this.validateGameSession(finalScore, wave, {});
  }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameSecurity };
} else {
  window.GameSecurity = GameSecurity;
}
