/**
 * Event Handler
 * Manages all DOM event listeners and input handling
 */

class EventHandler {
    constructor(canvas, inputManager, gameCallbacks) {
        this.canvas = canvas;
        this.inputManager = inputManager;
        this.callbacks = gameCallbacks;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Canvas mouse events
        this.canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
        this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        this.canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        this.canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
        
        // Keyboard events
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
        
        // Window events
        window.addEventListener('blur', () => this.handleWindowBlur());
        window.addEventListener('focus', () => this.handleWindowFocus());
        window.addEventListener('resize', () => this.handleWindowResize());
    }
    
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        console.log(`Canvas clicked at: (${x}, ${y})`);
        
        if (this.callbacks.onCanvasClick) {
            this.callbacks.onCanvasClick(x, y, event);
        }
    }
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.inputManager.updateMousePosition(x, y);
    }
    
    handleMouseDown(event) {
        this.inputManager.setMousePressed(true);
        event.preventDefault();
    }
    
    handleMouseUp(event) {
        this.inputManager.setMousePressed(false);
        event.preventDefault();
    }
    
    handleKeyDown(event) {
        this.inputManager.setKeyState(event.code, true);
        
        // Handle special key combinations
        switch (event.code) {
        case 'Space':
            event.preventDefault();
            if (this.callbacks.onSpaceKey) {
                this.callbacks.onSpaceKey();
            }
            break;
        case 'KeyR':
            event.preventDefault();
            if (this.callbacks.onRestartKey) {
                this.callbacks.onRestartKey();
            }
            break;
        case 'Escape':
            event.preventDefault();
            if (this.callbacks.onEscapeKey) {
                this.callbacks.onEscapeKey();
            }
            break;
        }
    }
    
    handleKeyUp(event) {
        this.inputManager.setKeyState(event.code, false);
    }
    
    handleWindowBlur() {
        if (this.callbacks.onWindowBlur) {
            this.callbacks.onWindowBlur();
        }
    }
    
    handleWindowFocus() {
        if (this.callbacks.onWindowFocus) {
            this.callbacks.onWindowFocus();
        }
    }
    
    handleWindowResize() {
        if (this.callbacks.onWindowResize) {
            this.callbacks.onWindowResize();
        }
    }
    
    destroy() {
        // Remove event listeners to prevent memory leaks
        this.canvas.removeEventListener('click', this.handleCanvasClick);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        window.removeEventListener('blur', this.handleWindowBlur);
        window.removeEventListener('focus', this.handleWindowFocus);
        window.removeEventListener('resize', this.handleWindowResize);
    }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventHandler };
} else {
    window.EventHandler = EventHandler;
}