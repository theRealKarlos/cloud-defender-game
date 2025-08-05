/**
 * Entity Class Tests
 *
 * The Entity class is the base class for all game objects (missiles, targets, defences).
 * These tests validate core functionality that every game object depends on:
 * - Position and movement physics
 * - Collision detection and bounding boxes
 * - Lifecycle management (creation, updates, destruction)
 * - State management (active/inactive, visible/hidden)
 */

const {
  setupGlobalMocks,
  createTestEntity,
  createOverlappingEntities,
  createNonOverlappingEntities,
  expectEntityDefaults,
  expectUniqueIds,
  mockCanvas,
} = require('./test-utils');
const { Entity } = require('../js/entities.js');

// Setup global mocks before tests
setupGlobalMocks();

describe('Entity Class', () => {
  let entity;

  beforeEach(() => {
    entity = new Entity(10, 20, 32, 48);
  });

  describe('Initialisation', () => {
    /**
     * Validates that entities start with correct default state.
     * Critical for ensuring all game objects behave predictably from creation.
     */
    test('should initialise with correct default properties', () => {
      expectEntityDefaults(entity, 10, 20, 32, 48);
    });

    /**
     * Ensures each entity gets a unique identifier for tracking and management.
     * Prevents ID collisions that could cause entities to be lost or mismanaged.
     */
    test('should generate unique IDs', () => {
      const entity1 = new Entity();
      const entity2 = new Entity();
      expectUniqueIds(entity1, entity2);
    });
  });

  describe('Movement and Physics', () => {
    /**
     * Tests the core physics system - entities must move correctly based on velocity.
     * This is fundamental for missiles flying, targets moving, and all game motion.
     * Also validates age tracking for entity lifecycle management.
     */
    test('should update position based on velocity', () => {
      entity.velocityX = 100; // 100 pixels per second
      entity.velocityY = 50; // 50 pixels per second

      const deltaTime = 0.1; // 100ms
      entity.update(deltaTime);

      expect(entity.x).toBe(20); // 10 + (100 * 0.1)
      expect(entity.y).toBe(25); // 20 + (50 * 0.1)
      expect(entity.age).toBe(0.1);
    });

    /**
     * Validates that inactive entities don't process updates.
     * Important for paused states, disabled entities, or performance optimisation
     * where certain entities should temporarily stop processing.
     */
    test('should not update when inactive', () => {
      entity.active = false;
      entity.velocityX = 100;
      const initialX = entity.x;

      entity.update(0.1);

      expect(entity.x).toBe(initialX); // Should not have moved
    });
  });

  describe('Collision Detection', () => {
    /**
     * Validates collision boundary calculations are accurate.
     * Critical for precise collision detection - missiles must hit targets exactly
     * where they appear visually, not based on outdated position data.
     */
    test('should update bounding box when position changes', () => {
      entity.x = 50;
      entity.y = 60;
      entity.updateBoundingBox();

      const bounds = entity.getBounds();
      expect(bounds.left).toBe(50);
      expect(bounds.top).toBe(60);
      expect(bounds.right).toBe(82); // 50 + 32
      expect(bounds.bottom).toBe(108); // 60 + 48
      expect(bounds.centerX).toBe(66); // 50 + 16
      expect(bounds.centerY).toBe(84); // 60 + 24
    });

    /**
     * Tests accurate collision detection for overlapping entities.
     * Essential for game mechanics - missiles hitting targets, defences blocking missiles.
     * Validates bidirectional collision detection works correctly.
     */
    test('should detect collision with overlapping entity', () => {
      const [entity1, entity2] = createOverlappingEntities();

      expect(entity1.isCollidingWith(entity2)).toBe(true);
      expect(entity2.isCollidingWith(entity1)).toBe(true);
    });

    /**
     * Ensures non-overlapping entities don't falsely trigger collisions.
     * Prevents false positives that would cause incorrect game behaviour
     * (missiles exploding when they shouldn't, etc.).
     */
    test('should not detect collision with non-overlapping entity', () => {
      const [entity1, entity2] = createNonOverlappingEntities();

      expect(entity1.isCollidingWith(entity2)).toBe(false);
      expect(entity2.isCollidingWith(entity1)).toBe(false);
    });

    /**
     * Prevents entities from colliding with themselves.
     * Edge case protection that prevents infinite loops or self-destruction bugs.
     */
    test('should not collide with itself', () => {
      expect(entity.isCollidingWith(entity)).toBe(false);
    });

    /**
     * Tests the collidable flag for disabling collision detection.
     * Allows for effects, UI elements, or temporary invincibility states
     * where entities shouldn't interact with collision system.
     */
    test('should not collide when collidable is false', () => {
      const [entity1, entity2] = createOverlappingEntities();
      entity1.collidable = false;

      expect(entity1.isCollidingWith(entity2)).toBe(false);
    });

    /**
     * Validates accurate distance calculations between entities.
     * Used for AI targeting, range checks, and proximity-based game mechanics.
     * Critical for defence systems knowing when targets are in range.
     */
    test('should calculate distance between entities', () => {
      const entity1 = createTestEntity(0, 0, 32, 32);
      const entity2 = createTestEntity(30, 40, 32, 32);

      // Centers are at (16, 16) and (46, 56)
      // Distance = sqrt((46-16)² + (56-16)²) = sqrt(900 + 1600) = sqrt(2500) = 50
      expect(entity1.distanceTo(entity2)).toBe(50);
    });
  });

  describe('Lifecycle Management', () => {
    /**
     * Tests proper entity destruction and cleanup.
     * Ensures destroyed entities are properly flagged and lifecycle methods called.
     * Prevents memory leaks and ensures clean removal from the game world.
     */
    test('should mark for destruction when destroyed', () => {
      const onDestroySpy = jest.spyOn(entity, 'onDestroy');

      entity.destroy();

      expect(entity.markedForDestruction).toBe(true);
      expect(entity.active).toBe(false);
      expect(onDestroySpy).toHaveBeenCalled();
    });

    /**
     * Ensures lifecycle hooks are called for subclass customisation.
     * Allows specific entity types (missiles, targets) to extend base behaviour
     * while maintaining the core entity update/render cycle.
     */
    test('should call lifecycle methods during update and render', () => {
      const onUpdateSpy = jest.spyOn(entity, 'onUpdate');
      const onRenderSpy = jest.spyOn(entity, 'onRender');
      const mockCtx = mockCanvas.getContext();

      entity.update(0.1);
      entity.render(mockCtx);

      expect(onUpdateSpy).toHaveBeenCalledWith(0.1);
      expect(onRenderSpy).toHaveBeenCalledWith(mockCtx);
    });
  });
});
