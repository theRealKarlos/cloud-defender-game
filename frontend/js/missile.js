/**
 * Missile Entity - Threat Objects
 * Represents various types of threats targeting AWS infrastructure
 */

// Import Entity base class for Node.js testing environment only
if (
  typeof module !== 'undefined' &&
  module.exports &&
  typeof window === 'undefined'
) {
  // Node.js environment (testing)
  const { Entity } = require('./entities.js');
  global.Entity = Entity;
}
// In browser environment, Entity is already available globally from entities.js

// Missile class extending Entity
class Missile extends Entity {
  constructor(type, startX, startY, targetX, targetY) {
    // Set dimensions based on missile type
    const dimensions = Missile.getDimensionsByType(type);
    super(startX, startY, dimensions.width, dimensions.height);

    this.type = type;
    this.targetX = targetX;
    this.targetY = targetY;
    this.collisionLayer = 'missiles';

    // Movement properties
    this.speed = Missile.getSpeedByType(type);
    this.damage = Missile.getDamageByType(type);
    this.maxLifetime = 30; // 30 seconds max lifetime

    // Visual properties
    this.colour = Missile.getColourByType(type);
    this.threatIcon = Missile.getThreatIcon(type);
    this.displayName = Missile.getDisplayName(type);

    // Movement algorithm properties
    this.movementType = Missile.getMovementType(type);
    this.trajectory = this.calculateTrajectory();

    // Type-specific behaviour properties
    this.behaviourProperties = Missile.getBehaviourProperties(type);

    // Trail effect properties
    this.trailPositions = [];
    this.maxTrailLength = 8;

    // Initialize movement
    this.initializeMovement();
  }

  static getDimensionsByType(type) {
    // Slightly larger hitboxes for better collision detection
    const dimensionMap = {
      'cost-spike': { width: 20, height: 28 },
      'data-breach': { width: 24, height: 24 },
      'latency-ghost': { width: 18, height: 22 },
      'policy-violator': { width: 22, height: 26 },
    };
    return dimensionMap[type] || { width: 20, height: 24 };
  }

  static getSpeedByType(type) {
    // Missile speeds (pixels per second)
    const speedMap = {
      'cost-spike': 120, // Fast - sudden cost increases
      'data-breach': 80, // Medium - persistent threat
      'latency-ghost': 200, // Very fast - performance issues
      'policy-violator': 60, // Slow but persistent - compliance issues
    };
    return speedMap[type] || 100;
  }

  static getDamageByType(type) {
    const damageMap = {
      'cost-spike': 35, // High damage - expensive
      'data-breach': 50, // Very high damage - critical security
      'latency-ghost': 20, // Lower damage but fast
      'policy-violator': 40, // High damage - compliance violations
    };
    return damageMap[type] || 25;
  }

  static getColourByType(type) {
    const colourMap = {
      'cost-spike': '#FF6B35', // Orange-red for cost
      'data-breach': '#DC143C', // Crimson for security breach
      'latency-ghost': '#9370DB', // Purple for performance
      'policy-violator': '#FF1493', // Deep pink for policy
    };
    return colourMap[type] || '#FF4444';
  }

  static getThreatIcon(type) {
    const iconMap = {
      'cost-spike': '$',
      'data-breach': '!',
      'latency-ghost': '~',
      'policy-violator': 'X',
    };
    return iconMap[type] || '?';
  }

  static getDisplayName(type) {
    const nameMap = {
      'cost-spike': 'Cost Spike',
      'data-breach': 'Data Breach',
      'latency-ghost': 'Latency Ghost',
      'policy-violator': 'Policy Violator',
    };
    return nameMap[type] || 'Unknown Threat';
  }

  static getMovementType(type) {
    const movementMap = {
      'cost-spike': 'direct', // Straight line to target
      'data-breach': 'seeking', // Adjusts course to target
      'latency-ghost': 'erratic', // Unpredictable movement
      'policy-violator': 'slow', // Steady, predictable movement
    };
    return movementMap[type] || 'direct';
  }

  static getBehaviourProperties(type) {
    const behaviourMap = {
      'cost-spike': {
        acceleration: 1.2, // Speeds up over time
        wobble: 0,
        seekingStrength: 0,
      },
      'data-breach': {
        acceleration: 1.0,
        wobble: 0.1,
        seekingStrength: 0.8, // Strong target seeking
      },
      'latency-ghost': {
        acceleration: 0.9, // Slows down over time
        wobble: 0.5, // High wobble
        seekingStrength: 0.3,
      },
      'policy-violator': {
        acceleration: 1.0,
        wobble: 0.05, // Very slight wobble
        seekingStrength: 0.2,
      },
    };
    return (
      behaviourMap[type] || {
        acceleration: 1.0,
        wobble: 0,
        seekingStrength: 0,
      }
    );
  }

  calculateTrajectory() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return {
      directionX: dx / distance,
      directionY: dy / distance,
      distance: distance,
      originalDistance: distance,
    };
  }

  initializeMovement() {
    // Set initial velocity based on trajectory and speed
    // FASTER MOVEMENT: Speed up missiles for more challenging gameplay
    const fastSpeed = this.speed * 1.2; // Make missiles 20% faster than base speed
    this.velocityX = this.trajectory.directionX * fastSpeed;
    this.velocityY = this.trajectory.directionY * fastSpeed;

    // Type-specific initialization
    if (this.movementType === 'erratic') {
      // Add some initial randomness for erratic movement
      this.velocityX += (Math.random() - 0.5) * fastSpeed * 0.3;
      this.velocityY += (Math.random() - 0.5) * fastSpeed * 0.3;
    }
  }

  updateMovement(deltaTime) {
    const behaviour = this.behaviourProperties;

    switch (this.movementType) {
      case 'direct':
        this.updateDirectMovement(deltaTime, behaviour);
        break;
      case 'seeking':
        this.updateSeekingMovement(deltaTime, behaviour);
        break;
      case 'erratic':
        this.updateErraticMovement(deltaTime, behaviour);
        break;
      case 'slow':
        this.updateSlowMovement(deltaTime, behaviour);
        break;
    }

    // Apply acceleration (fixed to prevent exponential growth)
    if (behaviour.acceleration !== 1.0) {
      const accelerationFactor =
        1.0 + (behaviour.acceleration - 1.0) * deltaTime;
      this.velocityX *= accelerationFactor;
      this.velocityY *= accelerationFactor;
    }

    // Add wobble effect
    if (behaviour.wobble > 0) {
      const wobbleStrength = behaviour.wobble * (this.speed * 1.2);
      this.velocityX += (Math.random() - 0.5) * wobbleStrength * deltaTime;
      this.velocityY += (Math.random() - 0.5) * wobbleStrength * deltaTime;
    }
  }

  updateDirectMovement(_deltaTime, _behaviour) {
    // Direct movement maintains original trajectory
    // No additional logic needed - base velocity handles this
  }

  updateSeekingMovement(deltaTime, behaviour) {
    // Recalculate trajectory to current target position
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const targetDirectionX = dx / distance;
      const targetDirectionY = dy / distance;

      // Blend current velocity with target direction
      const seekingStrength = behaviour.seekingStrength * deltaTime;
      this.velocityX =
        this.velocityX * (1 - seekingStrength) +
        targetDirectionX * (this.speed * 1.2) * seekingStrength;
      this.velocityY =
        this.velocityY * (1 - seekingStrength) +
        targetDirectionY * (this.speed * 1.2) * seekingStrength;
    }
  }

  updateErraticMovement(deltaTime, behaviour) {
    // Add random direction changes
    const changeStrength = 0.5 * deltaTime;
    const randomAngle = Math.random() * Math.PI * 2;

    this.velocityX +=
      Math.cos(randomAngle) * (this.speed * 1.2) * changeStrength;
    this.velocityY +=
      Math.sin(randomAngle) * (this.speed * 1.2) * changeStrength;

    // Occasionally seek target to prevent complete randomness
    if (Math.random() < 0.1) {
      this.updateSeekingMovement(deltaTime, behaviour);
    }
  }

  updateSlowMovement(_deltaTime, _behaviour) {
    // Steady movement with slight course corrections
    if (Math.random() < 0.05) {
      // 5% chance per frame to adjust course
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const correctionStrength = 0.1;
        this.velocityX +=
          (dx / distance) * (this.speed * 1.2) * correctionStrength;
        this.velocityY +=
          (dy / distance) * (this.speed * 1.2) * correctionStrength;
      }
    }
  }

  updateTrail() {
    // Add current position to trail
    this.trailPositions.push({
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    });

    // Limit trail length
    if (this.trailPositions.length > this.maxTrailLength) {
      this.trailPositions.shift();
    }
  }

  hasReachedTarget() {
    const dx = this.targetX - (this.x + this.width / 2);
    const dy = this.targetY - (this.y + this.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Consider reached if within a small threshold
    return distance < 10;
  }

  isOffScreen(screenWidth, screenHeight) {
    const margin = 50; // Allow some margin for off-screen detection
    return (
      this.x < -margin ||
      this.x > screenWidth + margin ||
      this.y < -margin ||
      this.y > screenHeight + margin
    );
  }

  onUpdate(deltaTime) {
    // Update movement based on type
    this.updateMovement(deltaTime);

    // Update trail effect
    this.updateTrail();

    // Check if missile has reached its target
    if (this.hasReachedTarget()) {
      this.onTargetReached();
    }

    // Check if missile is off-screen (destroy to prevent spatial grid errors)
    if (this.isOffScreen(800, 600)) {
      this.destroy();
    }

    // Check lifetime
    if (this.age > this.maxLifetime) {
      this.destroy();
    }

    // Update rotation to face movement direction
    this.rotation = Math.atan2(this.velocityY, this.velocityX) + Math.PI / 2;
  }

  onRender(ctx) {
    // Render trail effect
    this.renderTrail(ctx);

    // Render threat icon
    this.renderThreatIcon(ctx);

    // Render type-specific effects
    this.renderTypeEffects(ctx);
  }

  renderDefault(ctx) {
    // Override default rendering with missile-specific styling
    ctx.fillStyle = this.colour;

    // Draw missile shape (pointed)
    ctx.beginPath();
    ctx.moveTo(-this.width / 2, this.height / 2); // Bottom left
    ctx.lineTo(this.width / 2, this.height / 2); // Bottom right
    ctx.lineTo(0, -this.height / 2); // Top point
    ctx.closePath();
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Add highlight
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-this.width / 4, this.height / 4);
    ctx.lineTo(this.width / 4, this.height / 4);
    ctx.lineTo(0, -this.height / 4);
    ctx.closePath();
    ctx.stroke();
  }

  renderTrail(ctx) {
    if (this.trailPositions.length < 2) return;

    ctx.save();
    ctx.strokeStyle = this.colour;
    ctx.globalAlpha = 0.6;

    for (let i = 1; i < this.trailPositions.length; i++) {
      const alpha = i / this.trailPositions.length;
      ctx.globalAlpha = alpha * 0.6;
      ctx.lineWidth = alpha * 3;

      ctx.beginPath();
      ctx.moveTo(this.trailPositions[i - 1].x, this.trailPositions[i - 1].y);
      ctx.lineTo(this.trailPositions[i].x, this.trailPositions[i].y);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderThreatIcon(ctx) {
    ctx.save();

    // Position text in centre of missile
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    // Draw icon with outline
    ctx.strokeText(
      this.threatIcon,
      this.x + this.width / 2,
      this.y + this.height / 2
    );
    ctx.fillText(
      this.threatIcon,
      this.x + this.width / 2,
      this.y + this.height / 2
    );

    ctx.restore();
  }

  renderTypeEffects(ctx) {
    // Type-specific visual effects
    switch (this.type) {
      case 'cost-spike':
        this.renderCostSpikeEffect(ctx);
        break;
      case 'data-breach':
        this.renderDataBreachEffect(ctx);
        break;
      case 'latency-ghost':
        this.renderLatencyGhostEffect(ctx);
        break;
      case 'policy-violator':
        this.renderPolicyViolatorEffect(ctx);
        break;
    }
  }

  renderCostSpikeEffect(ctx) {
    // Pulsing glow effect for cost spikes
    const pulseIntensity = Math.sin(this.age * 8) * 0.3 + 0.7;

    ctx.save();
    ctx.globalAlpha = pulseIntensity * 0.3;
    ctx.fillStyle = this.colour;
    ctx.beginPath();
    ctx.arc(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width * 0.8,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  renderDataBreachEffect(ctx) {
    // Crackling energy effect for data breaches
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.8;

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    for (let i = 0; i < 3; i++) {
      const angle = (this.age * 10 + (i * Math.PI * 2) / 3) % (Math.PI * 2);
      const length = 8 + Math.sin(this.age * 15 + i) * 4;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * length,
        centerY + Math.sin(angle) * length
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  renderLatencyGhostEffect(ctx) {
    // Ghostly transparency effect
    ctx.save();
    ctx.globalAlpha = 0.7 + Math.sin(this.age * 12) * 0.2;

    // Draw additional ghost copies
    for (let i = 1; i <= 2; i++) {
      ctx.globalAlpha = 0.3 - i * 0.1;
      const offsetX = -this.velocityX * 0.016 * i * 0.1; // Assume ~60fps (16ms)
      const offsetY = -this.velocityY * 0.016 * i * 0.1;

      ctx.fillStyle = this.colour;
      ctx.fillRect(this.x + offsetX, this.y + offsetY, this.width, this.height);
    }

    ctx.restore();
  }

  renderPolicyViolatorEffect(ctx) {
    // Warning stripes effect
    ctx.save();
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 1;

    const stripeSpacing = 4;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX - this.width / 2, centerY + i * stripeSpacing);
      ctx.lineTo(centerX + this.width / 2, centerY + i * stripeSpacing);
      ctx.stroke();
    }

    ctx.restore();
  }

  onTargetReached() {
    // Override in game logic for target impact effects
    this.destroy();
  }

  onCollision(other) {
    // Handle collisions with defences
    if (other.collisionLayer === 'defences') {
      this.onIntercepted(other);
    }
  }

  onIntercepted(_defence) {
    // Missile was intercepted by a defence
    this.playInterceptionEffect();
    this.destroy();
  }

  playInterceptionEffect() {
    // Placeholder for interception effect
    console.log(`${this.displayName} intercepted!`);
  }

  // Static factory methods for creating specific missile types
  static createCostSpike(startX, startY, targetX, targetY) {
    return new Missile('cost-spike', startX, startY, targetX, targetY);
  }

  static createDataBreach(startX, startY, targetX, targetY) {
    return new Missile('data-breach', startX, startY, targetX, targetY);
  }

  static createLatencyGhost(startX, startY, targetX, targetY) {
    return new Missile('latency-ghost', startX, startY, targetX, targetY);
  }

  static createPolicyViolator(startX, startY, targetX, targetY) {
    return new Missile('policy-violator', startX, startY, targetX, targetY);
  }

  // Utility method for random missile creation
  static createRandomMissile(startX, startY, targetX, targetY) {
    const types = [
      'cost-spike',
      'data-breach',
      'latency-ghost',
      'policy-violator',
    ];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return new Missile(randomType, startX, startY, targetX, targetY);
  }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Missile };
} else {
  // Browser global
  window.Missile = Missile;
}
