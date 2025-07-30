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

const { setupGlobalMocks, createTestEntity } = require('./test-utils');
const { SpatialGrid } = require('../js/entities.js');

// Setup global mocks before tests
setupGlobalMocks();

describe('SpatialGrid Class', () => {
    let spatialGrid;

    beforeEach(() => {
        spatialGrid = new SpatialGrid(64); // 64px cells
    });

    describe('Initialisation', () => {
        /**
         * Validates proper grid configuration.
         * Cell size affects performance vs accuracy trade-off.
         */
        test('should initialise with correct cell size', () => {
            expect(spatialGrid.cellSize).toBe(64);
        });
    });

    describe('Entity Placement', () => {
        /**
         * Tests that entities are placed in correct grid cells.
         * Foundation for the spatial optimisation - entities must be
         * tracked in the right location for collision detection to work.
         */
        test('should add entity to correct grid cells', () => {
            const entity = createTestEntity(0, 0, 32, 32);
            spatialGrid.addEntity(entity);
            
            // Entity should be in cell (0,0)
            const potentialCollisions = spatialGrid.getPotentialCollisions();
            expect(potentialCollisions).toEqual([]);
        });

        /**
         * Tests dynamic grid updates as entities move.
         * Critical for moving entities - missiles and targets must be tracked
         * in the correct grid cells as they move across the game world.
         */
        test('should update entity position in grid', () => {
            const entity = createTestEntity(0, 0, 32, 32);
            spatialGrid.addEntity(entity);
            
            // Move entity to different cell
            entity.x = 100;
            entity.y = 100;
            spatialGrid.updateEntity(entity);
            
            // Should still track the entity correctly
            expect(spatialGrid.entityCells.has(entity.id)).toBe(true);
        });
    });

    describe('Collision Optimisation', () => {
        /**
         * Tests collision detection optimisation for nearby entities.
         * Ensures entities in the same grid cell are identified as potential
         * collision pairs for detailed checking.
         */
        test('should find potential collisions between entities in same cell', () => {
            const entity1 = createTestEntity(0, 0, 32, 32);
            const entity2 = createTestEntity(16, 16, 32, 32);
            
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
        test('should not find collisions between entities in different cells', () => {
            const entity1 = createTestEntity(0, 0, 32, 32);
            const entity2 = createTestEntity(100, 100, 32, 32); // Different cell
            
            spatialGrid.addEntity(entity1);
            spatialGrid.addEntity(entity2);
            
            const potentialCollisions = spatialGrid.getPotentialCollisions();
            expect(potentialCollisions).toHaveLength(0);
        });
    });

    describe('Memory Management', () => {
        /**
         * Tests proper cleanup when entities are removed.
         * Prevents memory leaks in the spatial grid and ensures destroyed
         * entities don't continue to participate in collision detection.
         */
        test('should remove entity from grid', () => {
            const entity = createTestEntity(0, 0, 32, 32);
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
        test('should clear all entities from grid', () => {
            const entity1 = createTestEntity(0, 0, 32, 32);
            const entity2 = createTestEntity(16, 16, 32, 32);
            
            spatialGrid.addEntity(entity1);
            spatialGrid.addEntity(entity2);
            expect(spatialGrid.entityCells.size).toBe(2);
            
            spatialGrid.clear();
            expect(spatialGrid.entityCells.size).toBe(0);
        });
    });
});