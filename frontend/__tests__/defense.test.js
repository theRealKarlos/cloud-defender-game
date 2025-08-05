/**
 * Defense Class Tests
 *
 * The Defense class represents countermeasure systems that intercept threats.
 * These tests validate defense-specific functionality including:
 * - Different defense type properties and capabilities
 * - Targeting algorithms and range detection
 * - Cooldown and charging mechanics
 * - Projectile creation and firing systems
 */

const { setupGlobalMocks, mockCanvas } = require('./test-utils');
const { Defense, DefenseProjectile } = require('../js/defense.js');

// Setup global mocks before tests
setupGlobalMocks();

describe('Defense Class', () => {
  let defense;

  beforeEach(() => {
    defense = new Defense('firewall', 100, 200);
  });

  describe('Initialisation', () => {
    /**
     * Validates that defenses initialise with correct type properties.
     * Each defense type should have appropriate range, damage, and cooldown values.
     */
    test('should initialise with correct defense type properties', () => {
      expect(defense.type).toBe('firewall');
      expect(defense.x).toBe(100);
      expect(defense.y).toBe(200);
      expect(defense.collisionLayer).toBe('defences');
      expect(defense.range).toBe(80); // Firewall range
      expect(defense.damage).toBe(30); // Firewall damage
      expect(defense.cooldownTime).toBe(1.0); // Firewall cooldown
      expect(defense.colour).toBe('#FF6B35'); // Firewall colour
      expect(defense.defenseIcon).toBe('SHIELD');
      expect(defense.displayName).toBe('Firewall');
      expect(defense.targetingMode).toBe('nearest');
      expect(defense.isActive).toBe(true);
      expect(defense.isDeployed).toBe(true);
    });

    /**
     * Tests that different defense types have appropriate properties.
     * Critical for game balance and strategic variety.
     */
    test('should set correct properties for different defense types', () => {
      const firewall = new Defense('firewall', 0, 0);
      const antivirus = new Defense('antivirus', 0, 0);
      const monitoring = new Defense('monitoring', 0, 0);
      const backup = new Defense('backup', 0, 0);

      // Range differences
      expect(firewall.range).toBe(80);
      expect(antivirus.range).toBe(60);
      expect(monitoring.range).toBe(120);
      expect(backup.range).toBe(40);

      // Damage differences
      expect(firewall.damage).toBe(30);
      expect(antivirus.damage).toBe(40);
      expect(monitoring.damage).toBe(15);
      expect(backup.damage).toBe(50);

      // Cooldown differences
      expect(firewall.cooldownTime).toBe(1.0);
      expect(antivirus.cooldownTime).toBe(1.5);
      expect(monitoring.cooldownTime).toBe(0.5);
      expect(backup.cooldownTime).toBe(3.0);

      // Targeting mode differences
      expect(firewall.targetingMode).toBe('nearest');
      expect(antivirus.targetingMode).toBe('strongest');
      expect(monitoring.targetingMode).toBe('all');
      expect(backup.targetingMode).toBe('strongest');
    });

    /**
     * Tests shield node specific properties.
     * Shield nodes have unique energy mechanics.
     */
    test('should handle shield node specific properties', () => {
      const shieldNode = new Defense('shield-node', 0, 0);

      expect(shieldNode.isShieldNode).toBe(true);
      expect(shieldNode.shieldEnergy).toBe(100);
      expect(shieldNode.maxShieldEnergy).toBe(100);

      const regularDefense = new Defense('firewall', 0, 0);
      expect(regularDefense.isShieldNode).toBe(false);
      expect(regularDefense.shieldEnergy).toBe(0);
    });

    /**
     * Tests that unknown defense types fall back to default values.
     * Prevents crashes when invalid defense types are used.
     */
    test('should handle unknown defense types with defaults', () => {
      const unknownDefense = new Defense('unknown-defense', 0, 0);

      expect(unknownDefense.range).toBe(80);
      expect(unknownDefense.damage).toBe(30);
      expect(unknownDefense.cooldownTime).toBe(1.0);
      expect(unknownDefense.colour).toBe('#888888');
      expect(unknownDefense.defenseIcon).toBe('?');
      expect(unknownDefense.displayName).toBe('Unknown Defense');
      expect(unknownDefense.targetingMode).toBe('nearest');
    });
  });

  describe('Target Detection', () => {
    /**
     * Tests finding targets within range.
     * Core mechanic for defense systems to identify threats.
     */
    test('should find targets within range', () => {
      const mockMissile1 = {
        collisionLayer: 'missiles',
        active: true,
        x: 120,
        y: 220,
        width: 16,
        height: 20,
        damage: 25,
        velocityX: 50,
        velocityY: 30,
        type: 'cost-spike',
        getBounds: () => ({ centerX: 128, centerY: 230 }),
      };

      const mockMissile2 = {
        collisionLayer: 'missiles',
        active: true,
        x: 300,
        y: 400,
        width: 16,
        height: 20,
        damage: 30,
        velocityX: 40,
        velocityY: 20,
        type: 'data-breach',
        getBounds: () => ({ centerX: 308, centerY: 410 }),
      };

      // Mock distanceTo method
      defense.distanceTo = jest
        .fn()
        .mockReturnValueOnce(30) // missile1 in range
        .mockReturnValueOnce(200); // missile2 out of range

      const entities = [mockMissile1, mockMissile2];
      const targets = defense.findTargetsInRange(entities);

      expect(targets).toHaveLength(1);
      expect(targets[0].entity).toBe(mockMissile1);
      expect(targets[0].distance).toBe(30);
      expect(targets[0].threat).toBeGreaterThan(0);
    });

    /**
     * Tests that inactive missiles are ignored.
     * Only active threats should be targeted.
     */
    test('should ignore inactive missiles', () => {
      const mockMissile = {
        collisionLayer: 'missiles',
        active: false,
        x: 120,
        y: 220,
        width: 16,
        height: 20,
        getBounds: () => ({ centerX: 128, centerY: 230 }),
      };

      defense.distanceTo = jest.fn().mockReturnValue(30);

      const entities = [mockMissile];
      const targets = defense.findTargetsInRange(entities);

      expect(targets).toHaveLength(0);
    });

    /**
     * Tests that non-missile entities are ignored.
     * Defenses should only target missiles.
     */
    test('should ignore non-missile entities', () => {
      const mockTarget = {
        collisionLayer: 'targets',
        active: true,
        x: 120,
        y: 220,
        width: 48,
        height: 48,
        getBounds: () => ({ centerX: 144, centerY: 244 }),
      };

      defense.distanceTo = jest.fn().mockReturnValue(30);

      const entities = [mockTarget];
      const targets = defense.findTargetsInRange(entities);

      expect(targets).toHaveLength(0);
    });
  });

  describe('Threat Level Calculation', () => {
    /**
     * Tests threat level calculation based on missile properties.
     * Used for intelligent targeting decisions.
     */
    test('should calculate threat level based on missile properties', () => {
      const mockMissile = {
        damage: 30,
        velocityX: 100,
        velocityY: 50,
        type: 'data-breach',
      };

      const threatLevel = defense.calculateThreatLevel(mockMissile);

      // Should factor in damage, speed, and type multiplier
      expect(threatLevel).toBeGreaterThan(30); // Base damage
      expect(threatLevel).toBeGreaterThan(40); // With speed and type bonus
    });

    /**
     * Tests threat level with different missile types.
     * Different threat types should have different priority levels.
     */
    test('should apply type multipliers to threat calculation', () => {
      const baseMissile = {
        damage: 30,
        velocityX: 50,
        velocityY: 50,
        type: 'cost-spike',
      };

      const highPriorityMissile = {
        ...baseMissile,
        type: 'data-breach',
      };

      const lowPriorityMissile = {
        ...baseMissile,
        type: 'latency-ghost',
      };

      const baseThreat = defense.calculateThreatLevel(baseMissile);
      const highThreat = defense.calculateThreatLevel(highPriorityMissile);
      const lowThreat = defense.calculateThreatLevel(lowPriorityMissile);

      expect(highThreat).toBeGreaterThan(baseThreat);
      expect(lowThreat).toBeLessThan(baseThreat);
    });
  });

  describe('Target Selection', () => {
    let mockTargets;

    beforeEach(() => {
      mockTargets = [
        {
          entity: { id: 'missile1', velocityX: 50, velocityY: 30 },
          distance: 50,
          threat: 40,
        },
        {
          entity: { id: 'missile2', velocityX: 80, velocityY: 60 },
          distance: 30,
          threat: 60,
        },
        {
          entity: { id: 'missile3', velocityX: 30, velocityY: 20 },
          distance: 70,
          threat: 30,
        },
      ];
    });

    /**
     * Tests nearest target selection mode.
     * Should select the closest target.
     */
    test('should select nearest target', () => {
      defense.targetingMode = 'nearest';
      const target = defense.selectTarget(mockTargets);

      expect(target.id).toBe('missile2'); // Closest at distance 30
    });

    /**
     * Tests strongest target selection mode.
     * Should select the highest threat target.
     */
    test('should select strongest target', () => {
      defense.targetingMode = 'strongest';
      const target = defense.selectTarget(mockTargets);

      expect(target.id).toBe('missile2'); // Highest threat at 60
    });

    /**
     * Tests fastest target selection mode.
     * Should select the target with highest speed.
     */
    test('should select fastest target', () => {
      defense.targetingMode = 'fastest';
      const target = defense.selectTarget(mockTargets);

      expect(target.id).toBe('missile2'); // Fastest with speed ~100
    });

    /**
     * Tests multiple target selection mode.
     * Should return array of multiple targets.
     */
    test('should select multiple targets', () => {
      defense.targetingMode = 'multiple';
      const targets = defense.selectTarget(mockTargets);

      expect(Array.isArray(targets)).toBe(true);
      expect(targets.length).toBeLessThanOrEqual(3);
      expect(targets[0].id).toBe('missile2'); // Nearest first
    });

    /**
     * Tests all targets selection mode.
     * Should return all available targets.
     */
    test('should select all targets', () => {
      defense.targetingMode = 'all';
      const targets = defense.selectTarget(mockTargets);

      expect(Array.isArray(targets)).toBe(true);
      expect(targets).toHaveLength(3);
    });

    /**
     * Tests target selection with empty target list.
     * Should return null when no targets available.
     */
    test('should return null when no targets available', () => {
      const target = defense.selectTarget([]);
      expect(target).toBeNull();
    });
  });

  describe('Firing Mechanics', () => {
    /**
     * Tests basic firing capability checks.
     * Defense must be active, deployed, and off cooldown to fire.
     */
    test('should check firing capability correctly', () => {
      expect(defense.canFire()).toBe(true);
      expect(defense.canStartCharging()).toBe(true);

      defense.isActive = false;
      expect(defense.canFire()).toBe(false);
      expect(defense.canStartCharging()).toBe(false);

      defense.isActive = true;
      defense.currentCooldown = 0.5;
      expect(defense.canFire()).toBe(false);
      expect(defense.canStartCharging()).toBe(false);

      defense.currentCooldown = 0;
      defense.isCharging = true;
      expect(defense.canFire()).toBe(true); // Can fire when charging is complete
      expect(defense.canStartCharging()).toBe(false); // But can't start new charge
    });

    /**
     * Tests shield node energy requirements.
     * Shield nodes need sufficient energy to fire.
     */
    test('should check shield energy for shield nodes', () => {
      const shieldNode = new Defense('shield-node', 0, 0);

      expect(shieldNode.canFire()).toBe(true);

      shieldNode.shieldEnergy = 10; // Below threshold
      expect(shieldNode.canFire()).toBe(false);
    });

    /**
     * Tests charging mechanism.
     * Defenses must charge before firing.
     */
    test('should handle charging mechanism', () => {
      expect(defense.startCharging()).toBe(true);
      expect(defense.isCharging).toBe(true);
      expect(defense.chargeTime).toBe(0);

      // Can't start charging if already charging
      expect(defense.startCharging()).toBe(false);
    });

    /**
     * Tests firing with insufficient charge time.
     * Should not fire until charge is complete.
     */
    test('should not fire until charge is complete', () => {
      const mockTarget = { x: 150, y: 250, width: 16, height: 20 };

      defense.startCharging();
      defense.chargeTime = defense.maxChargeTime / 2; // Half charged

      const projectile = defense.fire(mockTarget);
      expect(projectile).toBeNull();
    });

    /**
     * Tests successful firing after full charge.
     * Should create projectile and reset state.
     */
    test('should fire projectile when fully charged', () => {
      const mockTarget = { x: 150, y: 250, width: 16, height: 20 };

      defense.startCharging();
      defense.chargeTime = defense.maxChargeTime; // Fully charged

      const projectile = defense.fire(mockTarget);

      expect(projectile).toBeInstanceOf(DefenseProjectile);
      expect(defense.isCharging).toBe(false);
      expect(defense.chargeTime).toBe(0);
      expect(defense.currentCooldown).toBe(defense.cooldownTime);
      expect(defense.shotsfired).toBe(1);
    });

    /**
     * Tests shield energy consumption on firing.
     * Shield nodes should consume energy when firing.
     */
    test('should consume shield energy when firing', () => {
      const shieldNode = new Defense('shield-node', 0, 0);
      const mockTarget = { x: 50, y: 50, width: 16, height: 20 };

      const initialEnergy = shieldNode.shieldEnergy;

      shieldNode.startCharging();
      shieldNode.chargeTime = shieldNode.maxChargeTime;
      shieldNode.fire(mockTarget);

      expect(shieldNode.shieldEnergy).toBeLessThan(initialEnergy);
    });
  });

  describe('Cooldown and Charging Updates', () => {
    /**
     * Tests cooldown reduction over time.
     * Cooldown should decrease with each update.
     */
    test('should reduce cooldown over time', () => {
      defense.currentCooldown = 1.0;

      defense.updateCooldown(0.1);
      expect(defense.currentCooldown).toBe(0.9);

      defense.updateCooldown(1.0);
      expect(defense.currentCooldown).toBe(0); // Should not go below 0
    });

    /**
     * Tests charge time accumulation.
     * Charge time should increase when charging.
     */
    test('should accumulate charge time when charging', () => {
      defense.isCharging = true;
      defense.chargeTime = 0;

      defense.updateCharging(0.1);
      expect(defense.chargeTime).toBe(0.1);

      defense.isCharging = false;
      defense.updateCharging(0.1);
      expect(defense.chargeTime).toBe(0.1); // Should not increase when not charging
    });

    /**
     * Tests shield energy regeneration.
     * Shield nodes should regenerate energy over time.
     */
    test('should regenerate shield energy over time', () => {
      const shieldNode = new Defense('shield-node', 0, 0);
      shieldNode.shieldEnergy = 50;

      shieldNode.updateShieldEnergy(1.0); // 1 second

      expect(shieldNode.shieldEnergy).toBeGreaterThan(50);
      expect(shieldNode.shieldEnergy).toBeLessThanOrEqual(
        shieldNode.maxShieldEnergy
      );
    });

    /**
     * Tests complete update cycle.
     * All update methods should be called during onUpdate.
     */
    test('should update all systems during update cycle', () => {
      const cooldownSpy = jest.spyOn(defense, 'updateCooldown');
      const chargingSpy = jest.spyOn(defense, 'updateCharging');
      const shieldSpy = jest.spyOn(defense, 'updateShieldEnergy');
      const effectsSpy = jest.spyOn(defense, 'updateEffects');

      defense.onUpdate(0.1);

      expect(cooldownSpy).toHaveBeenCalledWith(0.1);
      expect(chargingSpy).toHaveBeenCalledWith(0.1);
      expect(shieldSpy).toHaveBeenCalledWith(0.1);
      expect(effectsSpy).toHaveBeenCalledWith(0.1);
    });
  });

  describe('Visual Rendering', () => {
    /**
     * Tests that rendering methods execute without errors.
     * Ensures visual components don't crash the game.
     */
    test('should render without errors', () => {
      const mockCtx = mockCanvas.getContext();

      expect(() => {
        defense.render(mockCtx);
      }).not.toThrow();

      // Test rendering different defense types
      const shieldNode = new Defense('shield-node', 0, 0);
      const monitoring = new Defense('monitoring', 0, 0);

      expect(() => {
        shieldNode.render(mockCtx);
        monitoring.render(mockCtx);
      }).not.toThrow();
    });

    /**
     * Tests range indicator visibility toggle.
     * Range indicators should be controllable.
     */
    test('should handle range indicator visibility', () => {
      expect(defense.rangeIndicatorVisible).toBe(false);

      defense.showRangeIndicator();
      expect(defense.rangeIndicatorVisible).toBe(true);

      defense.hideRangeIndicator();
      expect(defense.rangeIndicatorVisible).toBe(false);

      defense.toggleRangeIndicator();
      expect(defense.rangeIndicatorVisible).toBe(true);
    });

    /**
     * Tests rendering in different states.
     * Visual appearance should reflect defense state.
     */
    test('should render different states correctly', () => {
      const mockCtx = mockCanvas.getContext();

      // Test inactive state
      defense.isActive = false;
      expect(() => defense.render(mockCtx)).not.toThrow();

      // Test cooldown state
      defense.isActive = true;
      defense.currentCooldown = 0.5;
      expect(() => defense.render(mockCtx)).not.toThrow();

      // Test charging state
      defense.currentCooldown = 0;
      defense.isCharging = true;
      expect(() => defense.render(mockCtx)).not.toThrow();
    });
  });

  describe('State Management', () => {
    /**
     * Tests activation and deactivation.
     * Defense state should be controllable.
     */
    test('should handle activation and deactivation', () => {
      defense.deactivate();
      expect(defense.isActive).toBe(false);
      expect(defense.isCharging).toBe(false);
      expect(defense.currentTarget).toBeNull();

      defense.activate();
      expect(defense.isActive).toBe(true);
    });

    /**
     * Tests statistics tracking.
     * Defense should track performance metrics.
     */
    test('should track performance statistics', () => {
      defense.shotsfired = 10;
      defense.hits = 7;
      defense.threatsDestroyed = 5;

      expect(defense.getEfficiency()).toBe(0.7);

      const stats = defense.getStats();
      expect(stats.shotsfired).toBe(10);
      expect(stats.hits).toBe(7);
      expect(stats.threatsDestroyed).toBe(5);
      expect(stats.efficiency).toBe(0.7);
    });

    /**
     * Tests efficiency calculation with no shots.
     * Should handle division by zero gracefully.
     */
    test('should handle efficiency calculation with no shots', () => {
      defense.shotsfired = 0;
      defense.hits = 0;

      expect(defense.getEfficiency()).toBe(0);
    });
  });

  describe('Factory Methods', () => {
    /**
     * Tests static factory methods for creating specific defense types.
     * Provides convenient API for game logic to create typed defenses.
     */
    test('should create specific defense types via factory methods', () => {
      const firewall = Defense.createFirewall(10, 20);
      const antivirus = Defense.createAntivirus(30, 40);
      const waf = Defense.createWAF(50, 60);
      const ddos = Defense.createDDoSProtection(70, 80);

      expect(firewall.type).toBe('firewall');
      expect(firewall.x).toBe(10);
      expect(firewall.y).toBe(20);

      expect(antivirus.type).toBe('antivirus');
      expect(waf.type).toBe('waf');
      expect(ddos.type).toBe('ddos-protection');
    });

    /**
     * Tests that all factory methods create properly initialised defenses.
     * Ensures factory methods don't skip important initialisation steps.
     */
    test('should create fully initialised defenses from factory methods', () => {
      const defenses = [
        Defense.createEncryption(0, 0),
        Defense.createMonitoring(0, 0),
        Defense.createBackup(0, 0),
        Defense.createShieldNode(0, 0),
      ];

      defenses.forEach((defense) => {
        expect(defense.collisionLayer).toBe('defences');
        expect(defense.range).toBeGreaterThan(0);
        expect(defense.damage).toBeGreaterThan(0);
        expect(defense.cooldownTime).toBeGreaterThan(0);
        expect(defense.isActive).toBe(true);
        expect(defense.isDeployed).toBe(true);
        expect(defense.defenseIcon).toBeDefined();
        expect(defense.displayName).toBeDefined();
      });
    });
  });
});

describe('DefenseProjectile Class', () => {
  let projectile;
  let mockDefense;

  beforeEach(() => {
    mockDefense = {
      colour: '#FF6B35',
      hits: 0,
      threatsDestroyed: 0,
    };

    projectile = new DefenseProjectile(
      'firewall',
      50,
      100, // start position
      150,
      200, // target position
      30, // damage
      300, // speed
      mockDefense // source defense
    );
  });

  describe('Initialisation', () => {
    /**
     * Tests projectile initialisation with correct properties.
     * Projectiles should be properly configured for their mission.
     */
    test('should initialise with correct properties', () => {
      expect(projectile.defenseType).toBe('firewall');
      expect(projectile.targetX).toBe(150);
      expect(projectile.targetY).toBe(200);
      expect(projectile.damage).toBe(30);
      expect(projectile.speed).toBe(300);
      expect(projectile.sourceDefense).toBe(mockDefense);
      expect(projectile.collisionLayer).toBe('defences');
      expect(projectile.colour).toBe('#FF6B35');
    });

    /**
     * Tests trajectory calculation for movement.
     * Projectiles should move towards their target.
     */
    test('should calculate trajectory towards target', () => {
      const dx = 150 - 50; // 100
      const dy = 200 - 100; // 100
      const distance = Math.sqrt(dx * dx + dy * dy); // ~141.42

      const expectedVelX = (dx / distance) * 300;
      const expectedVelY = (dy / distance) * 300;

      expect(projectile.velocityX).toBeCloseTo(expectedVelX, 1);
      expect(projectile.velocityY).toBeCloseTo(expectedVelY, 1);
    });

    /**
     * Tests rotation calculation based on movement direction.
     * Projectiles should face the direction they're moving.
     */
    test('should set rotation based on movement direction', () => {
      const expectedRotation = Math.atan2(
        projectile.velocityY,
        projectile.velocityX
      );
      expect(projectile.rotation).toBeCloseTo(expectedRotation, 5);
    });
  });

  describe('Lifecycle Management', () => {
    /**
     * Tests projectile destruction when reaching target.
     * Projectiles should be destroyed when they reach their destination.
     */
    test('should be destroyed when reaching target area', () => {
      const destroySpy = jest.spyOn(projectile, 'destroy');

      // Position projectile near target
      projectile.x = 148;
      projectile.y = 198;

      projectile.onUpdate(0.1);

      expect(destroySpy).toHaveBeenCalled();
    });

    /**
     * Tests projectile destruction after maximum lifetime.
     * Prevents projectiles from existing indefinitely.
     */
    test('should be destroyed after maximum lifetime', () => {
      const destroySpy = jest.spyOn(projectile, 'destroy');

      projectile.age = projectile.maxLifetime + 1;
      projectile.onUpdate(0.1);

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('Collision Handling', () => {
    /**
     * Tests collision with missile entities.
     * Projectiles should damage and destroy missiles on impact.
     */
    test('should handle collision with missiles', () => {
      const mockMissile = {
        collisionLayer: 'missiles',
        takeDamage: jest.fn().mockReturnValue(false),
        destroy: jest.fn(),
        markedForDestruction: false,
      };

      const destroySpy = jest.spyOn(projectile, 'destroy');

      projectile.onCollision(mockMissile);

      expect(mockMissile.takeDamage).toHaveBeenCalledWith(30);
      expect(mockDefense.hits).toBe(1);
      expect(destroySpy).toHaveBeenCalled();
    });

    /**
     * Tests collision with destroyed missile.
     * Should update threat destruction statistics.
     */
    test('should update statistics when destroying threats', () => {
      const mockMissile = {
        collisionLayer: 'missiles',
        takeDamage: jest.fn(),
        destroy: jest.fn(),
        markedForDestruction: true,
      };

      projectile.onCollision(mockMissile);

      expect(mockDefense.hits).toBe(1);
      expect(mockDefense.threatsDestroyed).toBe(1);
    });

    /**
     * Tests collision with missile without takeDamage method.
     * Should fall back to destroy method.
     */
    test('should handle missiles without takeDamage method', () => {
      const mockMissile = {
        collisionLayer: 'missiles',
        destroy: jest.fn(),
        markedForDestruction: true,
      };

      projectile.onCollision(mockMissile);

      expect(mockMissile.destroy).toHaveBeenCalled();
      expect(mockDefense.hits).toBe(1);
    });

    /**
     * Tests that non-missile collisions are ignored.
     * Projectiles should only affect missiles.
     */
    test('should ignore collisions with non-missiles', () => {
      const mockTarget = {
        collisionLayer: 'targets',
        destroy: jest.fn(),
      };

      const destroySpy = jest.spyOn(projectile, 'destroy');

      projectile.onCollision(mockTarget);

      expect(mockTarget.destroy).not.toHaveBeenCalled();
      expect(destroySpy).not.toHaveBeenCalled();
      expect(mockDefense.hits).toBe(0);
    });
  });

  describe('Visual Rendering', () => {
    /**
     * Tests that projectile rendering executes without errors.
     * Ensures visual components don't crash the game.
     */
    test('should render without errors', () => {
      const mockCtx = mockCanvas.getContext();

      expect(() => {
        projectile.render(mockCtx);
      }).not.toThrow();
    });
  });
});
