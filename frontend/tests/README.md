# Cloud Defenders - Test Suite

This directory contains all unit and integration tests for the Cloud Defenders game.

## Test Structure

### Current Tests

- **`test-utils.js`** - Shared test utilities, mocks, and helper functions
- **`entity.test.js`** - Entity class tests (movement, collision, lifecycle)
- **`entity-manager.test.js`** - EntityManager tests (CRUD, memory management)
- **`spatial-grid.test.js`** - SpatialGrid performance optimisation tests
- **`integration.test.js`** - End-to-end system integration tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (if configured)
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Organisation

Tests are organised by component for better maintainability:

### **Current Test Files:**
- **Entity Tests** - Core game object functionality (`entity.test.js`)
- **EntityManager Tests** - Game object management (`entity-manager.test.js`)
- **SpatialGrid Tests** - Collision detection optimisation (`spatial-grid.test.js`)
- **Integration Tests** - End-to-end system validation (`integration.test.js`)
- **Test Utilities** - Shared mocks and helpers (`test-utils.js`)

### **Future Test Files:**
- **Input System Tests** - Keyboard and mouse input handling
- **Rendering Tests** - Canvas rendering operations
- **Game State Tests** - State management and transitions
- **UI Manager Tests** - DOM UI element management
- **Game Loop Tests** - Frame timing and performance

## Writing New Tests

When adding new tests:

1. **Name tests descriptively** - Use clear, specific test names
2. **Group related tests** - Use `describe` blocks to organise tests
3. **Document test purpose** - Add comments explaining what each test validates
4. **Test edge cases** - Include boundary conditions and error scenarios
5. **Mock dependencies** - Use Jest mocks for external dependencies

### Test File Template

```javascript
/**
 * Tests for [System Name]
 * 
 * Brief description of what this test suite validates
 */

describe('[System Name]', () => {
    let systemInstance;

    beforeEach(() => {
        systemInstance = new SystemClass();
    });

    /**
     * Brief description of what this test validates
     */
    test('should [expected behaviour]', () => {
        // Arrange
        // Act
        // Assert
    });
});
```

## Test Coverage Goals

- **Entity System**: 100% - Critical game foundation
- **Input System**: 95% - Essential for gameplay
- **Rendering**: 90% - Visual correctness
- **Game State**: 95% - State management reliability
- **Integration**: 85% - End-to-end functionality

## Mocking Strategy

- **DOM Elements**: Mock canvas, document, window objects
- **External APIs**: Mock any external service calls
- **Time-based Functions**: Mock `performance.now()`, `requestAnimationFrame`
- **File System**: Mock any file operations (if added)

## Performance Testing

Some tests validate performance characteristics:

- **Collision Detection**: Ensures spatial grid optimisation works
- **Entity Management**: Validates memory cleanup
- **Rendering**: Checks frame rate stability (when applicable)

These tests help ensure the game performs well with hundreds of entities.