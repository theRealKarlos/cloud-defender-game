/**
 * AWS Service Icons
 * Canvas-based rendering of AWS service icons that match the official AWS icon style
 */

class AWSIcons {
  /**
   * Render S3 bucket icon
   * Orange bucket with curved top
   */
  static renderS3Icon(ctx, x, y, size = 32) {
    ctx.save();
    ctx.translate(x, y);

    const scale = size / 32;
    ctx.scale(scale, scale);

    // S3 bucket body (orange)
    ctx.fillStyle = '#FF9900';
    ctx.fillRect(-12, -8, 24, 16);

    // Bucket rim (darker orange)
    ctx.fillStyle = '#E67E00';
    ctx.beginPath();
    ctx.ellipse(0, -8, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bucket bottom
    ctx.beginPath();
    ctx.ellipse(0, 8, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight on bucket
    ctx.fillStyle = '#FFB84D';
    ctx.fillRect(-10, -6, 4, 12);

    // S3 text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S3', 0, 0);

    ctx.restore();
  }

  /**
   * Render Lambda function icon
   * Orange lambda symbol with modern styling
   */
  static renderLambdaIcon(ctx, x, y, size = 32) {
    ctx.save();
    ctx.translate(x, y);

    const scale = size / 32;
    ctx.scale(scale, scale);

    // Background circle
    ctx.fillStyle = '#FF9900';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // Lambda symbol
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    // Left leg of lambda
    ctx.moveTo(-8, 10);
    ctx.lineTo(-2, -6);
    // Right leg of lambda
    ctx.lineTo(4, 4);
    ctx.lineTo(8, -10);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render RDS database icon
   * Blue cylindrical database with multiple layers
   */
  static renderRDSIcon(ctx, x, y, size = 32) {
    ctx.save();
    ctx.translate(x, y);

    const scale = size / 32;
    ctx.scale(scale, scale);

    // Database cylinder body
    ctx.fillStyle = '#3F48CC';
    ctx.fillRect(-10, -8, 20, 16);

    // Database layers (ellipses)
    const layers = [-8, -2, 4, 8];
    layers.forEach((layerY, index) => {
      ctx.fillStyle =
        index === 0 || index === layers.length - 1 ? '#5A67D8' : '#4C51BF';
      ctx.beginPath();
      ctx.ellipse(0, layerY, 10, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Highlight
    ctx.fillStyle = '#7C83DB';
    ctx.fillRect(-8, -6, 3, 12);

    // DB text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 7px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DB', 0, 0);

    ctx.restore();
  }

  /**
   * Render EC2 instance icon
   * Orange server/computer icon
   */
  static renderEC2Icon(ctx, x, y, size = 32) {
    ctx.save();
    ctx.translate(x, y);

    const scale = size / 32;
    ctx.scale(scale, scale);

    // Server body
    ctx.fillStyle = '#FF9900';
    ctx.fillRect(-12, -10, 24, 20);

    // Server front panel
    ctx.fillStyle = '#FFB84D';
    ctx.fillRect(-10, -8, 20, 16);

    // Server slots/drives
    ctx.fillStyle = '#E67E00';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-8, -6 + i * 4, 16, 2);
    }

    // Power LED
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(8, -6, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // EC2 text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 6px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EC2', 0, 6);

    ctx.restore();
  }

  /**
   * Render API Gateway icon
   * Purple/pink gateway with connection points
   */
  static renderAPIGatewayIcon(ctx, x, y, size = 32) {
    ctx.save();
    ctx.translate(x, y);

    const scale = size / 32;
    ctx.scale(scale, scale);

    // Gateway body
    ctx.fillStyle = '#FF4B4B';
    ctx.fillRect(-10, -6, 20, 12);

    // Connection points
    ctx.fillStyle = '#FF6B6B';
    const points = [
      [-12, 0],
      [12, 0],
      [0, -8],
      [0, 8],
    ];
    points.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Connection lines
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();

    // API text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 6px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('API', 0, 0);

    ctx.restore();
  }

  /**
   * Render DynamoDB icon
   * Blue NoSQL database with dynamic styling
   */
  static renderDynamoDBIcon(ctx, x, y, size = 32) {
    ctx.save();
    ctx.translate(x, y);

    const scale = size / 32;
    ctx.scale(scale, scale);

    // Main database shape (hexagonal)
    ctx.fillStyle = '#3F48CC';
    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.lineTo(8, -10);
    ctx.lineTo(12, 0);
    ctx.lineTo(8, 10);
    ctx.lineTo(-8, 10);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = '#5A67D8';
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(6, -8);
    ctx.lineTo(9, 0);
    ctx.lineTo(6, 8);
    ctx.lineTo(-6, 8);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();

    // DynamoDB lightning bolt
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.lineTo(2, -2);
    ctx.lineTo(-1, 0);
    ctx.lineTo(3, 6);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render CloudFront CDN icon
   * Purple globe with network connections
   */
  static renderCloudFrontIcon(ctx, x, y, size = 32) {
    ctx.save();
    ctx.translate(x, y);

    const scale = size / 32;
    ctx.scale(scale, scale);

    // Globe background
    ctx.fillStyle = '#9D5AAE';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Globe grid lines
    ctx.strokeStyle = '#B87CC7';
    ctx.lineWidth = 1;

    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 12);
    ctx.moveTo(-6, -10);
    ctx.bezierCurveTo(-6, -5, -6, 5, -6, 10);
    ctx.moveTo(6, -10);
    ctx.bezierCurveTo(6, -5, 6, 5, 6, 10);
    ctx.stroke();

    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.moveTo(-10, -6);
    ctx.bezierCurveTo(-5, -6, 5, -6, 10, -6);
    ctx.moveTo(-10, 6);
    ctx.bezierCurveTo(-5, 6, 5, 6, 10, 6);
    ctx.stroke();

    // Network nodes
    ctx.fillStyle = '#FFFFFF';
    const nodes = [
      [-8, -4],
      [8, -4],
      [-6, 6],
      [6, 6],
    ];
    nodes.forEach(([nx, ny]) => {
      ctx.beginPath();
      ctx.arc(nx, ny, 1, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * Render IAM service icon
   * Red shield with user/security symbol
   */
  static renderIAMIcon(ctx, x, y, size = 32) {
    ctx.save();
    ctx.translate(x, y);

    const scale = size / 32;
    ctx.scale(scale, scale);

    // Shield shape
    ctx.fillStyle = '#DD344C';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.bezierCurveTo(-8, -12, -10, -8, -10, -4);
    ctx.bezierCurveTo(-10, 4, -6, 8, 0, 12);
    ctx.bezierCurveTo(6, 8, 10, 4, 10, -4);
    ctx.bezierCurveTo(10, -8, 8, -12, 0, -12);
    ctx.fill();

    // Inner shield highlight
    ctx.fillStyle = '#E85A6D';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.bezierCurveTo(-6, -10, -8, -6, -8, -2);
    ctx.bezierCurveTo(-8, 2, -4, 6, 0, 10);
    ctx.bezierCurveTo(4, 6, 8, 2, 8, -2);
    ctx.bezierCurveTo(8, -6, 6, -10, 0, -10);
    ctx.fill();

    // User icon inside shield
    ctx.fillStyle = '#FFFFFF';
    // Head
    ctx.beginPath();
    ctx.arc(0, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(0, 2, 4, Math.PI, 0);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Main render function that dispatches to specific icon renderers
   */
  static renderIcon(ctx, serviceType, x, y, size = 32) {
    switch (serviceType) {
      case 's3':
        this.renderS3Icon(ctx, x, y, size);
        break;
      case 'lambda':
        this.renderLambdaIcon(ctx, x, y, size);
        break;
      case 'rds':
        this.renderRDSIcon(ctx, x, y, size);
        break;
      case 'ec2':
        this.renderEC2Icon(ctx, x, y, size);
        break;
      case 'apigateway':
        this.renderAPIGatewayIcon(ctx, x, y, size);
        break;
      case 'dynamodb':
        this.renderDynamoDBIcon(ctx, x, y, size);
        break;
      case 'cloudfront':
        this.renderCloudFrontIcon(ctx, x, y, size);
        break;
      case 'iam':
        this.renderIAMIcon(ctx, x, y, size);
        break;
      default:
        // Fallback to generic service icon
        this.renderGenericServiceIcon(ctx, x, y, size);
        break;
    }
  }

  /**
   * Generic service icon for unknown services
   */
  static renderGenericServiceIcon(ctx, x, y, size = 32) {
    ctx.save();
    ctx.translate(x, y);

    const scale = size / 32;
    ctx.scale(scale, scale);

    // Generic AWS orange box
    ctx.fillStyle = '#FF9900';
    ctx.fillRect(-10, -10, 20, 20);

    // AWS logo-style highlight
    ctx.fillStyle = '#FFB84D';
    ctx.fillRect(-8, -8, 4, 16);

    // Question mark
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, 0);

    ctx.restore();
  }

  /**
   * Get the primary colour for a service (useful for health bars, etc.)
   */
  static getServiceColour(serviceType) {
    const colourMap = {
      s3: '#FF9900', // S3 orange
      lambda: '#FF9900', // Lambda orange
      rds: '#3F48CC', // RDS blue
      ec2: '#FF9900', // EC2 orange
      apigateway: '#FF4B4B', // API Gateway red
      dynamodb: '#3F48CC', // DynamoDB blue
      cloudfront: '#9D5AAE', // CloudFront purple
      iam: '#DD344C', // IAM red
    };
    return colourMap[serviceType] || '#888888';
  }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AWSIcons };
} else {
  window.AWSIcons = AWSIcons;
}
