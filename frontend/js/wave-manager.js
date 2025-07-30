/**
 * Wave Manager - Controls wave-based gameplay progression
 * Manages missile spawning patterns, difficulty scaling, and wave transitions
 */

// Import required classes
let Missile, Target;
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (testing)
    const missileModule = require('./missile.js');
    const targetModule = require('./target.js');
    Missile = missileModule.Missile;
    Target = targetModule.Target;
} else {
    // Browser environment - classes are available globally
    Missile = window.Missile;
    Target = window.Target;
}

class WaveManager {
    constructor(entityManager, canvasWidth, canvasHeight) {
        this.entityManager = entityManager;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Wave state
        this.currentWave = 1;
        this.maxWaves = 15;
        this.waveActive = false;
        this.waveCompleted = false;
        this.allWavesCompleted = false;
        
        // Timing
        this.timeBetweenWaves = 3.0; // 3 seconds between waves
        this.waveTransitionTimer = 0;
        this.isInTransition = false;
        
        // Missile spawning
        this.missilesInCurrentWave = 0;
        this.missilesSpawnedInWave = 0;
        this.missileSpawnTimer = 0;
        this.missileSpawnInterval = 1.5; // Base interval between missiles
        
        // Wave configuration
        this.waveConfigs = this.generateWaveConfigurations();
        
        // Callbacks
        this.onWaveStartCallback = null;
        this.onWaveCompleteCallback = null;
        this.onAllWavesCompleteCallback = null;
        
        console.log('WaveManager initialised');
    }
    
    generateWaveConfigurations() {
        const configs = [];
        
        for (let wave = 1; wave <= this.maxWaves; wave++) {
            const config = {
                waveNumber: wave,
                missileCount: this.calculateMissileCount(wave),
                spawnInterval: this.calculateSpawnInterval(wave),
                missileTypes: this.getMissileTypesForWave(wave),
                difficultyMultiplier: this.calculateDifficultyMultiplier(wave),
                specialEvents: this.getSpecialEventsForWave(wave)
            };
            configs.push(config);
        }
        
        return configs;
    }
    
    calculateMissileCount(wave) {
        // Progressive increase: starts at 5, increases by 2-3 per wave
        const baseCount = 5;
        const increment = Math.floor(wave / 2) + 1;
        const randomVariation = Math.floor(Math.random() * 3); // 0-2 random missiles
        
        return Math.min(baseCount + (wave - 1) * increment + randomVariation, 50);
    }
    
    calculateSpawnInterval(wave) {
        // Decreasing interval: starts at 1.5s, decreases to minimum 0.3s
        const baseInterval = 1.5;
        const reduction = (wave - 1) * 0.08;
        const minInterval = 0.3;
        
        return Math.max(baseInterval - reduction, minInterval);
    }
    
    getMissileTypesForWave(wave) {
        // Introduce new missile types progressively
        const allTypes = ['cost-spike', 'data-breach', 'latency-ghost', 'policy-violator'];
        
        if (wave <= 2) {
            return ['cost-spike']; // Only cost spikes in early waves
        } else if (wave <= 5) {
            return ['cost-spike', 'data-breach']; // Add data breaches
        } else if (wave <= 8) {
            return ['cost-spike', 'data-breach', 'latency-ghost']; // Add latency ghosts
        } else {
            return allTypes; // All types from wave 9 onwards
        }
    }
    
    calculateDifficultyMultiplier(wave) {
        // Gradual difficulty increase
        return 1.0 + (wave - 1) * 0.1; // 10% increase per wave
    }
    
    getSpecialEventsForWave(wave) {
        const events = [];
        
        // Boss waves every 5 waves
        if (wave % 5 === 0) {
            events.push('boss_wave');
        }
        
        // Speed burst waves
        if (wave % 3 === 0 && wave > 3) {
            events.push('speed_burst');
        }
        
        // Multi-spawn waves
        if (wave % 4 === 0 && wave > 4) {
            events.push('multi_spawn');
        }
        
        return events;
    }
    
    startWave(waveNumber = null) {
        if (waveNumber !== null) {
            this.currentWave = waveNumber;
        }
        
        if (this.currentWave > this.maxWaves) {
            this.completeAllWaves();
            return;
        }
        
        const config = this.waveConfigs[this.currentWave - 1];
        
        this.waveActive = true;
        this.waveCompleted = false;
        this.isInTransition = false;
        this.missilesInCurrentWave = config.missileCount;
        this.missilesSpawnedInWave = 0;
        this.missileSpawnTimer = 0;
        this.missileSpawnInterval = config.spawnInterval;
        
        console.log(`Starting Wave ${this.currentWave}: ${config.missileCount} missiles, ${config.spawnInterval}s interval`);
        
        // Trigger callback
        if (this.onWaveStartCallback) {
            this.onWaveStartCallback(this.currentWave, config);
        }
    }
    
    update(deltaTime) {
        if (this.allWavesCompleted) {
            return;
        }
        
        if (this.isInTransition) {
            this.updateWaveTransition(deltaTime);
        } else if (this.waveActive) {
            this.updateActiveWave(deltaTime);
        }
    }
    
    updateWaveTransition(deltaTime) {
        this.waveTransitionTimer -= deltaTime;
        
        if (this.waveTransitionTimer <= 0) {
            this.currentWave++;
            this.startWave();
        }
    }
    
    updateActiveWave(deltaTime) {
        const config = this.waveConfigs[this.currentWave - 1];
        
        // Update missile spawning
        if (this.missilesSpawnedInWave < this.missilesInCurrentWave) {
            this.missileSpawnTimer -= deltaTime;
            
            if (this.missileSpawnTimer <= 0) {
                this.spawnMissile(config);
                this.missileSpawnTimer = this.missileSpawnInterval;
                
                // Apply special events
                this.applySpecialEvents(config, deltaTime);
            }
        }
        
        // Check if wave is complete
        if (this.missilesSpawnedInWave >= this.missilesInCurrentWave) {
            const activeMissiles = this.entityManager.getEntitiesByLayer('missiles');
            
            if (activeMissiles.length === 0) {
                this.completeWave();
            }
        }
    }
    
    spawnMissile(config) {
        // Select missile type based on wave configuration
        const availableTypes = config.missileTypes;
        const missileType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        
        // Get spawn position (top of screen, random X)
        const spawnX = Math.random() * (this.canvasWidth - 50) + 25;
        const spawnY = -30;
        
        // Select random target
        const targets = this.entityManager.getEntitiesByLayer('targets');
        if (targets.length === 0) {
            console.warn('No targets available for missile spawning');
            return;
        }
        
        const randomTarget = targets[Math.floor(Math.random() * targets.length)];
        const targetX = randomTarget.x + randomTarget.width / 2;
        const targetY = randomTarget.y + randomTarget.height / 2;
        
        // Create missile
        const missile = new Missile(missileType, spawnX, spawnY, targetX, targetY);
        
        // Apply difficulty scaling
        missile.speed *= config.difficultyMultiplier;
        missile.damage = Math.floor(missile.damage * config.difficultyMultiplier);
        
        // Add to entity manager
        this.entityManager.addEntity(missile, 'missiles');
        this.missilesSpawnedInWave++;
        
        console.log(`Spawned ${missileType} missile (${this.missilesSpawnedInWave}/${this.missilesInCurrentWave})`);
    }
    
    applySpecialEvents(config, deltaTime) {
        config.specialEvents.forEach(event => {
            switch (event) {
                case 'boss_wave':
                    this.applyBossWaveEvent();
                    break;
                case 'speed_burst':
                    this.applySpeedBurstEvent();
                    break;
                case 'multi_spawn':
                    this.applyMultiSpawnEvent(config);
                    break;
            }
        });
    }
    
    applyBossWaveEvent() {
        // Boss waves spawn larger, more powerful missiles
        const activeMissiles = this.entityManager.getEntitiesByLayer('missiles');
        activeMissiles.forEach(missile => {
            if (Math.random() < 0.3) { // 30% chance to become "boss" missile
                missile.scale = 1.5;
                missile.damage *= 2;
                missile.maxHealth = 2; // Requires 2 hits to destroy
                missile.colour = '#FF0000'; // Red colour for boss missiles
            }
        });
    }
    
    applySpeedBurstEvent() {
        // Temporarily increase spawn rate
        if (Math.random() < 0.1) { // 10% chance per frame during speed burst
            this.missileSpawnTimer = Math.min(this.missileSpawnTimer, 0.2);
        }
    }
    
    applyMultiSpawnEvent(config) {
        // Occasionally spawn multiple missiles at once
        if (Math.random() < 0.05 && this.missilesSpawnedInWave < this.missilesInCurrentWave - 1) {
            this.spawnMissile(config);
        }
    }
    
    completeWave() {
        if (this.waveCompleted) return;
        
        this.waveActive = false;
        this.waveCompleted = true;
        
        console.log(`Wave ${this.currentWave} completed!`);
        
        // Trigger callback
        if (this.onWaveCompleteCallback) {
            this.onWaveCompleteCallback(this.currentWave);
        }
        
        // Check if all waves are complete
        if (this.currentWave >= this.maxWaves) {
            this.completeAllWaves();
        } else {
            // Start transition to next wave
            this.isInTransition = true;
            this.waveTransitionTimer = this.timeBetweenWaves;
        }
    }
    
    completeAllWaves() {
        this.allWavesCompleted = true;
        this.waveActive = false;
        
        console.log('All waves completed! Victory!');
        
        // Trigger callback
        if (this.onAllWavesCompleteCallback) {
            this.onAllWavesCompleteCallback();
        }
    }
    
    // Getters for game state
    getCurrentWave() {
        return this.currentWave;
    }
    
    getMaxWaves() {
        return this.maxWaves;
    }
    
    isWaveActive() {
        return this.waveActive;
    }
    
    isWaveCompleted() {
        return this.waveCompleted;
    }
    
    areAllWavesCompleted() {
        return this.allWavesCompleted;
    }
    
    isInWaveTransition() {
        return this.isInTransition;
    }
    
    getWaveProgress() {
        if (!this.waveActive) return 1.0;
        
        return this.missilesSpawnedInWave / this.missilesInCurrentWave;
    }
    
    getTransitionTimeRemaining() {
        return Math.max(0, this.waveTransitionTimer);
    }
    
    getCurrentWaveConfig() {
        if (this.currentWave <= 0 || this.currentWave > this.maxWaves) {
            return null;
        }
        return this.waveConfigs[this.currentWave - 1];
    }
    
    // Callback registration
    setOnWaveStartCallback(callback) {
        this.onWaveStartCallback = callback;
    }
    
    setOnWaveCompleteCallback(callback) {
        this.onWaveCompleteCallback = callback;
    }
    
    setOnAllWavesCompleteCallback(callback) {
        this.onAllWavesCompleteCallback = callback;
    }
    
    // Manual control methods (for testing or special game modes)
    skipToWave(waveNumber) {
        if (waveNumber >= 1 && waveNumber <= this.maxWaves) {
            this.currentWave = waveNumber;
            this.startWave();
        }
    }
    
    pauseWave() {
        this.waveActive = false;
    }
    
    resumeWave() {
        if (!this.waveCompleted && !this.allWavesCompleted) {
            this.waveActive = true;
        }
    }
    
    reset() {
        this.currentWave = 1;
        this.waveActive = false;
        this.waveCompleted = false;
        this.allWavesCompleted = false;
        this.isInTransition = false;
        this.waveTransitionTimer = 0;
        this.missilesInCurrentWave = 0;
        this.missilesSpawnedInWave = 0;
        this.missileSpawnTimer = 0;
        
        console.log('WaveManager reset');
    }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WaveManager };
} else {
    // Browser global
    window.WaveManager = WaveManager;
}