/**
 * Test Utilities
 * Shared mocks, helpers, and setup for all test files
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
        fillText: jest.fn(),
        strokeText: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        textAlign: '',
        textBaseline: '',
        font: '',
        globalAlpha: 1
    })
};

// Setup global mocks
const setupGlobalMocks = () => {
    // Mock DOM elements
    global.document = {
        getElementById: jest.fn(() => mockCanvas),
        addEventListener: jest.fn(),
        createElement: jest.fn(() => mockCanvas)
    };

    global.window = {
        devicePixelRatio: 1,
        addEventListener: jest.fn(),
        requestAnimationFrame: jest.fn(),
        cancelAnimationFrame: jest.fn()
    };

    global.performance = {
        now: jest.fn(() => Date.now())
    };
};

// Test data factories
const createTestEntity = (x = 0, y = 0, width = 32, height = 32) => {
    const { Entity } = require('../js/entities.js');
    return new Entity(x, y, width, height);
};

const createOverlappingEntities = () => {
    return [
        createTestEntity(0, 0, 32, 32),
        createTestEntity(16, 16, 32, 32) // Overlapping
    ];
};

const createNonOverlappingEntities = () => {
    return [
        createTestEntity(0, 0, 32, 32),
        createTestEntity(50, 50, 32, 32) // Not overlapping
    ];
};

// Test assertions helpers
const expectEntityDefaults = (entity, x, y, width, height) => {
    expect(entity.x).toBe(x);
    expect(entity.y).toBe(y);
    expect(entity.width).toBe(width);
    expect(entity.height).toBe(height);
    expect(entity.active).toBe(true);
    expect(entity.visible).toBe(true);
    expect(entity.collidable).toBe(true);
    expect(entity.markedForDestruction).toBe(false);
    expect(entity.age).toBe(0);
};

const expectUniqueIds = (entity1, entity2) => {
    expect(entity1.id).not.toBe(entity2.id);
    expect(entity1.id).toMatch(/^_[a-z0-9]{9}$/);
    expect(entity2.id).toMatch(/^_[a-z0-9]{9}$/);
};

module.exports = {
    mockCanvas,
    setupGlobalMocks,
    createTestEntity,
    createOverlappingEntities,
    createNonOverlappingEntities,
    expectEntityDefaults,
    expectUniqueIds
};