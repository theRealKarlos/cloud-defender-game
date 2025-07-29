/**
 * Unit Tests for Entity System
 *
 * This test suite validates the core game engine components that handle all game objects
 * (missiles, targets, defences, etc.). The entity system is the foundation of the game,
 * so these tests ensure reliability, performance, and correctness.
 *
 * Test Coverage:
 * - Entity Class: Core game object behaviour (movement, collision, lifecycle)
 * - EntityManager: Game object management and organisation
 * - SpatialGrid: Performance optimisation for collision detection
 * - Integration: End-to-end system validation
 *
 * Why These Tests Matter:
 * - Prevent regressions when adding new features
 * - Ensure collision detection works accurately at scale
 * - Validate memory management prevents leaks
 * - Confirm physics and movement calculations are correct
 * - Verify the game can handle hundreds of entities without performance issues
 */

// Mock canvas context for testing
const mockCanvas = {
  getContext: () => ({
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    clearRect: jest.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  }),
};

// Mock DOM elements
global.document = {
  getElementById: jest.fn(() => mockCanvas),
  addEventListener: jest.fn(),
  createElement: jest.fn(() => mockCanvas),
};

global.window = {
  devicePixelRatio: 1,
  addEventListener: jest.fn(),
  requestAnimationFrame: jest.fn(),
  cancelAnimationFrame: jest.fn(),
};

global.performance = {
  now: jest.fn(() => Date.now()),
};

// Import the entity classes
const { Entity, EntityManager, SpatialGrid } = require("./entities.js");

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
describe("Entity Class", () => {
  let entity;

  beforeEach(() => {
    entity = new Entity(10, 20, 32, 48);
  });

  /**
   * Validates that entities start with correct default state.
   * Critical for ensuring all game objects behave predictably from creation.
   */
  test("should initialise with correct default properties", () => {
    expect(entity.x).toBe(10);
    expect(entity.y).toBe(20);
    expect(entity.width).toBe(32);
    expect(entity.height).toBe(48);
    expect(entity.active).toBe(true);
    expect(entity.visible).toBe(true);
    expect(entity.collidable).toBe(true);
    expect(entity.markedForDestruction).toBe(false);
    expect(entity.age).toBe(0);
  });

  /**
   * Ensures each entity gets a unique identifier for tracking and management.
   * Prevents ID collisions that could cause entities to be lost or mismanaged.
   */
  test("should generate unique IDs", () => {
    const entity1 = new Entity();
    const entity2 = new Entity();
    expect(entity1.id).not.toBe(entity2.id);
    expect(entity1.id).toMatch(/^_[a-z0-9]{9}$/);
  });

  /**
   * Tests the core physics system - entities must move correctly based on velocity.
   * This is fundamental for missiles flying, targets moving, and all game motion.
   * Also validates age tracking for entity lifecycle management.
   */
  test("should update position based on velocity", () => {
    entity.velocityX = 100; // 100 pixels per second
    entity.velocityY = 50; // 50 pixels per second

    const deltaTime = 0.1; // 100ms
    entity.update(deltaTime);

    expect(entity.x).toBe(20); // 10 + (100 * 0.1)
    expect(entity.y).toBe(25); // 20 + (50 * 0.1)
    expect(entity.age).toBe(0.1);
  });

  /**
   * Validates collision boundary calculations are accurate.
   * Critical for precise collision detection - missiles must hit targets exactly
   * where they appear visually, not based on outdated position data.
   */
  test("should update bounding box when position changes", () => {
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
  test("should detect collision with overlapping entity", () => {
    const entity1 = new Entity(0, 0, 32, 32);
    const entity2 = new Entity(16, 16, 32, 32); // Overlapping

    expect(entity1.isCollidingWith(entity2)).toBe(true);
    expect(entity2.isCollidingWith(entity1)).toBe(true);
  });

  /**
   * Ensures non-overlapping entities don't falsely trigger collisions.
   * Prevents false positives that would cause incorrect game behaviour
   * (missiles exploding when they shouldn't, etc.).
   */
  test("should not detect collision with non-overlapping entity", () => {
    const entity1 = new Entity(0, 0, 32, 32);
    const entity2 = new Entity(50, 50, 32, 32); // Not overlapping

    expect(entity1.isCollidingWith(entity2)).toBe(false);
    expect(entity2.isCollidingWith(entity1)).toBe(false);
  });

  /**
   * Prevents entities from colliding with themselves.
   * Edge case protection that prevents infinite loops or self-destruction bugs.
   */
  test("should not collide with itself", () => {
    expect(entity.isCollidingWith(entity)).toBe(false);
  });

  /**
   * Tests the collidable flag for disabling collision detection.
   * Allows for effects, UI elements, or temporary invincibility states
   * where entities shouldn't interact with collision system.
   */
  test("should not collide when collidable is false", () => {
    const entity1 = new Entity(0, 0, 32, 32);
    const entity2 = new Entity(16, 16, 32, 32);
    entity1.collidable = false;

    expect(entity1.isCollidingWith(entity2)).toBe(false);
  });

  /**
   * Validates accurate distance calculations between entities.
   * Used for AI targeting, range checks, and proximity-based game mechanics.
   * Critical for defence systems knowing when targets are in range.
   */
  test("should calculate distance between entities", () => {
    const entity1 = new Entity(0, 0, 32, 32);
    const entity2 = new Entity(30, 40, 32, 32);

    // Centers are at (16, 16) and (46, 56)
    // Distance = sqrt((46-16)² + (56-16)²) = sqrt(900 + 1600) = sqrt(2500) = 50
    expect(entity1.distanceTo(entity2)).toBe(50);
  });

  /**
   * Tests proper entity destruction and cleanup.
   * Ensures destroyed entities are properly flagged and lifecycle methods called.
   * Prevents memory leaks and ensures clean removal from the game world.
   */
  test("should mark for destruction when destroyed", () => {
    const onDestroySpy = jest.spyOn(entity, "onDestroy");

    entity.destroy();

    expect(entity.markedForDestruction).toBe(true);
    expect(entity.active).toBe(false);
    expect(onDestroySpy).toHaveBeenCalled();
  });

  /**
   * Validates that inactive entities don't process updates.
   * Important for paused states, disabled entities, or performance optimisation
   * where certain entities should temporarily stop processing.
   */
  test("should not update when inactive", () => {
    entity.active = false;
    entity.velocityX = 100;
    const initialX = entity.x;

    entity.update(0.1);

    expect(entity.x).toBe(initialX); // Should not have moved
  });

  /**
   * Ensures lifecycle hooks are called for subclass customisation.
   * Allows specific entity types (missiles, targets) to extend base behaviour
   * while maintaining the core entity update/render cycle.
   */
  test("should call lifecycle methods during update and render", () => {
    const onUpdateSpy = jest.spyOn(entity, "onUpdate");
    const onRenderSpy = jest.spyOn(entity, "onRender");
    const mockCtx = mockCanvas.getContext();

    entity.update(0.1);
    entity.render(mockCtx);

    expect(onUpdateSpy).toHaveBeenCalledWith(0.1);
    expect(onRenderSpy).toHaveBeenCalledWith(mockCtx);
  });
});

/**
 * EntityManager Class Tests
 *
 * The EntityManager handles all game objects in the world. It's responsible for:
 * - Organising entities by layers (background, targets, missiles, defences, effects, UI)
 * - Updating all entities each frame
 * - Managing entity lifecycle (creation, updates, destruction)
 * - Coordinating collision detection across all entities
 * - Memory management and cleanup
 *
 * These tests ensure the manager can handle hundreds of entities efficiently
 * without memory leaks or performance degradation.
 */
describe("EntityManager Class", () => {
  let entityManager;

  beforeEach(() => {
    entityManager = new EntityManager();
  });

  /**
   * Validates clean initialisation state.
   * Ensures the manager starts empty and ready to accept entities.
   */
  test("should initialise with empty collections", () => {
    expect(entityManager.getEntityCount()).toBe(0);
    expect(entityManager.getAllEntities()).toEqual([]);
    expect(entityManager.getEntitiesByLayer("default")).toEqual([]);
  });

  /**
   * Tests the layer system for proper rendering order and organisation.
   * Critical for visual correctness - UI must render over game objects,
   * effects over entities, etc. Also enables efficient layer-based operations.
   */
  test("should add entities to correct layers", () => {
    const entity1 = new Entity(0, 0, 32, 32);
    const entity2 = new Entity(10, 10, 32, 32);

    entityManager.addEntity(entity1, "targets");
    entityManager.addEntity(entity2, "missiles");
    entityManager.update(0.1); // Process additions

    expect(entityManager.getEntityCount()).toBe(2);
    expect(entityManager.getEntitiesByLayer("targets")).toContain(entity1);
    expect(entityManager.getEntitiesByLayer("missiles")).toContain(entity2);
  });

  /**
   * Validates that all entities are updated each frame.
   * Essential for game loop - ensures all missiles, targets, and defences
   * move and update their state consistently every frame.
   */
  test("should update all active entities", () => {
    const entity1 = new Entity(0, 0, 32, 32);
    const entity2 = new Entity(10, 10, 32, 32);
    entity1.velocityX = 100;
    entity2.velocityX = 50;

    entityManager.addEntity(entity1);
    entityManager.addEntity(entity2);
    entityManager.update(0.1);

    expect(entity1.x).toBe(10); // Moved from 0
    expect(entity2.x).toBe(15); // Moved from 10
  });

  /**
   * Tests automatic cleanup of destroyed entities.
   * Prevents memory leaks by ensuring destroyed missiles, exploded targets,
   * etc. are properly removed from the game world and memory.
   */
  test("should remove entities marked for destruction", () => {
    const entity = new Entity(0, 0, 32, 32);

    entityManager.addEntity(entity);
    entityManager.update(0.1); // Process addition
    expect(entityManager.getEntityCount()).toBe(1);

    entity.destroy();
    entityManager.update(0.1); // Process removal
    expect(entityManager.getEntityCount()).toBe(0);
  });

  /**
   * Tests manual entity removal by ID.
   * Allows game logic to remove specific entities (e.g., when missiles
   * go off-screen, when wave ends, etc.) without destroying the entity first.
   */
  test("should remove entities by ID", () => {
    const entity = new Entity(0, 0, 32, 32);

    entityManager.addEntity(entity);
    entityManager.update(0.1); // Process addition
    expect(entityManager.getEntityCount()).toBe(1);

    entityManager.removeEntity(entity.id);
    entityManager.update(0.1); // Process removal
    expect(entityManager.getEntityCount()).toBe(0);
  });

  /**
   * Tests the complete collision detection system integration.
   * Validates that collisions are detected and both entities are notified.
   * Critical for game mechanics - missiles hitting targets, defences blocking missiles.
   */
  test("should detect collisions between entities", () => {
    const entity1 = new Entity(0, 0, 32, 32);
    const entity2 = new Entity(16, 16, 32, 32); // Overlapping
    const onCollisionSpy1 = jest.spyOn(entity1, "onCollision");
    const onCollisionSpy2 = jest.spyOn(entity2, "onCollision");

    entityManager.addEntity(entity1);
    entityManager.addEntity(entity2);
    entityManager.update(0.1); // Process additions

    const collisions = entityManager.checkCollisions();

    expect(collisions).toHaveLength(1);
    expect(collisions[0]).toEqual([entity1, entity2]);
    expect(onCollisionSpy1).toHaveBeenCalledWith(entity2);
    expect(onCollisionSpy2).toHaveBeenCalledWith(entity1);
  });

  /**
   * Tests bulk cleanup functionality.
   * Essential for game state transitions (restarting game, changing levels)
   * where all entities need to be removed at once without memory leaks.
   */
  test("should clear all entities", () => {
    const entity1 = new Entity(0, 0, 32, 32);
    const entity2 = new Entity(10, 10, 32, 32);

    entityManager.addEntity(entity1);
    entityManager.addEntity(entity2);
    entityManager.update(0.1);
    expect(entityManager.getEntityCount()).toBe(2);

    entityManager.clear();
    expect(entityManager.getEntityCount()).toBe(0);
    expect(entityManager.getAllEntities()).toEqual([]);
  });

  /**
   * Tests entity lookup functionality.
   * Allows game logic to find specific entities for targeting, status updates,
   * or special interactions (e.g., finding the player's base to attack).
   */
  test("should retrieve entities by ID", () => {
    const entity = new Entity(0, 0, 32, 32);

    entityManager.addEntity(entity);
    entityManager.update(0.1);

    expect(entityManager.getEntity(entity.id)).toBe(entity);
    expect(entityManager.getEntity("nonexistent")).toBeUndefined();
  });
});

/**
 * SpatialGrid Class Tests
 *
 * The SpatialGrid is a performance optimisation for collision detection.
 * Instead of checking every entity against every other entity (O(n²) complexity),
 * it divides the game world into a grid and only checks entities in the same
 * or adjacent cells (much better performance).
 *
 * This is critical for handling hundreds of missiles and targets without
 * the game slowing down. These tests ensure the optimisation works correctly
 * and doesn't miss any collisions.
 */
describe("SpatialGrid Class", () => {
  let spatialGrid;

  beforeEach(() => {
    spatialGrid = new SpatialGrid(64); // 64px cells
  });

  /**
   * Validates proper grid configuration.
   * Cell size affects performance vs accuracy trade-off.
   */
  test("should initialise with correct cell size", () => {
    expect(spatialGrid.cellSize).toBe(64);
  });

  /**
   * Tests that entities are placed in correct grid cells.
   * Foundation for the spatial optimisation - entities must be
   * tracked in the right location for collision detection to work.
   */
  test("should add entity to correct grid cells", () => {
    const entity = new Entity(0, 0, 32, 32);
    spatialGrid.addEntity(entity);

    // Entity should be in cell (0,0)
    const potentialCollisions = spatialGrid.getPotentialCollisions();
    expect(potentialCollisions).toEqual([]);
  });

  /**
   * Tests collision detection optimisation for nearby entities.
   * Ensures entities in the same grid cell are identified as potential
   * collision pairs for detailed checking.
   */
  test("should find potential collisions between entities in same cell", () => {
    const entity1 = new Entity(0, 0, 32, 32);
    const entity2 = new Entity(16, 16, 32, 32);

    spatialGrid.addEntity(entity1);
    spatialGrid.addEntity(entity2);

    const potentialCollisions = spatialGrid.getPotentialCollisions();
    expect(potentialCollisions).toHaveLength(1);
    expect(potentialCollisions[0]).toEqual([entity1, entity2]);
  });

  /**
   * Tests performance optimisation - distant entities are ignored.
   * Validates that entities far apart aren't checked for collision,
   * which is the key performance benefit of spatial partitioning.
   */
  test("should not find collisions between entities in different cells", () => {
    const entity1 = new Entity(0, 0, 32, 32);
    const entity2 = new Entity(100, 100, 32, 32); // Different cell

    spatialGrid.addEntity(entity1);
    spatialGrid.addEntity(entity2);

    const potentialCollisions = spatialGrid.getPotentialCollisions();
    expect(potentialCollisions).toHaveLength(0);
  });

  /**
   * Tests dynamic grid updates as entities move.
   * Critical for moving entities - missiles and targets must be tracked
   * in the correct grid cells as they move across the game world.
   */
  test("should update entity position in grid", () => {
    const entity = new Entity(0, 0, 32, 32);
    spatialGrid.addEntity(entity);

    // Move entity to different cell
    entity.x = 100;
    entity.y = 100;
    spatialGrid.updateEntity(entity);

    // Should still track the entity correctly
    expect(spatialGrid.entityCells.has(entity.id)).toBe(true);
  });

  /**
   * Tests proper cleanup when entities are removed.
   * Prevents memory leaks in the spatial grid and ensures destroyed
   * entities don't continue to participate in collision detection.
   */
  test("should remove entity from grid", () => {
    const entity = new Entity(0, 0, 32, 32);
    spatialGrid.addEntity(entity);
    expect(spatialGrid.entityCells.has(entity.id)).toBe(true);

    spatialGrid.removeEntity(entity);
    expect(spatialGrid.entityCells.has(entity.id)).toBe(false);
  });

  /**
   * Tests bulk cleanup of the spatial grid.
   * Essential for game state transitions where all collision tracking
   * data needs to be reset without memory leaks.
   */
  test("should clear all entities from grid", () => {
    const entity1 = new Entity(0, 0, 32, 32);
    const entity2 = new Entity(16, 16, 32, 32);

    spatialGrid.addEntity(entity1);
    spatialGrid.addEntity(entity2);
    expect(spatialGrid.entityCells.size).toBe(2);

    spatialGrid.clear();
    expect(spatialGrid.entityCells.size).toBe(0);
  });
});

/**
 * Integration Tests
 *
 * These tests validate that all components work together correctly.
 * They simulate real game scenarios to ensure the complete entity system
 * functions as expected when all parts are integrated.
 */
describe("Integration Tests", () => {
  /**
   * Tests the complete entity lifecycle in a real game scenario.
   * Simulates: entity creation → movement → destruction
   * Validates the entire system works together without issues.
   */
  test("should handle complete entity lifecycle through manager", () => {
    const entityManager = new EntityManager();
    const entity = new Entity(0, 0, 32, 32);
    entity.velocityX = 100;

    // Add entity
    entityManager.addEntity(entity, "test");
    entityManager.update(0.1);
    expect(entityManager.getEntityCount()).toBe(1);
    expect(entity.x).toBe(10); // Moved due to velocity

    // Mark for destruction
    entity.destroy();
    entityManager.update(0.1);
    expect(entityManager.getEntityCount()).toBe(0);
  });

  /**
   * Tests end-to-end collision detection system.
   * Simulates: entity creation → collision detection → callback execution
   * Validates the complete collision pipeline works in real game conditions.
   */
  test("should handle collision detection through complete system", () => {
    const entityManager = new EntityManager();
    const entity1 = new Entity(0, 0, 32, 32);
    const entity2 = new Entity(16, 16, 32, 32);

    let collisionDetected = false;
    entity1.onCollision = () => {
      collisionDetected = true;
    };

    entityManager.addEntity(entity1);
    entityManager.addEntity(entity2);
    entityManager.update(0.1);

    const collisions = entityManager.checkCollisions();
    expect(collisions).toHaveLength(1);
    expect(collisionDetected).toBe(true);
  });
});
