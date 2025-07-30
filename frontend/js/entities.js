/**
 * Entity System - Core classes for game entities
 * Provides base Entity class, EntityManager, and collision detection
 */

// Base Entity Class
class Entity {
    constructor(x = 0, y = 0, width = 32, height = 32) {
        this.id = Entity.generateId();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.rotation = 0;
        this.scale = 1;
        this.active = true;
        this.visible = true;
        this.sprite = null;
        this.colour = '#ffffff';
        
        // Lifecycle flags
        this.markedForDestruction = false;
        this.age = 0;
        
        // Collision properties
        this.collidable = true;
        this.collisionLayer = 'default';
        this.boundingBox = {
            x: 0,
            y: 0,
            width: this.width,
            height: this.height
        };
        
        this.updateBoundingBox();
    }
    
    static generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        
        // Update position based on velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Update age
        this.age += deltaTime;
        
        // Update bounding box
        this.updateBoundingBox();
        
        // Call entity-specific update logic
        this.onUpdate(deltaTime);
    }
    
    render(ctx) {
        if (!this.visible) return;
        
        ctx.save();
        
        // Apply transformations
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        
        // Render sprite or default rectangle
        if (this.sprite) {
            this.renderSprite(ctx);
        } else {
            this.renderDefault(ctx);
        }
        
        ctx.restore();
        
        // Call entity-specific render logic
        this.onRender(ctx);
    }
    
    renderSprite(ctx) {
        // Placeholder for sprite rendering
        // Will be implemented when sprite loading is added
        this.renderDefault(ctx);
    }
    
    renderDefault(ctx) {
        ctx.fillStyle = this.colour;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Draw border for visibility
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }
    
    updateBoundingBox() {
        this.boundingBox.x = this.x;
        this.boundingBox.y = this.y;
        this.boundingBox.width = this.width * this.scale;
        this.boundingBox.height = this.height * this.scale;
    }
    
    getBounds() {
        return {
            left: this.boundingBox.x,
            right: this.boundingBox.x + this.boundingBox.width,
            top: this.boundingBox.y,
            bottom: this.boundingBox.y + this.boundingBox.height,
            centerX: this.boundingBox.x + this.boundingBox.width / 2,
            centerY: this.boundingBox.y + this.boundingBox.height / 2
        };
    }
    
    isCollidingWith(other) {
        if (!this.collidable || !other.collidable || this === other) {
            return false;
        }
        
        const thisBounds = this.getBounds();
        const otherBounds = other.getBounds();
        
        return !(thisBounds.right < otherBounds.left ||
                thisBounds.left > otherBounds.right ||
                thisBounds.bottom < otherBounds.top ||
                thisBounds.top > otherBounds.bottom);
    }
    
    distanceTo(other) {
        const dx = this.getBounds().centerX - other.getBounds().centerX;
        const dy = this.getBounds().centerY - other.getBounds().centerY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    destroy() {
        this.markedForDestruction = true;
        this.active = false;
        this.onDestroy();
    }
    
    // Virtual methods for subclasses to override
    onUpdate(_deltaTime) {
        // Override in subclasses
    }
    
    onRender(_ctx) {
        // Override in subclasses for additional rendering
    }
    
    onDestroy() {
        // Override in subclasses for cleanup
    }
    
    onCollision(_other) {
        // Override in subclasses to handle collisions
    }
}

// Spatial Grid for collision detection optimisation
class SpatialGrid {
    constructor(cellSize = 64) {
        this.cellSize = cellSize;
        this.grid = new Map();
        this.entityCells = new Map(); // Track which cells each entity is in
    }
    
    addEntity(entity) {
        this.updateEntity(entity);
    }
    
    updateEntity(entity) {
        // Remove entity from old cells
        this.removeEntity(entity);
        
        // Calculate which cells the entity occupies
        const bounds = entity.getBounds();
        
        // Add bounds checking to prevent invalid coordinates
        const maxCoord = 10000; // Reasonable maximum coordinate
        if (Math.abs(bounds.left) > maxCoord || Math.abs(bounds.right) > maxCoord || 
            Math.abs(bounds.top) > maxCoord || Math.abs(bounds.bottom) > maxCoord) {
            console.warn('Entity has invalid coordinates, skipping spatial grid update');
            return;
        }
        
        const startX = Math.floor(bounds.left / this.cellSize);
        const endX = Math.floor(bounds.right / this.cellSize);
        const startY = Math.floor(bounds.top / this.cellSize);
        const endY = Math.floor(bounds.bottom / this.cellSize);
        
        // Additional safety check
        if (endX - startX > 100 || endY - startY > 100 || 
            !isFinite(startX) || !isFinite(endX) || !isFinite(startY) || !isFinite(endY)) {
            console.warn('Entity has invalid grid coordinates, skipping spatial grid update', {startX, endX, startY, endY});
            return;
        }
        
        const cells = [];
        
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const cellKey = `${x},${y}`;
                cells.push(cellKey);
                
                if (!this.grid.has(cellKey)) {
                    this.grid.set(cellKey, new Set());
                }
                this.grid.get(cellKey).add(entity);
            }
        }
        
        this.entityCells.set(entity.id, cells);
    }
    
    removeEntity(entity) {
        const cells = this.entityCells.get(entity.id);
        if (cells) {
            cells.forEach(cellKey => {
                const cell = this.grid.get(cellKey);
                if (cell) {
                    cell.delete(entity);
                    if (cell.size === 0) {
                        this.grid.delete(cellKey);
                    }
                }
            });
            this.entityCells.delete(entity.id);
        }
    }
    
    getPotentialCollisions() {
        const pairs = new Set();
        const collisions = [];
        
        for (const cell of this.grid.values()) {
            const entities = Array.from(cell);
            
            for (let i = 0; i < entities.length; i++) {
                for (let j = i + 1; j < entities.length; j++) {
                    const entity1 = entities[i];
                    const entity2 = entities[j];
                    const pairKey = entity1.id < entity2.id ? 
                        `${entity1.id}-${entity2.id}` : 
                        `${entity2.id}-${entity1.id}`;
                    
                    if (!pairs.has(pairKey)) {
                        pairs.add(pairKey);
                        collisions.push([entity1, entity2]);
                    }
                }
            }
        }
        
        return collisions;
    }
    
    clear() {
        this.grid.clear();
        this.entityCells.clear();
    }
}

// Entity Manager Class
class EntityManager {
    constructor() {
        this.entities = new Map();
        this.entitiesByLayer = new Map();
        this.entitiesToAdd = [];
        this.entitiesToRemove = [];
        
        // Collision detection optimisation
        this.spatialGrid = new SpatialGrid(64); // 64px grid cells
    }
    
    addEntity(entity, layer = 'default') {
        this.entitiesToAdd.push({ entity, layer });
    }
    
    removeEntity(entityId) {
        this.entitiesToRemove.push(entityId);
    }
    
    getEntity(entityId) {
        return this.entities.get(entityId);
    }
    
    getEntitiesByLayer(layer) {
        return this.entitiesByLayer.get(layer) || [];
    }
    
    getAllEntities() {
        return Array.from(this.entities.values());
    }
    
    update(deltaTime) {
        // Process entities to add
        this.entitiesToAdd.forEach(({ entity, layer }) => {
            this.entities.set(entity.id, entity);
            
            if (!this.entitiesByLayer.has(layer)) {
                this.entitiesByLayer.set(layer, []);
            }
            this.entitiesByLayer.get(layer).push(entity);
            
            // Add to spatial grid
            this.spatialGrid.addEntity(entity);
        });
        this.entitiesToAdd = [];
        
        // Update all entities
        for (const entity of this.entities.values()) {
            if (entity.active) {
                entity.update(deltaTime);
                
                // Update spatial grid position
                this.spatialGrid.updateEntity(entity);
            }
        }
        
        // Process entities to remove and those marked for destruction
        const toRemove = [...this.entitiesToRemove];
        for (const entity of this.entities.values()) {
            if (entity.markedForDestruction) {
                toRemove.push(entity.id);
            }
        }
        
        toRemove.forEach(entityId => {
            const entity = this.entities.get(entityId);
            if (entity) {
                // Remove from spatial grid
                this.spatialGrid.removeEntity(entity);
                
                // Remove from layer collections
                for (const layerEntities of this.entitiesByLayer.values()) {
                    const index = layerEntities.indexOf(entity);
                    if (index !== -1) {
                        layerEntities.splice(index, 1);
                    }
                }
                
                // Remove from main collection
                this.entities.delete(entityId);
            }
        });
        this.entitiesToRemove = [];
    }
    
    render(ctx) {
        // Render entities by layer for proper z-ordering
        const layerOrder = ['background', 'targets', 'missiles', 'countermeasures', 'defences', 'effects', 'ui'];
        
        for (const layer of layerOrder) {
            const layerEntities = this.entitiesByLayer.get(layer);
            if (layerEntities) {
                layerEntities.forEach(entity => {
                    if (entity.visible) {
                        entity.render(ctx);
                    }
                });
            }
        }
        
        // Render any entities not in specific layers
        for (const entity of this.entities.values()) {
            let inLayer = false;
            for (const layerEntities of this.entitiesByLayer.values()) {
                if (layerEntities.includes(entity)) {
                    inLayer = true;
                    break;
                }
            }
            if (!inLayer && entity.visible) {
                entity.render(ctx);
            }
        }
    }
    
    checkCollisions() {
        const collisions = [];
        
        // Use spatial grid for efficient collision detection
        const potentialCollisions = this.spatialGrid.getPotentialCollisions();
        
        for (const [entity1, entity2] of potentialCollisions) {
            if (entity1.isCollidingWith(entity2)) {
                collisions.push([entity1, entity2]);
                
                // Notify entities of collision
                entity1.onCollision(entity2);
                entity2.onCollision(entity1);
            }
        }
        
        return collisions;
    }
    
    clear() {
        this.entities.clear();
        this.entitiesByLayer.clear();
        this.entitiesToAdd = [];
        this.entitiesToRemove = [];
        this.spatialGrid.clear();
    }
    
    getEntityCount() {
        return this.entities.size;
    }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Entity, EntityManager, SpatialGrid };
} else {
    // Browser global
    window.Entity = Entity;
    window.EntityManager = EntityManager;
    window.SpatialGrid = SpatialGrid;
}