/**
 * Unit Tests for Game Security System
 * Tests security validation and anti-tamper measures
 */

const { GameSecurity } = require('../js/game-security.js');

describe('GameSecurity', () => {
    let gameSecurity;

    beforeEach(() => {
        gameSecurity = new GameSecurity();

        // Mock Date.now for consistent testing
        jest.spyOn(Date, 'now').mockReturnValue(1000000);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with correct default values', () => {
            expect(gameSecurity.gameStartTime).toBeNull();
            expect(gameSecurity.gameEvents).toEqual([]);
            expect(gameSecurity.checksumSeed).toBeDefined();
            expect(gameSecurity.antiTamperChecks).toEqual([]);
        });

        test('should generate unique checksum seeds', () => {
            const security1 = new GameSecurity();
            const security2 = new GameSecurity();

            expect(security1.checksumSeed).not.toBe(security2.checksumSeed);
        });
    });

    describe('Game Session Tracking', () => {
        test('should start game session correctly', () => {
            gameSecurity.startGame();

            expect(gameSecurity.gameStartTime).toBe(1000000);
            expect(gameSecurity.gameEvents).toHaveLength(1);
            expect(gameSecurity.gameEvents[0].type).toBe('game_start');
        });

        test('should record events with checksums', () => {
            gameSecurity.startGame();
            gameSecurity.recordEvent('test_event', { value: 123 });

            expect(gameSecurity.gameEvents).toHaveLength(2);

            const testEvent = gameSecurity.gameEvents[1];
            expect(testEvent.type).toBe('test_event');
            expect(testEvent.data.value).toBe(123);
            expect(testEvent.checksum).toBeDefined();
            expect(typeof testEvent.checksum).toBe('number');
        });

        test('should limit event history to prevent memory issues', () => {
            gameSecurity.startGame();

            // Add more than 1000 events
            for (let i = 0; i < 1005; i++) {
                gameSecurity.recordEvent('test_event', { index: i });
            }

            expect(gameSecurity.gameEvents).toHaveLength(1000);
            // Should keep the most recent events
            expect(gameSecurity.gameEvents[999].data.index).toBe(1004);
        });
    });

    describe('Checksum Calculation', () => {
        test('should generate consistent checksums for same input', () => {
            const checksum1 = gameSecurity.calculateChecksum('test', { value: 123 });
            const checksum2 = gameSecurity.calculateChecksum('test', { value: 123 });

            expect(checksum1).toBe(checksum2);
        });

        test('should generate different checksums for different inputs', () => {
            const checksum1 = gameSecurity.calculateChecksum('test1', { value: 123 });
            const checksum2 = gameSecurity.calculateChecksum('test2', { value: 123 });

            expect(checksum1).not.toBe(checksum2);
        });
    });

    describe('Game Session Validation', () => {
        beforeEach(() => {
            gameSecurity.startGame();
        });

        test('should validate normal game session', () => {
            // Simulate normal game progression
            Date.now.mockReturnValue(1000000 + 60000); // 1 minute later

            gameSecurity.recordEvent('wave_complete', { wave: 1 });
            gameSecurity.recordEvent('wave_complete', { wave: 2 });

            const result = gameSecurity.validateGameSession(1500, 3, {});

            expect(result.isValid).toBe(true);
            expect(result.confidence).toBeGreaterThan(0.5);
            expect(result.sessionData).toBeDefined();
        });

        test('should flag suspiciously short game duration', () => {
            // Game ends too quickly
            Date.now.mockReturnValue(1000000 + 5000); // 5 seconds later

            const result = gameSecurity.validateGameSession(1000, 5, {});

            expect(result.flags).toContain('SUSPICIOUS_DURATION');
            expect(result.confidence).toBeLessThan(1.0);
        });

        test('should flag suspiciously high score ratio', () => {
            Date.now.mockReturnValue(1000000 + 60000); // 1 minute later

            const result = gameSecurity.validateGameSession(10000, 2, {}); // 5000 per wave

            expect(result.flags).toContain('SUSPICIOUS_SCORE_RATIO');
            expect(result.confidence).toBeLessThan(1.0);
        });

        test('should flag missing game events', () => {
            Date.now.mockReturnValue(1000000 + 60000); // 1 minute later

            // No wave events recorded
            const result = gameSecurity.validateGameSession(1000, 3, {});

            expect(result.flags).toContain('MISSING_GAME_EVENTS');
            expect(result.confidence).toBeLessThan(1.0);
        });

        test('should mark session as invalid with very low confidence', () => {
            Date.now.mockReturnValue(1000000 + 1000); // 1 second later

            const result = gameSecurity.validateGameSession(20000, 10, {}); // Multiple red flags

            expect(result.isValid).toBe(false);
            expect(result.confidence).toBeLessThan(0.5);
        });
    });

    describe('Session Data Generation', () => {
        beforeEach(() => {
            gameSecurity.startGame();
        });

        test('should generate comprehensive session data', () => {
            Date.now.mockReturnValue(1000000 + 30000); // 30 seconds later

            gameSecurity.recordEvent('wave_complete', { wave: 1 });
            gameSecurity.recordEvent('missile_destroyed', { type: 'cost-spike' });

            const sessionData = gameSecurity.generateSessionData(1500, 2, {});

            expect(sessionData.startTime).toBe(1000000);
            expect(sessionData.endTime).toBe(1000000 + 30000);
            expect(sessionData.duration).toBe(30000);
            expect(sessionData.eventCount).toBe(3); // game_start + 2 events
            expect(sessionData.finalScore).toBe(1500);
            expect(sessionData.wave).toBe(2);
            expect(sessionData.browserFingerprint).toBeDefined();
            expect(sessionData.sessionChecksum).toBeDefined();
        });

        test('should include event summary', () => {
            gameSecurity.recordEvent('wave_complete', { wave: 1 });
            gameSecurity.recordEvent('wave_complete', { wave: 2 });
            gameSecurity.recordEvent('missile_destroyed', { type: 'cost-spike' });

            const sessionData = gameSecurity.generateSessionData(1500, 2, {});

            expect(sessionData.eventSummary).toEqual({
                game_start: 1,
                wave_complete: 2,
                missile_destroyed: 1
            });
        });
    });

    describe('Browser Fingerprinting', () => {
        test('should generate browser fingerprint', () => {
            const fingerprint = gameSecurity.getBrowserFingerprint();

            // In Node.js environment, should return mock data
            expect(fingerprint.userAgent).toBe('Node.js Test Environment');
            expect(fingerprint.language).toBe('en-US');
            expect(fingerprint.platform).toBe('test');
            expect(fingerprint.screenResolution).toBe('1920x1080');
            expect(fingerprint.timezone).toBe('UTC');
            expect(fingerprint.cookieEnabled).toBe(true);
            expect(fingerprint.onlineStatus).toBe(true);
        });
    });

    describe('Event Recording Methods', () => {
        beforeEach(() => {
            gameSecurity.startGame();
        });

        test('should record wave completion events', () => {
            gameSecurity.onWaveComplete(3, 1500);

            const waveEvent = gameSecurity.gameEvents.find(
                (e) => e.type === 'wave_complete'
            );
            expect(waveEvent).toBeDefined();
            expect(waveEvent.data.wave).toBe(3);
            expect(waveEvent.data.score).toBe(1500);
        });

        test('should record missile destruction events', () => {
            gameSecurity.onMissileDestroyed('cost-spike', 100);

            const missileEvent = gameSecurity.gameEvents.find(
                (e) => e.type === 'missile_destroyed'
            );
            expect(missileEvent).toBeDefined();
            expect(missileEvent.data.type).toBe('cost-spike');
            expect(missileEvent.data.score).toBe(100);
        });

        test('should record target hit events', () => {
            gameSecurity.onTargetHit('s3', 25);

            const targetEvent = gameSecurity.gameEvents.find(
                (e) => e.type === 'target_hit'
            );
            expect(targetEvent).toBeDefined();
            expect(targetEvent.data.type).toBe('s3');
            expect(targetEvent.data.damage).toBe(25);
        });

        test('should record game over and return validation', () => {
            Date.now.mockReturnValue(1000000 + 60000); // 1 minute later

            gameSecurity.recordEvent('wave_complete', { wave: 1 });

            const result = gameSecurity.onGameOver(1500, 3);

            expect(result).toBeDefined();
            expect(result.isValid).toBeDefined();
            expect(result.confidence).toBeDefined();
            expect(result.sessionData).toBeDefined();

            const gameOverEvent = gameSecurity.gameEvents.find(
                (e) => e.type === 'game_over'
            );
            expect(gameOverEvent).toBeDefined();
            expect(gameOverEvent.data.finalScore).toBe(1500);
            expect(gameOverEvent.data.wave).toBe(3);
        });
    });
});
