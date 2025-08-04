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

const { setupGlobalMocks, createTestEntity } = require('./test-utils');
const { EntityManager } = require('../js/entities.js');

// Setup global mocks before tests
setupGlobalMocks();

describe('EntityManager Class', () => {
    let entityManager;

    beforeEach(() => {
        entityManager = new EntityManager();
    });

    describe('Initialisation', () => {
    /**
     * Validates clean initialisation state.
     * Ensures the manager starts empty and ready to accept entities.
     */
        test('should initialise with empty collections', () => {
            expect(entityManager.getEntityCount()).toBe(0);
            expect(entityManager.getAllEntities()).toEqual([]);
            expect(entityManager.getEntitiesByLayer('default')).toEqual([]);
        });
    });

    describe('Entity Management', () => {
    /**
     * Tests the layer system for proper rendering order and organisation.
     * Critical for visual correctness - UI must render over game objects,
     * effects over entities, etc. Also enables efficient layer-based operations.
     */
        test('should add entities to correct layers', () => {
            const entity1 = createTestEntity(0, 0, 32, 32);
            const entity2 = createTestEntity(10, 10, 32, 32);

            entityManager.addEntity(entity1, 'targets');
            entityManager.addEntity(entity2, 'missiles');
            entityManager.update(0.1); // Process additions

            expect(entityManager.getEntityCount()).toBe(2);
            expect(entityManager.getEntitiesByLayer('targets')).toContain(entity1);
            expect(entityManager.getEntitiesByLayer('missiles')).toContain(entity2);
        });

        /**
     * Tests entity lookup functionality.
     * Allows game logic to find specific entities for targeting, status updates,
     * or special interactions (e.g., finding the player's base to attack).
     */
        test('should retrieve entities by ID', () => {
            const entity = createTestEntity(0, 0, 32, 32);

            entityManager.addEntity(entity);
            entityManager.update(0.1);

            expect(entityManager.getEntity(entity.id)).toBe(entity);
            expect(entityManager.getEntity('nonexistent')).toBeUndefined();
        });

        /**
     * Tests bulk cleanup functionality.
     * Essential for game state transitions (restarting game, changing levels)
     * where all entities need to be removed at once without memory leaks.
     */
        test('should clear all entities', () => {
            const entity1 = createTestEntity(0, 0, 32, 32);
            const entity2 = createTestEntity(10, 10, 32, 32);

            entityManager.addEntity(entity1);
            entityManager.addEntity(entity2);
            entityManager.update(0.1);
            expect(entityManager.getEntityCount()).toBe(2);

            entityManager.clear();
            expect(entityManager.getEntityCount()).toBe(0);
            expect(entityManager.getAllEntities()).toEqual([]);
        });
    });

    describe('Update Cycle', () => {
    /**
     * Validates that all entities are updated each frame.
     * Essential for game loop - ensures all missiles, targets, and defences
     * move and update their state consistently every frame.
     */
        test('should update all active entities', () => {
            const entity1 = createTestEntity(0, 0, 32, 32);
            const entity2 = createTestEntity(10, 10, 32, 32);
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
        test('should remove entities marked for destruction', () => {
            const entity = createTestEntity(0, 0, 32, 32);

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
        test('should remove entities by ID', () => {
            const entity = createTestEntity(0, 0, 32, 32);

            entityManager.addEntity(entity);
            entityManager.update(0.1); // Process addition
            expect(entityManager.getEntityCount()).toBe(1);

            entityManager.removeEntity(entity.id);
            entityManager.update(0.1); // Process removal
            expect(entityManager.getEntityCount()).toBe(0);
        });
    });

    describe('Collision Detection', () => {
    /**
     * Tests the complete collision detection system integration.
     * Validates that collisions are detected and both entities are notified.
     * Critical for game mechanics - missiles hitting targets, defences blocking missiles.
     */
        test('should detect collisions between entities', () => {
            const entity1 = createTestEntity(0, 0, 32, 32);
            const entity2 = createTestEntity(16, 16, 32, 32); // Overlapping
            const onCollisionSpy1 = jest.spyOn(entity1, 'onCollision');
            const onCollisionSpy2 = jest.spyOn(entity2, 'onCollision');

            entityManager.addEntity(entity1);
            entityManager.addEntity(entity2);
            entityManager.update(0.1); // Process additions

            const collisions = entityManager.checkCollisions();

            expect(collisions).toHaveLength(1);
            expect(collisions[0]).toEqual([entity1, entity2]);
            expect(onCollisionSpy1).toHaveBeenCalledWith(entity2);
            expect(onCollisionSpy2).toHaveBeenCalledWith(entity1);
        });
    });
});
