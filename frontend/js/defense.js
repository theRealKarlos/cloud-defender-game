/**
 * Defense Entity - Countermeasure Systems
 * Represents defensive systems that can intercept incoming threats
 */

// IIFE (Immediately Invoked Function Expression) for module encapsulation
(function (global, Entity) {
  // Defense class extending Entity
  class Defense extends Entity {
    constructor(type, x, y) {
      // Set dimensions based on defense type
      const dimensions = Defense.getDimensionsByType(type);
      super(x, y, dimensions.width, dimensions.height);

      this.type = type;
      this.collisionLayer = 'defences';

      // Combat properties
      this.range = Defense.getRangeByType(type);
      this.damage = Defense.getDamageByType(type);
      this.cooldownTime = Defense.getCooldownByType(type);
      this.currentCooldown = 0;

      // Visual properties
      this.colour = Defense.getColourByType(type);
      this.defenseIcon = Defense.getDefenseIcon(type);
      this.displayName = Defense.getDisplayName(type);

      // Targeting properties
      this.currentTarget = null;
      this.targetingMode = Defense.getTargetingMode(type);
      this.projectileSpeed = Defense.getProjectileSpeed(type);

      // State management
      this.isActive = true;
      this.isCharging = false;
      this.chargeTime = 0;
      this.maxChargeTime = Defense.getChargeTime(type);

      // Visual effects
      this.rangeIndicatorVisible = false;
      this.firingEffectTimer = 0;
      this.firingEffectDuration = 0.3;

      // Shield node properties (if applicable)
      this.isShieldNode = Defense.isShieldNodeType(type);
      this.shieldEnergy = this.isShieldNode ? 100 : 0;
      this.maxShieldEnergy = 100;

      // Deployment mechanics
      this.deploymentCost = Defense.getDeploymentCost(type);
      this.isDeployed = true; // Assume deployed by default

      // Performance tracking
      this.shotsfired = 0;
      this.hits = 0;
      this.threatsDestroyed = 0;
    }

    static getDimensionsByType(type) {
      const dimensionMap = {
        firewall: { width: 32, height: 32 },
        antivirus: { width: 28, height: 28 },
        waf: { width: 36, height: 30 }, // Web Application Firewall
        'ddos-protection': { width: 40, height: 35 },
        encryption: { width: 30, height: 30 },
        monitoring: { width: 34, height: 32 },
        backup: { width: 38, height: 34 },
        'shield-node': { width: 24, height: 24 },
      };
      return dimensionMap[type] || { width: 32, height: 32 };
    }

    static getRangeByType(type) {
      const rangeMap = {
        firewall: 80,
        antivirus: 60,
        waf: 70,
        'ddos-protection': 100,
        encryption: 50,
        monitoring: 120, // Long range detection
        backup: 40, // Short range but powerful
        'shield-node': 60,
      };
      return rangeMap[type] || 80;
    }

    static getDamageByType(type) {
      const damageMap = {
        firewall: 30,
        antivirus: 40, // High damage against specific threats
        waf: 25,
        'ddos-protection': 20, // Lower damage but area effect
        encryption: 35,
        monitoring: 15, // Low damage but reveals threats
        backup: 50, // High damage but slow
        'shield-node': 20,
      };
      return damageMap[type] || 30;
    }

    static getCooldownByType(type) {
      const cooldownMap = {
        firewall: 1.0, // 1 second cooldown
        antivirus: 1.5,
        waf: 0.8,
        'ddos-protection': 2.0, // Slower but powerful
        encryption: 1.2,
        monitoring: 0.5, // Fast scanning
        backup: 3.0, // Very slow but powerful
        'shield-node': 0.6,
      };
      return cooldownMap[type] || 1.0;
    }

    static getColourByType(type) {
      const colourMap = {
        firewall: '#FF6B35', // Orange-red
        antivirus: '#4CAF50', // Green
        waf: '#2196F3', // Blue
        'ddos-protection': '#9C27B0', // Purple
        encryption: '#FFC107', // Amber
        monitoring: '#607D8B', // Blue grey
        backup: '#795548', // Brown
        'shield-node': '#00BCD4', // Cyan
      };
      return colourMap[type] || '#888888';
    }

    static getDefenseIcon(type) {
      const iconMap = {
        firewall: 'SHIELD',
        antivirus: 'SCAN',
        waf: 'WEB',
        'ddos-protection': 'BOLT',
        encryption: 'LOCK',
        monitoring: 'EYE',
        backup: '💾',
        'shield-node': '◉',
      };
      return iconMap[type] || '?';
    }

    static getDisplayName(type) {
      const nameMap = {
        firewall: 'Firewall',
        antivirus: 'Antivirus',
        waf: 'Web App Firewall',
        'ddos-protection': 'DDoS Protection',
        encryption: 'Encryption',
        monitoring: 'Monitoring',
        backup: 'Backup System',
        'shield-node': 'Shield Node',
      };
      return nameMap[type] || 'Unknown Defense';
    }

    static getTargetingMode(type) {
      const targetingMap = {
        firewall: 'nearest',
        antivirus: 'strongest', // Target highest damage threats
        waf: 'fastest', // Target fastest threats
        'ddos-protection': 'multiple', // Can target multiple threats
        encryption: 'nearest',
        monitoring: 'all', // Reveals all threats in range
        backup: 'strongest',
        'shield-node': 'nearest',
      };
      return targetingMap[type] || 'nearest';
    }

    static getProjectileSpeed(type) {
      const speedMap = {
        firewall: 300,
        antivirus: 250,
        waf: 350,
        'ddos-protection': 200, // Slower but area effect
        encryption: 280,
        monitoring: 400, // Fast scanning beam
        backup: 150, // Slow but powerful
        'shield-node': 320,
      };
      return speedMap[type] || 300;
    }

    static getChargeTime(type) {
      const chargeMap = {
        firewall: 0.2,
        antivirus: 0.3,
        waf: 0.15,
        'ddos-protection': 0.5,
        encryption: 0.25,
        monitoring: 0.1,
        backup: 0.8,
        'shield-node': 0.2,
      };
      return chargeMap[type] || 0.2;
    }

    static isShieldNodeType(type) {
      return type === 'shield-node';
    }

    static getDeploymentCost(type) {
      const costMap = {
        firewall: 50,
        antivirus: 60,
        waf: 45,
        'ddos-protection': 80,
        encryption: 55,
        monitoring: 40,
        backup: 70,
        'shield-node': 30,
      };
      return costMap[type] || 50;
    }

    findTargetsInRange(entities) {
      const targets = [];
      const _defenseCenter = {
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
      };

      for (const entity of entities) {
        if (entity.collisionLayer === 'missiles' && entity.active) {
          const distance = this.distanceTo(entity);
          if (distance <= this.range) {
            targets.push({
              entity: entity,
              distance: distance,
              threat: this.calculateThreatLevel(entity),
            });
          }
        }
      }

      return targets;
    }

    calculateThreatLevel(missile) {
      // Calculate threat level based on missile properties
      let threat = missile.damage || 25;

      // Factor in missile speed (faster = more threatening)
      const speed = Math.sqrt(missile.velocityX ** 2 + missile.velocityY ** 2);
      threat += speed * 0.1;

      // Factor in missile type
      const typeMultipliers = {
        'data-breach': 1.5, // High priority
        'cost-spike': 1.2,
        'policy-violator': 1.3,
        'latency-ghost': 0.8, // Lower priority due to lower damage
      };
      threat *= typeMultipliers[missile.type] || 1.0;

      return threat;
    }

    selectTarget(targets) {
      if (targets.length === 0) return null;

      switch (this.targetingMode) {
        case 'nearest':
          return targets.reduce((closest, current) =>
            current.distance < closest.distance ? current : closest
          ).entity;

        case 'strongest':
          return targets.reduce((strongest, current) =>
            current.threat > strongest.threat ? current : strongest
          ).entity;

        case 'fastest':
          return targets.reduce((fastest, current) => {
            const currentSpeed = Math.sqrt(
              current.entity.velocityX ** 2 + current.entity.velocityY ** 2
            );
            const fastestSpeed = Math.sqrt(
              fastest.entity.velocityX ** 2 + fastest.entity.velocityY ** 2
            );
            return currentSpeed > fastestSpeed ? current : fastest;
          }).entity;

        case 'multiple':
          // Return array of up to 3 targets for multi-targeting
          return targets
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
            .map((t) => t.entity);

        case 'all':
          // Return all targets for monitoring/revealing
          return targets.map((t) => t.entity);

        default:
          return targets[0].entity;
      }
    }

    canFire() {
      return (
        this.isActive &&
        this.isDeployed &&
        this.currentCooldown <= 0 &&
        (this.isShieldNode ? this.shieldEnergy > 20 : true)
      );
    }

    canStartCharging() {
      return this.canFire() && !this.isCharging;
    }

    startCharging() {
      if (!this.canStartCharging()) return false;

      this.isCharging = true;
      this.chargeTime = 0;
      return true;
    }

    fire(target) {
      if (!target) return null;

      // Start charging if not already charging and can start charging
      if (!this.isCharging && this.canStartCharging()) {
        this.startCharging();
        return null;
      }

      // Check if charge is complete
      if (!this.isCharging || this.chargeTime < this.maxChargeTime) {
        return null;
      }

      // Final check - can we actually fire now?
      if (!this.canFire()) {
        return null;
      }

      // Create projectile
      const projectile = this.createProjectile(target);

      // Reset state
      this.isCharging = false;
      this.chargeTime = 0;
      this.currentCooldown = this.cooldownTime;
      this.firingEffectTimer = this.firingEffectDuration;

      // Consume shield energy if applicable
      if (this.isShieldNode) {
        this.shieldEnergy = Math.max(0, this.shieldEnergy - 20);
      }

      // Update statistics
      this.shotsfired++;

      return projectile;
    }

    createProjectile(target) {
      const startX = this.x + this.width / 2;
      const startY = this.y + this.height / 2;
      const targetX = target.x + target.width / 2;
      const targetY = target.y + target.height / 2;

      return new DefenseProjectile(
        this.type,
        startX,
        startY,
        targetX,
        targetY,
        this.damage,
        this.projectileSpeed,
        this
      );
    }

    updateCooldown(deltaTime) {
      if (this.currentCooldown > 0) {
        this.currentCooldown = Math.max(0, this.currentCooldown - deltaTime);
      }
    }

    updateCharging(deltaTime) {
      if (this.isCharging) {
        this.chargeTime += deltaTime;
      }
    }

    updateShieldEnergy(deltaTime) {
      if (this.isShieldNode && this.shieldEnergy < this.maxShieldEnergy) {
        // Regenerate shield energy over time
        this.shieldEnergy = Math.min(
          this.maxShieldEnergy,
          this.shieldEnergy + 10 * deltaTime
        );
      }
    }

    updateEffects(deltaTime) {
      if (this.firingEffectTimer > 0) {
        this.firingEffectTimer = Math.max(
          0,
          this.firingEffectTimer - deltaTime
        );
      }
    }

    onUpdate(deltaTime) {
      this.updateCooldown(deltaTime);
      this.updateCharging(deltaTime);
      this.updateShieldEnergy(deltaTime);
      this.updateEffects(deltaTime);
    }

    onRender(ctx) {
      // Render range indicator if visible
      if (this.rangeIndicatorVisible) {
        this.renderRangeIndicator(ctx);
      }

      // Render defense icon
      this.renderDefenseIcon(ctx);

      // Render status indicators
      this.renderStatusIndicators(ctx);

      // Render charging effect
      if (this.isCharging) {
        this.renderChargingEffect(ctx);
      }

      // Render firing effect
      if (this.firingEffectTimer > 0) {
        this.renderFiringEffect(ctx);
      }

      // Render shield energy for shield nodes
      if (this.isShieldNode) {
        this.renderShieldEnergy(ctx);
      }
    }

    renderDefault(ctx) {
      // Override default rendering with defense-specific styling
      let renderColour = this.colour;

      // Modify colour based on state
      if (!this.isActive) {
        renderColour = '#666666'; // Grey for inactive
      } else if (this.currentCooldown > 0) {
        renderColour = '#FFAA44'; // Orange for cooldown
      } else if (this.isCharging) {
        renderColour = '#44AAFF'; // Blue for charging
      }

      ctx.fillStyle = renderColour;

      if (this.isShieldNode) {
        // Draw shield node as circle
        ctx.beginPath();
        ctx.arc(
          this.x + this.width / 2,
          this.y + this.height / 2,
          this.width / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else {
        // Draw regular defense as rectangle
        ctx.fillRect(
          -this.width / 2,
          -this.height / 2,
          this.width,
          this.height
        );
      }

      // Draw border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      if (this.isShieldNode) {
        ctx.beginPath();
        ctx.arc(
          this.x + this.width / 2,
          this.y + this.height / 2,
          this.width / 2,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else {
        ctx.strokeRect(
          -this.width / 2,
          -this.height / 2,
          this.width,
          this.height
        );
      }
    }

    renderRangeIndicator(ctx) {
      ctx.save();
      ctx.strokeStyle = this.colour;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.range,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      ctx.restore();
    }

    renderDefenseIcon(ctx) {
      ctx.save();

      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

      // Check if we have AWS icons available and if this defense type has an icon
      if (
        window.AwsIcons &&
        this.defenseIcon !== '💾' &&
        this.defenseIcon !== '◉'
      ) {
        try {
          // Use AWS icon if available
          const icon = window.AwsIcons.getIcon(this.defenseIcon);
          if (icon) {
            // Scale icon to fit defense size
            const iconSize = Math.min(this.width, this.height) * 0.6;
            icon.draw(
              ctx,
              centerX - iconSize / 2,
              centerY - iconSize / 2,
              iconSize,
              iconSize
            );
          } else {
            // Fallback to text if icon not found
            this.renderTextIcon(ctx, centerX, centerY);
          }
        } catch (error) {
          console.warn(
            'Failed to render AWS icon, falling back to text:',
            error
          );
          this.renderTextIcon(ctx, centerX, centerY);
        }
      } else {
        // Use text rendering for special characters (backup, shield-node)
        this.renderTextIcon(ctx, centerX, centerY);
      }

      ctx.restore();
    }

    /**
     * Render defense icon as text (fallback method)
     * Used for special characters or when AWS icons are unavailable
     */
    renderTextIcon(ctx, centerX, centerY) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 10px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;

      // Draw icon with outline
      ctx.strokeText(this.defenseIcon, centerX, centerY);
      ctx.fillText(this.defenseIcon, centerX, centerY);
    }

    renderStatusIndicators(ctx) {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

      // Cooldown indicator
      if (this.currentCooldown > 0) {
        const cooldownPercent = this.currentCooldown / this.cooldownTime;
        const angle = cooldownPercent * Math.PI * 2;

        ctx.save();
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          this.width / 2 + 4,
          -Math.PI / 2,
          -Math.PI / 2 + angle
        );
        ctx.stroke();
        ctx.restore();
      }
    }

    renderChargingEffect(ctx) {
      const chargePercent = this.chargeTime / this.maxChargeTime;
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

      ctx.save();
      ctx.strokeStyle = '#44AAFF';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;

      // Draw charging ring
      const angle = chargePercent * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        this.width / 2 + 6,
        -Math.PI / 2,
        -Math.PI / 2 + angle
      );
      ctx.stroke();

      // Draw charging particles
      for (let i = 0; i < 4; i++) {
        const particleAngle =
          (this.age * 5 + (i * Math.PI) / 2) % (Math.PI * 2);
        const radius = this.width / 2 + 8 + Math.sin(this.age * 10) * 2;
        const particleX = centerX + Math.cos(particleAngle) * radius;
        const particleY = centerY + Math.sin(particleAngle) * radius;

        ctx.fillStyle = '#44AAFF';
        ctx.beginPath();
        ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    renderFiringEffect(ctx) {
      const effectPercent =
        1 - this.firingEffectTimer / this.firingEffectDuration;
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.8 * (1 - effectPercent);

      // Draw muzzle flash
      const flashRadius = this.width / 2 + effectPercent * 10;
      ctx.beginPath();
      ctx.arc(centerX, centerY, flashRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    renderShieldEnergy(ctx) {
      const energyPercent = this.shieldEnergy / this.maxShieldEnergy;
      const barWidth = this.width;
      const barHeight = 3;
      const barX = this.x;
      const barY = this.y - 8;

      // Background
      ctx.fillStyle = '#333333';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Energy bar
      ctx.fillStyle = energyPercent > 0.5 ? '#00BCD4' : '#FF9800';
      ctx.fillRect(barX, barY, barWidth * energyPercent, barHeight);

      // Border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    showRangeIndicator() {
      this.rangeIndicatorVisible = true;
    }

    hideRangeIndicator() {
      this.rangeIndicatorVisible = false;
    }

    toggleRangeIndicator() {
      this.rangeIndicatorVisible = !this.rangeIndicatorVisible;
    }

    activate() {
      this.isActive = true;
    }

    deactivate() {
      this.isActive = false;
      this.isCharging = false;
      this.currentTarget = null;
    }

    getEfficiency() {
      return this.shotsfired > 0 ? this.hits / this.shotsfired : 0;
    }

    getStats() {
      return {
        shotsfired: this.shotsfired,
        hits: this.hits,
        threatsDestroyed: this.threatsDestroyed,
        efficiency: this.getEfficiency(),
      };
    }

    // Static factory methods for creating specific defense types
    static createFirewall(x, y) {
      return new Defense('firewall', x, y);
    }

    static createAntivirus(x, y) {
      return new Defense('antivirus', x, y);
    }

    static createWAF(x, y) {
      return new Defense('waf', x, y);
    }

    static createDDoSProtection(x, y) {
      return new Defense('ddos-protection', x, y);
    }

    static createEncryption(x, y) {
      return new Defense('encryption', x, y);
    }

    static createMonitoring(x, y) {
      return new Defense('monitoring', x, y);
    }

    static createBackup(x, y) {
      return new Defense('backup', x, y);
    }

    static createShieldNode(x, y) {
      return new Defense('shield-node', x, y);
    }
  }

  // DefenseProjectile class for defense system projectiles
  class DefenseProjectile extends Entity {
    constructor(
      defenseType,
      startX,
      startY,
      targetX,
      targetY,
      damage,
      speed,
      sourceDefense
    ) {
      super(startX, startY, 4, 8); // Small projectile size

      this.defenseType = defenseType;
      this.targetX = targetX;
      this.targetY = targetY;
      this.damage = damage;
      this.speed = speed;
      this.sourceDefense = sourceDefense;
      this.collisionLayer = 'defences';

      // Calculate trajectory
      const dx = targetX - startX;
      const dy = targetY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      this.velocityX = (dx / distance) * speed;
      this.velocityY = (dy / distance) * speed;

      // Visual properties
      this.colour = sourceDefense.colour;
      this.maxLifetime = 5; // 5 seconds max

      // Set rotation to face movement direction
      this.rotation = Math.atan2(this.velocityY, this.velocityX);
    }

    onUpdate(_deltaTime) {
      // Check if reached target area
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 5) {
        this.destroy();
      }

      // Destroy if too old
      if (this.age > this.maxLifetime) {
        this.destroy();
      }
    }

    onCollision(other) {
      if (other.collisionLayer === 'missiles') {
        // Hit a missile
        other.takeDamage ? other.takeDamage(this.damage) : other.destroy();

        // Update source defense statistics
        if (this.sourceDefense) {
          this.sourceDefense.hits++;
          if (other.markedForDestruction) {
            this.sourceDefense.threatsDestroyed++;
          }
        }

        this.destroy();
      }
    }

    renderDefault(ctx) {
      // Draw projectile as small line/bullet
      ctx.fillStyle = this.colour;
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

      // Add glow effect
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(
        -this.width / 4,
        -this.height / 4,
        this.width / 2,
        this.height / 2
      );
      ctx.restore();
    }
  }

  // Export for Node.js (testing) and browser
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Defense, DefenseProjectile };
  } else {
    // Browser global
    window.Defense = Defense;
    window.DefenseProjectile = DefenseProjectile;
  }

  // Close the IIFE and pass the appropriate Entity dependency
})(
  typeof window !== 'undefined' ? window : global,
  typeof require !== 'undefined' &&
    typeof module !== 'undefined' &&
    module.exports
    ? require('./entities.js').Entity
    : typeof window !== 'undefined'
      ? window.Entity
      : global.Entity
);
