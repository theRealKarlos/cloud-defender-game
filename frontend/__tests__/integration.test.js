/**
 * Integration Tests
 *
 * These tests validate that all components work together correctly.
 * They simulate real game scenarios to ensure the complete entity system
 * functions as expected when all parts are integrated.
 */

const { setupGlobalMocks, createTestEntity } = require('./test-utils');
const { EntityManager } = require('../js/entities.js');

// Setup global mocks before tests
setupGlobalMocks();

describe('Entity System Integration', () => {
  describe('Complete Entity Lifecycle', () => {
    /**
     * Tests the complete entity lifecycle in a real game scenario.
     * Simulates: entity creation → movement → destruction
     * Validates the entire system works together without issues.
     */
    test('should handle complete entity lifecycle through manager', () => {
      const entityManager = new EntityManager();
      const entity = createTestEntity(0, 0, 32, 32);
      entity.velocityX = 100;

      // Add entity
      entityManager.addEntity(entity, 'test');
      entityManager.update(0.1);
      expect(entityManager.getEntityCount()).toBe(1);
      expect(entity.x).toBe(10); // Moved due to velocity

      // Mark for destruction
      entity.destroy();
      entityManager.update(0.1);
      expect(entityManager.getEntityCount()).toBe(0);
    });
  });

  describe('Collision Detection Pipeline', () => {
    /**
     * Tests end-to-end collision detection system.
     * Simulates: entity creation → collision detection → callback execution
     * Validates the complete collision pipeline works in real game conditions.
     */
    test('should handle collision detection through complete system', () => {
      const entityManager = new EntityManager();
      const entity1 = createTestEntity(0, 0, 32, 32);
      const entity2 = createTestEntity(16, 16, 32, 32);

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

  describe('Performance Under Load', () => {
    /**
     * Tests system performance with multiple entities.
     * Validates that the spatial grid optimisation works effectively
     * and the system can handle realistic entity counts.
     */
    test('should handle multiple entities efficiently', () => {
      const entityManager = new EntityManager();
      const entities = [];

      // Create multiple entities in different areas
      for (let i = 0; i < 50; i++) {
        const entity = createTestEntity(i * 10, i * 10, 16, 16);
        entity.velocityX = Math.random() * 100;
        entity.velocityY = Math.random() * 100;
        entities.push(entity);
        entityManager.addEntity(entity, 'test');
      }

      // Process multiple update cycles
      const startTime = performance.now();
      for (let frame = 0; frame < 10; frame++) {
        entityManager.update(0.016); // ~60 FPS
        entityManager.checkCollisions();
      }
      const endTime = performance.now();

      // Should complete quickly (less than 100ms for 50 entities over 10 frames)
      expect(endTime - startTime).toBeLessThan(100);
      expect(entityManager.getEntityCount()).toBe(50);
    });
  });

  describe('Memory Management', () => {
    /**
     * Tests that the system properly cleans up memory.
     * Validates that destroyed entities are completely removed
     * from all tracking systems without memory leaks.
     */
    test('should properly clean up destroyed entities', () => {
      const entityManager = new EntityManager();
      const entities = [];

      // Create and add entities
      for (let i = 0; i < 10; i++) {
        const entity = createTestEntity(i * 20, 0, 16, 16);
        entities.push(entity);
        entityManager.addEntity(entity);
      }

      entityManager.update(0.1);
      expect(entityManager.getEntityCount()).toBe(10);

      // Destroy half the entities
      for (let i = 0; i < 5; i++) {
        entities[i].destroy();
      }

      entityManager.update(0.1);
      expect(entityManager.getEntityCount()).toBe(5);

      // Verify spatial grid is also cleaned up
      const spatialGrid = entityManager.spatialGrid;
      expect(spatialGrid.entityCells.size).toBe(5);
    });
  });

  describe('Layer System Integration', () => {
    /**
     * Tests that the layer system works correctly with entity management.
     * Validates proper organisation and rendering order of different entity types.
     */
    test('should maintain proper layer organisation', () => {
      const entityManager = new EntityManager();

      const target = createTestEntity(0, 0, 32, 32);
      const missile = createTestEntity(10, 10, 16, 16);
      const defence = createTestEntity(20, 20, 24, 24);

      entityManager.addEntity(target, 'targets');
      entityManager.addEntity(missile, 'missiles');
      entityManager.addEntity(defence, 'defences');
      entityManager.update(0.1);

      expect(entityManager.getEntitiesByLayer('targets')).toContain(target);
      expect(entityManager.getEntitiesByLayer('missiles')).toContain(missile);
      expect(entityManager.getEntitiesByLayer('defences')).toContain(defence);
      expect(entityManager.getEntityCount()).toBe(3);
    });
  });
});
