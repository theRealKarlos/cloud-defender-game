/**
 * Missile Class Tests
 *
 * The Missile class represents various threat types targeting AWS infrastructure.
 * These tests validate missile-specific functionality including:
 * - Different threat type properties and behaviours
 * - Movement algorithms and trajectory calculations
 * - Collision detection and interception handling
 * - Visual effects and trail rendering
 */

const { setupGlobalMocks, mockCanvas } = require('./test-utils');
const { Missile } = require('../js/missile.js');

// Setup global mocks before tests
setupGlobalMocks();

describe('Missile Class', () => {
  let missile;
  const startX = 50;
  const startY = 100;
  const targetX = 200;
  const targetY = 300;

  beforeEach(() => {
    missile = new Missile('cost-spike', startX, startY, targetX, targetY);
  });

  describe('Initialisation', () => {
    /**
     * Validates that missiles initialise with correct threat type properties.
     * Each threat type should have appropriate speed, damage, and visual properties.
     */
    test('should initialise with correct threat type properties', () => {
      expect(missile.type).toBe('cost-spike');
      expect(missile.x).toBe(startX);
      expect(missile.y).toBe(startY);
      expect(missile.targetX).toBe(targetX);
      expect(missile.targetY).toBe(targetY);
      expect(missile.collisionLayer).toBe('missiles');
      expect(missile.speed).toBe(120); // Cost spike speed
      expect(missile.damage).toBe(35); // Cost spike damage
      expect(missile.colour).toBe('#FF6B35'); // Cost spike colour
      expect(missile.threatIcon).toBe('$');
      expect(missile.displayName).toBe('Cost Spike');
      expect(missile.movementType).toBe('direct');
    });

    /**
     * Tests that different threat types have appropriate properties.
     * Critical for game balance and visual distinction between threats.
     */
    test('should set correct properties for different threat types', () => {
      const costSpike = new Missile('cost-spike', 0, 0, 100, 100);
      const dataBreach = new Missile('data-breach', 0, 0, 100, 100);
      const latencyGhost = new Missile('latency-ghost', 0, 0, 100, 100);
      const policyViolator = new Missile('policy-violator', 0, 0, 100, 100);

      // Speed differences
      expect(costSpike.speed).toBe(120);
      expect(dataBreach.speed).toBe(80);
      expect(latencyGhost.speed).toBe(200);
      expect(policyViolator.speed).toBe(60);

      // Damage differences
      expect(costSpike.damage).toBe(35);
      expect(dataBreach.damage).toBe(50);
      expect(latencyGhost.damage).toBe(20);
      expect(policyViolator.damage).toBe(40);

      // Movement type differences
      expect(costSpike.movementType).toBe('direct');
      expect(dataBreach.movementType).toBe('seeking');
      expect(latencyGhost.movementType).toBe('erratic');
      expect(policyViolator.movementType).toBe('slow');
    });

    /**
     * Tests that unknown threat types fall back to default values.
     * Prevents crashes when invalid threat types are used.
     */
    test('should handle unknown threat types with defaults', () => {
      const unknownMissile = new Missile('unknown-threat', 0, 0, 100, 100);

      expect(unknownMissile.speed).toBe(100);
      expect(unknownMissile.damage).toBe(25);
      expect(unknownMissile.colour).toBe('#FF4444');
      expect(unknownMissile.threatIcon).toBe('?');
      expect(unknownMissile.displayName).toBe('Unknown Threat');
      expect(unknownMissile.movementType).toBe('direct');
    });

    /**
     * Tests trajectory calculation for initial movement direction.
     * Critical for missiles moving towards their intended targets.
     */
    test('should calculate correct initial trajectory', () => {
      const trajectory = missile.trajectory;

      // Expected direction vector (normalized)
      const dx = targetX - startX;
      const dy = targetY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      expect(trajectory.directionX).toBeCloseTo(dx / distance, 5);
      expect(trajectory.directionY).toBeCloseTo(dy / distance, 5);
      expect(trajectory.distance).toBeCloseTo(distance, 5);
      expect(trajectory.originalDistance).toBeCloseTo(distance, 5);
    });

    /**
     * Tests that initial velocity is set correctly based on trajectory.
     * Ensures missiles start moving in the right direction at the right speed.
     */
    test('should set initial velocity based on trajectory and speed', () => {
      // Missiles are 20% faster than base speed (fastSpeed = speed * 1.2)
      const fastSpeed = missile.speed * 1.2;
      const expectedVelX = missile.trajectory.directionX * fastSpeed;
      const expectedVelY = missile.trajectory.directionY * fastSpeed;

      expect(missile.velocityX).toBeCloseTo(expectedVelX, 1);
      expect(missile.velocityY).toBeCloseTo(expectedVelY, 1);
    });
  });

  describe('Movement Algorithms', () => {
    /**
     * Tests direct movement maintains consistent trajectory.
     * Cost spikes should move in straight lines to targets.
     */
    test('should maintain direct movement trajectory', () => {
      const initialVelX = missile.velocityX;
      const initialVelY = missile.velocityY;

      missile.updateMovement(0.1);

      // Direct movement should maintain velocity direction (allowing for acceleration)
      const velRatio = missile.velocityX / initialVelX;
      expect(missile.velocityY / initialVelY).toBeCloseTo(velRatio, 2);
    });

    /**
     * Tests seeking movement adjusts course towards target.
     * Data breach missiles should home in on targets.
     */
    test('should adjust course with seeking movement', () => {
      const seekingMissile = new Missile('data-breach', 0, 0, 100, 0);

      // Move missile off course
      seekingMissile.x = 50;
      seekingMissile.y = 50;
      seekingMissile.velocityX = 0;
      seekingMissile.velocityY = 100; // Moving perpendicular to target

      seekingMissile.updateMovement(0.5); // Longer time for noticeable effect

      // Should have adjusted velocity towards target
      expect(seekingMissile.velocityX).toBeGreaterThan(0); // Should move towards target X
      expect(Math.abs(seekingMissile.velocityY)).toBeLessThan(100); // Should reduce Y velocity
    });

    /**
     * Tests erratic movement adds randomness.
     * Latency ghosts should have unpredictable movement patterns.
     */
    test('should add randomness to erratic movement', () => {
      const erraticMissile = new Missile('latency-ghost', 0, 0, 100, 100);
      const initialVelX = erraticMissile.velocityX;
      const initialVelY = erraticMissile.velocityY;

      // Mock Math.random to ensure predictable test
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.7);

      erraticMissile.updateMovement(0.1);

      // Velocity should have changed due to randomness
      expect(erraticMissile.velocityX).not.toBeCloseTo(initialVelX, 1);
      expect(erraticMissile.velocityY).not.toBeCloseTo(initialVelY, 1);

      Math.random = originalRandom;
    });

    /**
     * Tests slow movement with occasional course corrections.
     * Policy violators should move steadily with minor adjustments.
     */
    test('should handle slow movement with corrections', () => {
      const slowMissile = new Missile('policy-violator', 0, 0, 100, 100);
      const initialVelX = slowMissile.velocityX;
      const initialVelY = slowMissile.velocityY;

      // Mock Math.random to trigger course correction
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.01); // Less than 0.05 threshold

      slowMissile.updateMovement(0.1);

      // Should have made slight course correction
      expect(Math.abs(slowMissile.velocityX - initialVelX)).toBeGreaterThan(0);
      expect(Math.abs(slowMissile.velocityY - initialVelY)).toBeGreaterThan(0);

      Math.random = originalRandom;
    });

    /**
     * Tests acceleration effects on missile speed.
     * Different missile types should accelerate or decelerate over time.
     */
    test('should apply acceleration based on missile type', () => {
      const costSpike = new Missile('cost-spike', 0, 0, 100, 100);
      const policyViolator = new Missile('policy-violator', 0, 0, 100, 100); // Use policy-violator instead (no wobble)

      const initialCostSpeed = Math.sqrt(
        costSpike.velocityX ** 2 + costSpike.velocityY ** 2
      );
      const initialPolicySpeed = Math.sqrt(
        policyViolator.velocityX ** 2 + policyViolator.velocityY ** 2
      );

      // Mock Math.random to eliminate wobble randomness
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.5);

      costSpike.updateMovement(0.1);
      policyViolator.updateMovement(0.1);

      Math.random = originalRandom;

      const finalCostSpeed = Math.sqrt(
        costSpike.velocityX ** 2 + costSpike.velocityY ** 2
      );
      const finalPolicySpeed = Math.sqrt(
        policyViolator.velocityX ** 2 + policyViolator.velocityY ** 2
      );

      // Cost spike should accelerate (1.2x), policy violator should stay same (1.0x)
      expect(finalCostSpeed).toBeGreaterThan(initialCostSpeed);
      expect(finalPolicySpeed).toBeCloseTo(initialPolicySpeed, 1); // Should remain approximately the same
    });
  });

  describe('Target Detection', () => {
    /**
     * Tests target reached detection when missile is close to target.
     * Critical for determining when missiles impact targets.
     */
    test('should detect when target is reached', () => {
      // Position missile very close to target (accounting for missile center)
      // For cost-spike: center is at (x + 10, y + 14)
      // So to be within 10 pixels of target, position at (targetX - 10, targetY - 14)
      missile.x = targetX - 10;
      missile.y = targetY - 14;

      expect(missile.hasReachedTarget()).toBe(true);
    });

    /**
     * Tests that distant missiles don't trigger target reached.
     * Prevents premature target impacts.
     */
    test('should not detect target when far away', () => {
      expect(missile.hasReachedTarget()).toBe(false);
    });

    /**
     * Tests off-screen detection for cleanup.
     * Missiles that fly off-screen should be detected for removal.
     */
    test('should detect when missile is off screen', () => {
      const screenWidth = 800;
      const screenHeight = 600;

      // On screen
      missile.x = 100;
      missile.y = 100;
      expect(missile.isOffScreen(screenWidth, screenHeight)).toBe(false);

      // Off screen left
      missile.x = -100;
      expect(missile.isOffScreen(screenWidth, screenHeight)).toBe(true);

      // Off screen right
      missile.x = screenWidth + 100;
      expect(missile.isOffScreen(screenWidth, screenHeight)).toBe(true);

      // Off screen top
      missile.x = 100;
      missile.y = -100;
      expect(missile.isOffScreen(screenWidth, screenHeight)).toBe(true);

      // Off screen bottom
      missile.y = screenHeight + 100;
      expect(missile.isOffScreen(screenWidth, screenHeight)).toBe(true);
    });
  });

  describe('Trail Effects', () => {
    /**
     * Tests trail position tracking for visual effects.
     * Missiles should maintain a trail of previous positions.
     */
    test('should track trail positions', () => {
      expect(missile.trailPositions).toHaveLength(0);

      missile.updateTrail();
      expect(missile.trailPositions).toHaveLength(1);

      // Move missile and update trail
      missile.x = 60;
      missile.y = 110;
      missile.updateTrail();
      expect(missile.trailPositions).toHaveLength(2);
    });

    /**
     * Tests trail length limitation.
     * Trails should not grow indefinitely to prevent memory issues.
     */
    test('should limit trail length', () => {
      // Add more positions than max trail length
      for (let i = 0; i < missile.maxTrailLength + 5; i++) {
        missile.x = i * 10;
        missile.updateTrail();
      }

      expect(missile.trailPositions).toHaveLength(missile.maxTrailLength);
    });
  });

  describe('Lifecycle Management', () => {
    /**
     * Tests missile update cycle including movement and effects.
     * Ensures all missile systems work together correctly.
     */
    test('should update movement and effects during update cycle', () => {
      const initialX = missile.x;
      const initialY = missile.y;

      // Use full update method which includes position updates
      missile.update(0.1);

      // Should have moved
      expect(missile.x).not.toBe(initialX);
      expect(missile.y).not.toBe(initialY);

      // Should have updated trail
      expect(missile.trailPositions.length).toBeGreaterThan(0);

      // Should have updated rotation
      expect(missile.rotation).toBeDefined();
    });

    /**
     * Tests missile destruction when reaching target.
     * Missiles should be destroyed when they reach their destination.
     */
    test('should be destroyed when reaching target', () => {
      const destroySpy = jest.spyOn(missile, 'destroy');

      // Position missile at target (accounting for missile center)
      missile.x = targetX - 10;
      missile.y = targetY - 14;

      missile.onUpdate(0.1);

      expect(destroySpy).toHaveBeenCalled();
    });

    /**
     * Tests missile destruction after maximum lifetime.
     * Prevents missiles from existing indefinitely.
     */
    test('should be destroyed after maximum lifetime', () => {
      const destroySpy = jest.spyOn(missile, 'destroy');

      missile.age = missile.maxLifetime + 1;
      missile.onUpdate(0.1);

      expect(destroySpy).toHaveBeenCalled();
    });

    /**
     * Tests rotation update based on movement direction.
     * Missiles should face the direction they're moving.
     */
    test('should update rotation based on movement direction', () => {
      const expectedRotation =
        Math.atan2(missile.velocityY, missile.velocityX) + Math.PI / 2;

      missile.onUpdate(0.1);

      expect(missile.rotation).toBeCloseTo(expectedRotation, 5);
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
        missile.render(mockCtx);
      }).not.toThrow();

      // Test rendering different missile types
      const dataBreach = new Missile('data-breach', 0, 0, 100, 100);
      const latencyGhost = new Missile('latency-ghost', 0, 0, 100, 100);
      const policyViolator = new Missile('policy-violator', 0, 0, 100, 100);

      expect(() => {
        dataBreach.render(mockCtx);
        latencyGhost.render(mockCtx);
        policyViolator.render(mockCtx);
      }).not.toThrow();
    });

    /**
     * Tests trail rendering with multiple positions.
     * Ensures trail effects render correctly.
     */
    test('should render trail when positions exist', () => {
      const mockCtx = mockCanvas.getContext();

      // Add some trail positions
      missile.updateTrail();
      missile.x += 10;
      missile.updateTrail();

      expect(() => {
        missile.renderTrail(mockCtx);
      }).not.toThrow();

      // Should have called stroke methods for trail
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });

  describe('Collision Handling', () => {
    /**
     * Tests collision response with defence entities.
     * Missiles should be destroyed when intercepted by defences.
     */
    test('should handle collision with defences', () => {
      const mockDefence = {
        collisionLayer: 'defences',
        destroy: jest.fn(),
      };

      const destroySpy = jest.spyOn(missile, 'destroy');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      missile.onCollision(mockDefence);

      expect(destroySpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Cost Spike intercepted!');

      consoleSpy.mockRestore();
    });

    /**
     * Tests that non-defence collisions are ignored.
     * Missiles should only be affected by defence systems.
     */
    test('should ignore collisions with non-defences', () => {
      const mockTarget = {
        collisionLayer: 'targets',
        destroy: jest.fn(),
      };

      const destroySpy = jest.spyOn(missile, 'destroy');

      missile.onCollision(mockTarget);

      expect(destroySpy).not.toHaveBeenCalled();
    });
  });

  describe('Factory Methods', () => {
    /**
     * Tests static factory methods for creating specific missile types.
     * Provides convenient API for game logic to create typed missiles.
     */
    test('should create specific missile types via factory methods', () => {
      const costSpike = Missile.createCostSpike(10, 20, 100, 200);
      const dataBreach = Missile.createDataBreach(30, 40, 150, 250);
      const latencyGhost = Missile.createLatencyGhost(50, 60, 200, 300);
      const policyViolator = Missile.createPolicyViolator(70, 80, 250, 350);

      expect(costSpike.type).toBe('cost-spike');
      expect(costSpike.x).toBe(10);
      expect(costSpike.y).toBe(20);
      expect(costSpike.targetX).toBe(100);
      expect(costSpike.targetY).toBe(200);

      expect(dataBreach.type).toBe('data-breach');
      expect(latencyGhost.type).toBe('latency-ghost');
      expect(policyViolator.type).toBe('policy-violator');
    });

    /**
     * Tests random missile creation utility.
     * Should create valid missiles of random types.
     */
    test('should create random missile types', () => {
      const randomMissile = Missile.createRandomMissile(0, 0, 100, 100);

      expect(randomMissile).toBeInstanceOf(Missile);
      expect([
        'cost-spike',
        'data-breach',
        'latency-ghost',
        'policy-violator',
      ]).toContain(randomMissile.type);
      expect(randomMissile.x).toBe(0);
      expect(randomMissile.y).toBe(0);
      expect(randomMissile.targetX).toBe(100);
      expect(randomMissile.targetY).toBe(100);
    });

    /**
     * Tests that all factory methods create properly initialised missiles.
     * Ensures factory methods don't skip important initialisation steps.
     */
    test('should create fully initialised missiles from factory methods', () => {
      const missiles = [
        Missile.createCostSpike(0, 0, 100, 100),
        Missile.createDataBreach(0, 0, 100, 100),
        Missile.createLatencyGhost(0, 0, 100, 100),
        Missile.createPolicyViolator(0, 0, 100, 100),
      ];

      missiles.forEach((missile) => {
        expect(missile.collisionLayer).toBe('missiles');
        expect(missile.speed).toBeGreaterThan(0);
        expect(missile.damage).toBeGreaterThan(0);
        expect(missile.trajectory).toBeDefined();
        expect(missile.behaviourProperties).toBeDefined();
        expect(missile.trailPositions).toEqual([]);
        expect(missile.threatIcon).toBeDefined();
        expect(missile.displayName).toBeDefined();
      });
    });
  });
});
