/**
 * ExplosiveBomb - Missile Command Style Countermeasure
 * Travels to a target location and explodes, destroying missiles within radius
 */

// Import Entity base class for Node.js testing environment only
if (
  typeof module !== "undefined" &&
  module.exports &&
  typeof window === "undefined"
) {
  // Node.js environment (testing)
  const { Entity } = require("./entities.js");
  global.Entity = Entity;
}
// In browser environment, Entity is already available globally from entities.js

class ExplosiveBomb extends Entity {
  constructor(startX, startY, targetX, targetY) {
    super(startX, startY, 8, 8); // Small bomb size

    this.targetX = targetX;
    this.targetY = targetY;
    this.collisionLayer = "countermeasures";

    // Movement properties
    this.speed = 300; // Fast travel to target
    this.hasReachedTarget = false;
    this.isExploding = false;
    this.hasExploded = false;

    // Explosion properties
    this.explosionRadius = 0;
    this.maxExplosionRadius = 50; // 50 pixel radius as requested
    this.explosionGrowthRate = 50; // 50 pixels per second (reaches max in 1 second)
    this.explosionDuration = 1.0; // Explosion lasts 1 second as requested
    this.explosionTimer = 0;

    // Visual properties
    this.colour = "#FFD700"; // Gold color for bomb
    this.explosionColour = "#FF6B35"; // Orange-red explosion

    // Calculate trajectory
    this.trajectory = this.calculateTrajectory();
    this.initializeMovement();
  }

  calculateTrajectory() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return {
      directionX: dx / distance,
      directionY: dy / distance,
      distance: distance,
    };
  }

  initializeMovement() {
    // Set velocity towards target
    this.velocityX = this.trajectory.directionX * this.speed;
    this.velocityY = this.trajectory.directionY * this.speed;
  }

  hasReachedTargetPosition() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Consider reached if within small threshold
    return distance < 5;
  }

  startExplosion() {
    this.hasReachedTarget = true;
    this.isExploding = true;
    this.velocityX = 0;
    this.velocityY = 0;
    this.explosionTimer = 0;
    this.explosionRadius = 10; // Start with visible size
    this.visible = true; // ENSURE bomb stays visible during explosion
  }

  updateExplosion(deltaTime) {
    this.explosionTimer += deltaTime;

    // Grow explosion radius
    if (this.explosionTimer < this.explosionDuration) {
      const progress = this.explosionTimer / this.explosionDuration;
      // Use easing function for realistic explosion growth
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      this.explosionRadius = this.maxExplosionRadius * easedProgress;

      // Debug log every 0.1 seconds
      if (
        Math.floor(this.explosionTimer * 10) !==
        Math.floor((this.explosionTimer - deltaTime) * 10)
      ) {
        // Progress tracking for debugging if needed
        // console.log(`Explosion progress: ${Math.round(progress * 100)}%, radius: ${Math.round(this.explosionRadius)}px`);
      }
    } else {
      // Explosion finished
      this.explosionRadius = this.maxExplosionRadius;
      this.hasExploded = true;

      this.destroy();
    }
  }

  getMissilesInExplosionRadius(entityManager) {
    if (!this.isExploding || this.explosionRadius <= 0) {
      return [];
    }

    const missiles = entityManager.getEntitiesByLayer("missiles");
    const destroyedMissiles = [];

    missiles.forEach((missile) => {
      const dx = missile.x + missile.width / 2 - (this.x + this.width / 2);
      const dy = missile.y + missile.height / 2 - (this.y + this.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.explosionRadius) {
        destroyedMissiles.push(missile);
      }
    });

    return destroyedMissiles;
  }

  onUpdate(deltaTime) {
    if (!this.hasReachedTarget) {
      // Check if bomb has reached target
      if (this.hasReachedTargetPosition()) {
        this.startExplosion();
      }
    } else if (this.isExploding) {
      // Update explosion
      this.updateExplosion(deltaTime);
    }
  }

  render(ctx) {
    if (!this.visible) return;

    if (!this.hasReachedTarget) {
      // Render traveling bomb
      this.renderTravelingBomb(ctx);
    } else if (this.isExploding) {
      // Render explosion
      this.renderExplosion(ctx);
    }
  }

  onRender(ctx) {
    // Not used - we override the full render method
  }

  renderDefault(ctx) {
    // Not used - we override the full render method
  }

  renderTravelingBombTransformed(ctx) {
    // Draw bomb as bright dot with trail effect
    // Coordinates are already transformed by Entity base class

    // Outer glow
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = this.colour;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2); // Center at (0,0) due to transformation
    ctx.fill();

    // Inner bright core
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2); // Center at (0,0) due to transformation
    ctx.fill();
  }

  renderTravelingBomb(ctx) {
    ctx.save();

    // Draw bomb as bright dot with trail effect
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Outer glow
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = this.colour;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderExplosion(ctx) {
    if (this.explosionRadius <= 0) return;

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // SUPER SIMPLE: Just draw a bright solid circle
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.explosionRadius, 0, Math.PI * 2);
    ctx.fill();

    // Also draw a thick white border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.explosionRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Static factory method
  static create(startX, startY, targetX, targetY) {
    return new ExplosiveBomb(startX, startY, targetX, targetY);
  }
}

// Export for Node.js (testing) and browser
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ExplosiveBomb };
} else {
  // Browser global
  window.ExplosiveBomb = ExplosiveBomb;
}
