/**
 * Target Class Tests
 * 
 * The Target class represents AWS infrastructure components that players defend.
 * These tests validate target-specific functionality including:
 * - AWS service type handling and properties
 * - Health management and damage system
 * - Visual effects for damage and destruction
 * - Collision handling with missiles
 */

const { setupGlobalMocks, mockCanvas } = require('./test-utils');
const { Target } = require('../js/target.js');

// Setup global mocks before tests
setupGlobalMocks();

describe('Target Class', () => {
    let target;

    beforeEach(() => {
        target = new Target('s3', 100, 200);
    });

    describe('Initialisation', () => {
        /**
         * Validates that targets initialise with correct AWS service properties.
         * Each service type should have appropriate health, dimensions, and visual properties.
         */
        test('should initialise with correct AWS service properties', () => {
            expect(target.type).toBe('s3');
            expect(target.x).toBe(100);
            expect(target.y).toBe(200);
            expect(target.maxHealth).toBe(100); // S3 bucket health
            expect(target.currentHealth).toBe(100);
            expect(target.collisionLayer).toBe('targets');
            expect(target.colour).toBe('#FF9900'); // S3 orange (AWS official colour)
            expect(target.serviceIcon).toBe('S3');
            expect(target.displayName).toBe('S3 Bucket');
            expect(target.isDestroyed).toBe(false);
        });

        /**
         * Tests that different AWS service types have appropriate health values.
         * Critical for game balance - different services should have different durability.
         */
        test('should set correct health values for different service types', () => {
            const s3Target = new Target('s3', 0, 0);
            const lambdaTarget = new Target('lambda', 0, 0);
            const rdsTarget = new Target('rds', 0, 0);
            const ec2Target = new Target('ec2', 0, 0);

            expect(s3Target.maxHealth).toBe(100);
            expect(lambdaTarget.maxHealth).toBe(75);
            expect(rdsTarget.maxHealth).toBe(150);
            expect(ec2Target.maxHealth).toBe(125);
        });

        /**
         * Validates that different service types have appropriate visual dimensions.
         * Ensures visual consistency and proper collision detection boundaries.
         */
        test('should set correct dimensions for different service types', () => {
            const s3Target = new Target('s3', 0, 0);
            const lambdaTarget = new Target('lambda', 0, 0);
            const rdsTarget = new Target('rds', 0, 0);

            expect(s3Target.width).toBe(48);
            expect(s3Target.height).toBe(48);
            expect(lambdaTarget.width).toBe(40);
            expect(lambdaTarget.height).toBe(40);
            expect(rdsTarget.width).toBe(56);
            expect(rdsTarget.height).toBe(48);
        });

        /**
         * Tests that unknown service types fall back to default values.
         * Prevents crashes when invalid service types are used.
         */
        test('should handle unknown service types with defaults', () => {
            const unknownTarget = new Target('unknown-service', 0, 0);
            
            expect(unknownTarget.maxHealth).toBe(100);
            expect(unknownTarget.width).toBe(48);
            expect(unknownTarget.height).toBe(48);
            expect(unknownTarget.colour).toBe('#888888');
            expect(unknownTarget.serviceIcon).toBe('?');
            expect(unknownTarget.displayName).toBe('Unknown Service');
        });
    });

    describe('Health Management', () => {
        /**
         * Tests basic damage application and health reduction.
         * Core mechanic for missile impacts reducing target health.
         */
        test('should take damage and reduce health', () => {
            const initialHealth = target.currentHealth;
            const damageAmount = 25;
            
            const wasDestroyed = target.takeDamage(damageAmount);
            
            expect(target.currentHealth).toBe(initialHealth - damageAmount);
            expect(wasDestroyed).toBe(false);
            expect(target.isFlashing).toBe(true);
            expect(target.damageFlashTimer).toBeGreaterThan(0);
        });

        /**
         * Tests that targets are properly destroyed when health reaches zero.
         * Critical for win/lose conditions and target elimination mechanics.
         */
        test('should be destroyed when health reaches zero', () => {
            const wasDestroyed = target.takeDamage(target.maxHealth);
            
            expect(target.currentHealth).toBe(0);
            expect(target.isDestroyed).toBe(true);
            expect(wasDestroyed).toBe(true);
        });

        /**
         * Tests that excessive damage doesn't cause negative health values.
         * Prevents potential bugs with health calculations and display.
         */
        test('should not go below zero health', () => {
            target.takeDamage(target.maxHealth + 50);
            
            expect(target.currentHealth).toBe(0);
            expect(target.isDestroyed).toBe(true);
        });

        /**
         * Tests healing functionality for power-ups or repair mechanics.
         * Allows for gameplay elements that restore target health.
         */
        test('should heal and increase health up to maximum', () => {
            target.takeDamage(50);
            const damagedHealth = target.currentHealth;
            
            target.heal(25);
            expect(target.currentHealth).toBe(damagedHealth + 25);
            
            // Should not exceed maximum health
            target.heal(100);
            expect(target.currentHealth).toBe(target.maxHealth);
        });

        /**
         * Tests that destroyed targets cannot be healed.
         * Prevents resurrection of destroyed infrastructure.
         */
        test('should not heal when destroyed', () => {
            target.takeDamage(target.maxHealth); // Destroy target
            
            target.heal(50);
            expect(target.currentHealth).toBe(0);
            expect(target.isDestroyed).toBe(true);
        });

        /**
         * Tests that destroyed targets ignore further damage.
         * Prevents double-destruction and unnecessary processing.
         */
        test('should ignore damage when already destroyed', () => {
            target.takeDamage(target.maxHealth); // Destroy target
            const healthAfterDestruction = target.currentHealth;
            
            const wasDestroyed = target.takeDamage(25);
            
            expect(target.currentHealth).toBe(healthAfterDestruction);
            expect(wasDestroyed).toBe(false);
        });
    });

    describe('Health Status Methods', () => {
        /**
         * Tests health percentage calculation for UI and game logic.
         * Used for health bars, AI decisions, and visual effects.
         */
        test('should calculate health percentage correctly', () => {
            expect(target.getHealthPercentage()).toBe(1.0);
            
            target.takeDamage(25);
            expect(target.getHealthPercentage()).toBe(0.75);
            
            target.takeDamage(target.currentHealth);
            expect(target.getHealthPercentage()).toBe(0);
        });

        /**
         * Tests health status categorisation for different visual states.
         * Determines colour coding and priority for repairs/defence.
         */
        test('should correctly identify health status', () => {
            // Healthy (> 70%)
            expect(target.isHealthy()).toBe(true);
            expect(target.isDamaged()).toBe(false);
            expect(target.isCritical()).toBe(false);
            
            // Damaged (30-70%)
            target.takeDamage(40); // 60% health
            expect(target.isHealthy()).toBe(false);
            expect(target.isDamaged()).toBe(true);
            expect(target.isCritical()).toBe(false);
            
            // Critical (< 30%)
            target.takeDamage(35); // 25% health
            expect(target.isHealthy()).toBe(false);
            expect(target.isDamaged()).toBe(false);
            expect(target.isCritical()).toBe(true);
            
            // Destroyed
            target.takeDamage(target.currentHealth);
            expect(target.isHealthy()).toBe(false);
            expect(target.isDamaged()).toBe(false);
            expect(target.isCritical()).toBe(false);
        });
    });

    describe('Visual Effects', () => {
        /**
         * Tests damage flash effect timing and state management.
         * Provides visual feedback when targets take damage.
         */
        test('should handle damage flash effect', () => {
            target.takeDamage(25);
            
            expect(target.isFlashing).toBe(true);
            expect(target.damageFlashTimer).toBe(target.damageFlashDuration);
            
            // Simulate time passing
            target.onUpdate(0.1);
            expect(target.damageFlashTimer).toBe(target.damageFlashDuration - 0.1);
            
            // Flash should end after duration
            target.onUpdate(0.2);
            expect(target.isFlashing).toBe(false);
            expect(target.damageFlashTimer).toBe(0);
        });

        /**
         * Tests that rendering methods are called without errors.
         * Ensures visual components don't crash the game.
         */
        test('should render without errors', () => {
            const mockCtx = mockCanvas.getContext();
            
            expect(() => {
                target.render(mockCtx);
            }).not.toThrow();
            
            // Test rendering in different states
            target.takeDamage(50); // Damaged state
            expect(() => {
                target.render(mockCtx);
            }).not.toThrow();
            
            target.takeDamage(target.currentHealth); // Destroyed state
            expect(() => {
                target.render(mockCtx);
            }).not.toThrow();
        });
    });

    describe('Collision Handling', () => {
        /**
         * Tests collision response with missile entities.
         * Core gameplay mechanic for missile impacts on targets.
         */
        test('should handle collision with missiles', () => {
            const mockMissile = {
                collisionLayer: 'missiles',
                damage: 30,
                destroy: jest.fn()
            };
            
            const initialHealth = target.currentHealth;
            const wasDestroyed = target.onCollision(mockMissile);
            
            expect(target.currentHealth).toBe(initialHealth - 30);
            expect(mockMissile.destroy).toHaveBeenCalled();
            expect(wasDestroyed).toBe(false);
        });

        /**
         * Tests that targets are destroyed by sufficient missile damage.
         * Validates destruction mechanics work through collision system.
         */
        test('should be destroyed by high-damage missile collision', () => {
            const mockMissile = {
                collisionLayer: 'missiles',
                damage: target.maxHealth,
                destroy: jest.fn()
            };
            
            const wasDestroyed = target.onCollision(mockMissile);
            
            expect(target.isDestroyed).toBe(true);
            expect(wasDestroyed).toBe(true);
            expect(mockMissile.destroy).toHaveBeenCalled();
        });

        /**
         * Tests that non-missile collisions are ignored.
         * Prevents targets from taking damage from defences or other targets.
         */
        test('should ignore collisions with non-missiles', () => {
            const mockDefence = {
                collisionLayer: 'defences',
                damage: 50,
                destroy: jest.fn()
            };
            
            const initialHealth = target.currentHealth;
            target.onCollision(mockDefence);
            
            expect(target.currentHealth).toBe(initialHealth);
            expect(mockDefence.destroy).not.toHaveBeenCalled();
        });

        /**
         * Tests collision handling with missiles that have no damage property.
         * Ensures default damage is applied when missile damage is undefined.
         */
        test('should handle missiles without damage property', () => {
            const mockMissile = {
                collisionLayer: 'missiles',
                destroy: jest.fn()
            };
            
            const initialHealth = target.currentHealth;
            target.onCollision(mockMissile);
            
            expect(target.currentHealth).toBe(initialHealth - 25); // Default damage
            expect(mockMissile.destroy).toHaveBeenCalled();
        });
    });

    describe('Factory Methods', () => {
        /**
         * Tests static factory methods for creating specific AWS service targets.
         * Provides convenient API for game logic to create typed targets.
         */
        test('should create specific AWS service targets via factory methods', () => {
            const s3 = Target.createS3Bucket(10, 20);
            const lambda = Target.createLambdaFunction(30, 40);
            const rds = Target.createRDSDatabase(50, 60);
            const ec2 = Target.createEC2Instance(70, 80);
            
            expect(s3.type).toBe('s3');
            expect(s3.x).toBe(10);
            expect(s3.y).toBe(20);
            
            expect(lambda.type).toBe('lambda');
            expect(lambda.x).toBe(30);
            expect(lambda.y).toBe(40);
            
            expect(rds.type).toBe('rds');
            expect(rds.maxHealth).toBe(150);
            
            expect(ec2.type).toBe('ec2');
            expect(ec2.maxHealth).toBe(125);
        });

        /**
         * Tests that all factory methods create properly initialised targets.
         * Ensures factory methods don't skip important initialisation steps.
         */
        test('should create fully initialised targets from factory methods', () => {
            const apiGateway = Target.createAPIGateway(0, 0);
            const dynamodb = Target.createDynamoDBTable(0, 0);
            const cloudfront = Target.createCloudFrontCDN(0, 0);
            const iam = Target.createIAMService(0, 0);
            
            // All should be properly initialised
            [apiGateway, dynamodb, cloudfront, iam].forEach(target => {
                expect(target.currentHealth).toBe(target.maxHealth);
                expect(target.isDestroyed).toBe(false);
                expect(target.collisionLayer).toBe('targets');
                expect(target.serviceIcon).toBeDefined();
                expect(target.displayName).toBeDefined();
            });
        });
    });

    describe('Destruction Lifecycle', () => {
        /**
         * Tests destruction effect triggering and lifecycle management.
         * Ensures proper cleanup and visual effects when targets are destroyed.
         */
        test('should trigger destruction effects when destroyed', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            target.takeDamage(target.maxHealth);
            expect(target.isDestroyed).toBe(true);
            
            // Simulate update cycle to trigger destruction effects
            target.onUpdate(0.1);
            expect(target.destructionEffectPlayed).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith('S3 Bucket destroyed!');
            
            consoleSpy.mockRestore();
        });

        /**
         * Tests that destruction effects only play once.
         * Prevents spam of destruction effects and performance issues.
         */
        test('should only play destruction effects once', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            target.takeDamage(target.maxHealth);
            target.onUpdate(0.1); // First update - should play effect
            target.onUpdate(0.1); // Second update - should not play again
            
            expect(consoleSpy).toHaveBeenCalledTimes(1);
            consoleSpy.mockRestore();
        });
    });
});