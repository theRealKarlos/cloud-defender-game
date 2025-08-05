/**
 * Target Entity - AWS Service Targets
 * Represents AWS infrastructure components that need to be defended
 */

// Import Entity base class for Node.js testing environment only
if (
    typeof module !== 'undefined' &&
  module.exports &&
  typeof window === 'undefined'
) {
    // Node.js environment (testing)
    const { Entity } = require('./entities.js');
    const { AWSIcons } = require('./aws-icons.js');
    global.Entity = Entity;
    global.AWSIcons = AWSIcons;
}
// In browser environment, Entity and AWSIcons are already available globally

// Target class extending Entity
class Target extends Entity {
    constructor(type, x, y) {
    // Set dimensions based on target type
        const dimensions = Target.getDimensionsByType(type);
        super(x, y, dimensions.width, dimensions.height);

        this.type = type;
        this.maxHealth = Target.getHealthByType(type);
        this.currentHealth = this.maxHealth;
        this.collisionLayer = 'targets';

        // Visual properties
        this.colour = Target.getColourByType(type);
        this.healthBarHeight = 8; // Make health bar taller
        this.healthBarOffset = -12; // Move it further up

        // Damage effects
        this.damageFlashTimer = 0;
        this.damageFlashDuration = 0.2; // 200ms flash
        this.isFlashing = false;

        // Service-specific properties
        this.serviceIcon = Target.getServiceIcon(type);
        this.displayName = Target.getDisplayName(type);

        // State tracking
        this.isDestroyed = false;
        this.destructionEffectPlayed = false;
    }

    static getHealthByType(type) {
        const healthMap = {
            s3: 100,
            lambda: 75,
            rds: 150,
            ec2: 125,
            apigateway: 90,
            dynamodb: 120,
            cloudfront: 110,
            iam: 80
        };
        return healthMap[type] || 100;
    }

    static getDimensionsByType(type) {
    // Different AWS services have different visual sizes
        const dimensionMap = {
            s3: { width: 48, height: 48 },
            lambda: { width: 40, height: 40 },
            rds: { width: 56, height: 48 },
            ec2: { width: 52, height: 44 },
            apigateway: { width: 44, height: 40 },
            dynamodb: { width: 50, height: 46 },
            cloudfront: { width: 48, height: 42 },
            iam: { width: 42, height: 42 }
        };
        return dimensionMap[type] || { width: 48, height: 48 };
    }

    static getColourByType(type) {
    // Use AWS Icons colour scheme for consistency
        if (typeof AWSIcons !== 'undefined') {
            return AWSIcons.getServiceColour(type);
        }

        // Fallback colour scheme if AWSIcons not available
        const colourMap = {
            s3: '#FF9900', // S3 orange
            lambda: '#FF9900', // Lambda orange
            rds: '#3F48CC', // RDS blue
            ec2: '#FF9900', // EC2 orange
            apigateway: '#FF4B4B', // API Gateway red
            dynamodb: '#3F48CC', // DynamoDB blue
            cloudfront: '#9D5AAE', // CloudFront purple
            iam: '#DD344C' // IAM red
        };
        return colourMap[type] || '#888888';
    }

    static getServiceIcon(type) {
    // Simple text representations for now - can be replaced with actual icons
        const iconMap = {
            s3: 'S3',
            lambda: 'λ',
            rds: 'DB',
            ec2: 'EC2',
            apigateway: 'API',
            dynamodb: 'DDB',
            cloudfront: 'CDN',
            iam: 'IAM'
        };
        return iconMap[type] || '?';
    }

    static getDisplayName(type) {
        const nameMap = {
            s3: 'S3 Bucket',
            lambda: 'Lambda Function',
            rds: 'RDS Database',
            ec2: 'EC2 Instance',
            apigateway: 'API Gateway',
            dynamodb: 'DynamoDB Table',
            cloudfront: 'CloudFront CDN',
            iam: 'IAM Service'
        };
        return nameMap[type] || 'Unknown Service';
    }

    takeDamage(amount) {
        if (this.isDestroyed) return false;

        this.currentHealth = Math.max(0, this.currentHealth - amount);

        // Trigger damage flash effect
        this.damageFlashTimer = this.damageFlashDuration;
        this.isFlashing = true;

        // Check if target is destroyed
        if (this.currentHealth <= 0) {
            this.isDestroyed = true;
            this.onTargetDestroyed();
            return true; // Target was destroyed
        }

        return false; // Target survived
    }

    heal(amount) {
        if (this.isDestroyed) return;

        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    getHealthPercentage() {
        return this.currentHealth / this.maxHealth;
    }

    isHealthy() {
        return this.getHealthPercentage() > 0.7;
    }

    isDamaged() {
        return (
            this.getHealthPercentage() <= 0.7 && this.getHealthPercentage() > 0.3
        );
    }

    isCritical() {
        return this.getHealthPercentage() <= 0.3 && !this.isDestroyed;
    }

    onUpdate(deltaTime) {
    // Update damage flash effect
        if (this.isFlashing) {
            this.damageFlashTimer -= deltaTime;
            if (this.damageFlashTimer <= 0) {
                this.isFlashing = false;
                this.damageFlashTimer = 0;
            }
        }

        // Handle destruction
        if (this.isDestroyed && !this.destructionEffectPlayed) {
            this.playDestructionEffect();
            this.destructionEffectPlayed = true;

            // Mark for removal after a short delay to show destruction effect
            setTimeout(() => {
                this.destroy();
            }, 500);
        }
    }

    onRender(ctx) {
    // Render health bar
        this.renderHealthBar(ctx);

        // Render service icon/text
        this.renderServiceIcon(ctx);

        // Render damage effects
        if (this.isFlashing) {
            this.renderDamageFlash(ctx);
        }

        // Render destruction effects
        if (this.isDestroyed) {
            this.renderDestructionEffect(ctx);
        }
    }

    renderDefault(ctx) {
    // Create a subtle background for the AWS icon
        let backgroundColour = this.colour;

        // Modify background based on health status
        if (this.isCritical()) {
            backgroundColour = '#FF4444'; // Red for critical health
        } else if (this.isDamaged()) {
            backgroundColour = '#FFAA44'; // Orange for damaged
        }

        // Apply damage flash effect
        if (this.isFlashing) {
            backgroundColour = '#FFFFFF'; // White flash
        }

        // Draw subtle background (more transparent to let icon show through)
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = backgroundColour;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.globalAlpha = 1.0;

        // Draw border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Add inner highlight for 3D effect (more subtle)
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            -this.width / 2 + 2,
            -this.height / 2 + 2,
            this.width - 4,
            this.height - 4
        );
        ctx.globalAlpha = 1.0;
    }

    renderHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = this.healthBarHeight;
        const barX = this.x;
        const barY = this.y + this.healthBarOffset;

        // Background (red)
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health (green to red gradient based on health)
        const healthPercent = this.getHealthPercentage();
        const healthWidth = barWidth * healthPercent;

        if (healthPercent > 0.5) {
            ctx.fillStyle = '#44FF44'; // Green
        } else if (healthPercent > 0.25) {
            ctx.fillStyle = '#FFFF44'; // Yellow
        } else {
            ctx.fillStyle = '#FF8844'; // Orange
        }

        ctx.fillRect(barX, barY, healthWidth, barHeight);

        // Border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    renderServiceIcon(ctx) {
        ctx.save();

        // Use AWS Icons if available, otherwise fall back to text
        if (typeof AWSIcons !== 'undefined') {
            const iconSize = Math.min(this.width, this.height) * 0.8;
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            AWSIcons.renderIcon(ctx, this.type, centerX, centerY, iconSize);
        } else {
            // Fallback to text rendering
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;

            // Draw text with outline
            ctx.strokeText(
                this.serviceIcon,
                this.x + this.width / 2,
                this.y + this.height / 2
            );
            ctx.fillText(
                this.serviceIcon,
                this.x + this.width / 2,
                this.y + this.height / 2
            );
        }

        ctx.restore();
    }

    renderDamageFlash(ctx) {
    // Additional white overlay for damage flash
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        ctx.restore();
    }

    renderDestructionEffect(ctx) {
    // Simple destruction effect - can be enhanced with particles later
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#FF0000';

        // Draw explosion-like effect
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radius = Math.max(this.width, this.height) / 2 + 10;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    playDestructionEffect() {
    // Placeholder for destruction effect
    // Could trigger particle effects, sound, screen shake, etc.
        console.log(`${this.displayName} destroyed!`);
    }

    onTargetDestroyed() {
    // Override in subclasses or game logic for specific destruction behaviour
    // Could award points, trigger events, etc.
    }

    onCollision(other) {
    // Handle collisions with missiles
        if (other.collisionLayer === 'missiles') {
            const wasDestroyed = this.takeDamage(other.damage || 25);

            // Destroy the missile that hit us
            other.destroy();

            // Store destruction info for game engine to process
            if (wasDestroyed) {
                this.justDestroyed = true;
            }

            return wasDestroyed;
        }
    }

    // Static factory methods for creating specific AWS service targets
    static createS3Bucket(x, y) {
        return new Target('s3', x, y);
    }

    static createLambdaFunction(x, y) {
        return new Target('lambda', x, y);
    }

    static createRDSDatabase(x, y) {
        return new Target('rds', x, y);
    }

    static createEC2Instance(x, y) {
        return new Target('ec2', x, y);
    }

    static createAPIGateway(x, y) {
        return new Target('apigateway', x, y);
    }

    static createDynamoDBTable(x, y) {
        return new Target('dynamodb', x, y);
    }

    static createCloudFrontCDN(x, y) {
        return new Target('cloudfront', x, y);
    }

    static createIAMService(x, y) {
        return new Target('iam', x, y);
    }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Target };
} else {
    // Browser global
    window.Target = Target;
}
