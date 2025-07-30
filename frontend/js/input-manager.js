/**
 * Input State Management
 * Handles keyboard and mouse input for the game
 */

class InputManager {
    constructor() {
        this.keys = new Map();
        this.mouse = {
            x: 0,
            y: 0,
            isPressed: false,
            justPressed: false,
            justReleased: false
        };
        this.previousMouseState = false;
    }
    
    update() {
        // Update mouse state for frame-based detection
        this.mouse.justPressed = this.mouse.isPressed && !this.previousMouseState;
        this.mouse.justReleased = !this.mouse.isPressed && this.previousMouseState;
        this.previousMouseState = this.mouse.isPressed;
    }
    
    isKeyPressed(key) {
        return this.keys.get(key) || false;
    }
    
    setKeyState(key, pressed) {
        this.keys.set(key, pressed);
    }
    
    updateMousePosition(x, y) {
        this.mouse.x = x;
        this.mouse.y = y;
    }
    
    setMousePressed(pressed) {
        this.mouse.isPressed = pressed;
    }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InputManager };
} else {
    window.InputManager = InputManager;
}