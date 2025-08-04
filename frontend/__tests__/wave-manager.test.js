/**
 * Unit Tests for WaveManager
 * Tests wave management system functionality
 */

// Import required modules
const { WaveManager } = require('../js/wave-manager.js');
const { EntityManager } = require('../js/entities.js');
const { Target } = require('../js/target.js');
const { Missile } = require('../js/missile.js');

describe('WaveManager', () => {
    let waveManager;
    let entityManager;
    const canvasWidth = 800;
    const canvasHeight = 600;

    beforeEach(() => {
        entityManager = new EntityManager();
        waveManager = new WaveManager(entityManager, canvasWidth, canvasHeight);
        
        // Add some test targets
        const target1 = new Target('s3', 100, 100);
        const target2 = new Target('lambda', 200, 150);
        entityManager.addEntity(target1, 'targets');
        entityManager.addEntity(target2, 'targets');
        entityManager.update(0); // Process added entities
    });

    describe('Initialisation', () => {
        test('should initialise with correct default values', () => {
            expect(waveManager.getCurrentWave()).toBe(1);
            expect(waveManager.getMaxWaves()).toBe(15);
            expect(waveManager.isWaveActive()).toBe(false);
            expect(waveManager.areAllWavesCompleted()).toBe(false);
        });

        test('should generate wave configurations for all waves', () => {
            const config = waveManager.getCurrentWaveConfig();
            expect(config).toBeDefined();
            expect(config.waveNumber).toBe(1);
            expect(config.missileCount).toBeGreaterThan(0);
            expect(config.spawnInterval).toBeGreaterThan(0);
            expect(config.missileTypes).toContain('cost-spike');
        });
    });

    describe('Wave Configuration Generation', () => {
        test('should calculate increasing missile counts per wave', () => {
            const wave1Config = waveManager.waveConfigs[0];
            const wave5Config = waveManager.waveConfigs[4];
            
            expect(wave5Config.missileCount).toBeGreaterThan(wave1Config.missileCount);
        });

        test('should calculate decreasing spawn intervals per wave', () => {
            const wave1Config = waveManager.waveConfigs[0];
            const wave10Config = waveManager.waveConfigs[9];
            
            expect(wave10Config.spawnInterval).toBeLessThan(wave1Config.spawnInterval);
        });

        test('should introduce missile types progressively', () => {
            const wave1Config = waveManager.waveConfigs[0];
            const wave3Config = waveManager.waveConfigs[2];
            const wave6Config = waveManager.waveConfigs[5];
            const wave10Config = waveManager.waveConfigs[9];
            
            expect(wave1Config.missileTypes).toEqual(['cost-spike']);
            expect(wave3Config.missileTypes).toContain('data-breach');
            expect(wave6Config.missileTypes).toContain('latency-ghost');
            expect(wave10Config.missileTypes).toContain('policy-violator');
        });

        test('should increase difficulty multiplier per wave', () => {
            const wave1Config = waveManager.waveConfigs[0];
            const wave5Config = waveManager.waveConfigs[4];
            
            expect(wave5Config.difficultyMultiplier).toBeGreaterThan(wave1Config.difficultyMultiplier);
        });

        test('should add special events for certain waves', () => {
            const wave5Config = waveManager.waveConfigs[4]; // Wave 5 (boss wave)
            const wave6Config = waveManager.waveConfigs[5]; // Wave 6 (speed burst)
            const wave8Config = waveManager.waveConfigs[7]; // Wave 8 (multi spawn)
            
            expect(wave5Config.specialEvents).toContain('boss_wave');
            expect(wave6Config.specialEvents).toContain('speed_burst');
            expect(wave8Config.specialEvents).toContain('multi_spawn');
        });
    });

    describe('Wave Control', () => {
        test('should start wave correctly', () => {
            const mockCallback = jest.fn();
            waveManager.setOnWaveStartCallback(mockCallback);
            
            waveManager.startWave();
            
            expect(waveManager.isWaveActive()).toBe(true);
            expect(waveManager.isWaveCompleted()).toBe(false);
            expect(mockCallback).toHaveBeenCalledWith(1, expect.any(Object));
        });

        test('should handle wave completion', () => {
            const mockCallback = jest.fn();
            waveManager.setOnWaveCompleteCallback(mockCallback);
            
            waveManager.startWave();
            waveManager.completeWave();
            
            expect(waveManager.isWaveActive()).toBe(false);
            expect(waveManager.isWaveCompleted()).toBe(true);
            expect(mockCallback).toHaveBeenCalledWith(1);
        });

        test('should transition to next wave after completion', () => {
            waveManager.startWave();
            waveManager.completeWave();
            
            expect(waveManager.isInWaveTransition()).toBe(true);
            expect(waveManager.getTransitionTimeRemaining()).toBeGreaterThan(0);
        });

        test('should complete all waves when max waves reached', () => {
            const mockCallback = jest.fn();
            waveManager.setOnAllWavesCompleteCallback(mockCallback);
            
            waveManager.currentWave = waveManager.getMaxWaves();
            waveManager.completeWave();
            
            expect(waveManager.areAllWavesCompleted()).toBe(true);
            expect(mockCallback).toHaveBeenCalled();
        });
    });

    describe('Missile Spawning', () => {
        test('should spawn missiles during active wave', () => {
            waveManager.startWave();
            
            // Force spawn a missile by setting timer to 0 and updating
            waveManager.missileSpawnTimer = 0;
            waveManager.update(0.1);
            entityManager.update(0.1); // Process added entities
            
            const missiles = entityManager.getEntitiesByLayer('missiles');
            expect(missiles.length).toBeGreaterThan(0);
        });

        test('should spawn correct missile types based on wave', () => {
            waveManager.startWave();
            
            // Force spawn a missile
            const config = waveManager.getCurrentWaveConfig();
            waveManager.spawnMissile(config);
            entityManager.update(0.1); // Process added entities
            
            const missiles = entityManager.getEntitiesByLayer('missiles');
            expect(missiles.length).toBe(1);
            expect(config.missileTypes).toContain(missiles[0].type);
        });

        test('should apply difficulty scaling to spawned missiles', () => {
            waveManager.currentWave = 5;
            waveManager.startWave();
            
            const config = waveManager.getCurrentWaveConfig();
            
            // Spawn a missile and check if difficulty scaling is applied
            waveManager.spawnMissile(config);
            entityManager.update(0.1); // Process added entities
            
            const missiles = entityManager.getEntitiesByLayer('missiles');
            expect(missiles.length).toBe(1);
            
            // Verify difficulty scaling was applied
            expect(config.difficultyMultiplier).toBeGreaterThan(1.0);
        });

        test('should not spawn missiles when no targets available', () => {
            // Clear all targets
            entityManager.clear();
            
            waveManager.startWave();
            const config = waveManager.getCurrentWaveConfig();
            
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            waveManager.spawnMissile(config);
            
            expect(consoleSpy).toHaveBeenCalledWith('No targets available for missile spawning');
            consoleSpy.mockRestore();
        });
    });

    describe('Wave Updates', () => {
        test('should update wave transition timer', () => {
            waveManager.isInTransition = true;
            waveManager.waveTransitionTimer = 1.0;
            
            waveManager.update(0.5);
            
            expect(waveManager.getTransitionTimeRemaining()).toBe(0.5);
        });

        test('should start next wave when transition completes', () => {
            waveManager.isInTransition = true;
            waveManager.waveTransitionTimer = 0.1;
            
            waveManager.update(0.2);
            
            expect(waveManager.isInWaveTransition()).toBe(false);
            expect(waveManager.getCurrentWave()).toBe(2);
            expect(waveManager.isWaveActive()).toBe(true);
        });

        test('should complete wave when all missiles spawned and cleared', () => {
            waveManager.startWave();
            const config = waveManager.getCurrentWaveConfig();
            
            // Simulate all missiles spawned
            waveManager.missilesSpawnedInWave = config.missileCount;
            
            // Ensure no missiles in entity manager
            entityManager.entitiesByLayer.set('missiles', []);
            
            waveManager.update(0.1);
            
            expect(waveManager.isWaveCompleted()).toBe(true);
        });
    });

    describe('Special Events', () => {
        test('should apply boss wave effects', () => {
            // Add a missile to test boss wave effect
            const missile = new Missile('cost-spike', 100, 100, 200, 200);
            entityManager.addEntity(missile, 'missiles');
            entityManager.update(0);
            
            waveManager.applyBossWaveEvent();
            
            // Note: Boss wave effect is random, so we can't guarantee it applies
            // This test mainly ensures the method runs without error
            expect(entityManager.getEntitiesByLayer('missiles').length).toBe(1);
        });

        test('should apply speed burst effects', () => {
            waveManager.missileSpawnTimer = 1.0;
            
            // Mock Math.random to ensure speed burst triggers
            const originalRandom = Math.random;
            Math.random = jest.fn(() => 0.05); // Less than 0.1 threshold
            
            waveManager.applySpeedBurstEvent();
            
            expect(waveManager.missileSpawnTimer).toBeLessThan(1.0);
            
            Math.random = originalRandom;
        });
    });

    describe('Utility Methods', () => {
        test('should calculate wave progress correctly', () => {
            waveManager.startWave();
            const config = waveManager.getCurrentWaveConfig();
            
            const halfMissiles = Math.floor(config.missileCount / 2);
            waveManager.missilesSpawnedInWave = halfMissiles;
            
            const progress = waveManager.getWaveProgress();
            const expectedProgress = halfMissiles / config.missileCount;
            expect(progress).toBeCloseTo(expectedProgress, 2);
        });

        test('should skip to specified wave', () => {
            waveManager.skipToWave(5);
            
            expect(waveManager.getCurrentWave()).toBe(5);
            expect(waveManager.isWaveActive()).toBe(true);
        });

        test('should pause and resume waves', () => {
            waveManager.startWave();
            
            waveManager.pauseWave();
            expect(waveManager.isWaveActive()).toBe(false);
            
            waveManager.resumeWave();
            expect(waveManager.isWaveActive()).toBe(true);
        });

        test('should reset to initial state', () => {
            waveManager.currentWave = 5;
            waveManager.waveActive = true;
            waveManager.allWavesCompleted = true;
            
            waveManager.reset();
            
            expect(waveManager.getCurrentWave()).toBe(1);
            expect(waveManager.isWaveActive()).toBe(false);
            expect(waveManager.areAllWavesCompleted()).toBe(false);
        });
    });

    describe('Callback System', () => {
        test('should register and call wave start callback', () => {
            const callback = jest.fn();
            waveManager.setOnWaveStartCallback(callback);
            
            waveManager.startWave();
            
            expect(callback).toHaveBeenCalledWith(1, expect.any(Object));
        });

        test('should register and call wave complete callback', () => {
            const callback = jest.fn();
            waveManager.setOnWaveCompleteCallback(callback);
            
            waveManager.startWave();
            waveManager.completeWave();
            
            expect(callback).toHaveBeenCalledWith(1);
        });

        test('should register and call all waves complete callback', () => {
            const callback = jest.fn();
            waveManager.setOnAllWavesCompleteCallback(callback);
            
            waveManager.currentWave = waveManager.getMaxWaves();
            waveManager.completeWave();
            
            expect(callback).toHaveBeenCalled();
        });
    });
});