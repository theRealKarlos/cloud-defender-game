/**
 * Unit Tests for AWS Icons
 * Tests AWS service icon rendering functionality
 */

const { AWSIcons } = require('../js/aws-icons.js');

// Mock Canvas Context for testing
class MockCanvasContext {
  constructor() {
    this.operations = [];
    this.state = {
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      globalAlpha: 1.0,
    };
    this.transformStack = [];
  }

  // Canvas state methods
  save() {
    this.operations.push({ type: 'save' });
    this.transformStack.push({ ...this.state });
  }

  restore() {
    this.operations.push({ type: 'restore' });
    if (this.transformStack.length > 0) {
      this.state = this.transformStack.pop();
    }
  }

  translate(x, y) {
    this.operations.push({ type: 'translate', x, y });
  }

  scale(x, y) {
    this.operations.push({ type: 'scale', x, y });
  }

  // Drawing methods
  fillRect(x, y, width, height) {
    this.operations.push({
      type: 'fillRect',
      x,
      y,
      width,
      height,
      fillStyle: this.state.fillStyle,
    });
  }

  strokeRect(x, y, width, height) {
    this.operations.push({
      type: 'strokeRect',
      x,
      y,
      width,
      height,
      strokeStyle: this.state.strokeStyle,
      lineWidth: this.state.lineWidth,
    });
  }

  beginPath() {
    this.operations.push({ type: 'beginPath' });
  }

  closePath() {
    this.operations.push({ type: 'closePath' });
  }

  moveTo(x, y) {
    this.operations.push({ type: 'moveTo', x, y });
  }

  lineTo(x, y) {
    this.operations.push({ type: 'lineTo', x, y });
  }

  arc(x, y, radius, startAngle, endAngle) {
    this.operations.push({
      type: 'arc',
      x,
      y,
      radius,
      startAngle,
      endAngle,
    });
  }

  ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle) {
    this.operations.push({
      type: 'ellipse',
      x,
      y,
      radiusX,
      radiusY,
      rotation,
      startAngle,
      endAngle,
    });
  }

  bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    this.operations.push({
      type: 'bezierCurveTo',
      cp1x,
      cp1y,
      cp2x,
      cp2y,
      x,
      y,
    });
  }

  fill() {
    this.operations.push({
      type: 'fill',
      fillStyle: this.state.fillStyle,
    });
  }

  stroke() {
    this.operations.push({
      type: 'stroke',
      strokeStyle: this.state.strokeStyle,
      lineWidth: this.state.lineWidth,
    });
  }

  fillText(text, x, y) {
    this.operations.push({
      type: 'fillText',
      text,
      x,
      y,
      fillStyle: this.state.fillStyle,
      font: this.state.font,
      textAlign: this.state.textAlign,
      textBaseline: this.state.textBaseline,
    });
  }

  strokeText(text, x, y) {
    this.operations.push({
      type: 'strokeText',
      text,
      x,
      y,
      strokeStyle: this.state.strokeStyle,
      font: this.state.font,
      textAlign: this.state.textAlign,
      textBaseline: this.state.textBaseline,
    });
  }

  // Property setters
  set fillStyle(value) {
    this.state.fillStyle = value;
  }

  get fillStyle() {
    return this.state.fillStyle;
  }

  set strokeStyle(value) {
    this.state.strokeStyle = value;
  }

  get strokeStyle() {
    return this.state.strokeStyle;
  }

  set lineWidth(value) {
    this.state.lineWidth = value;
  }

  get lineWidth() {
    return this.state.lineWidth;
  }

  set font(value) {
    this.state.font = value;
  }

  get font() {
    return this.state.font;
  }

  set textAlign(value) {
    this.state.textAlign = value;
  }

  get textAlign() {
    return this.state.textAlign;
  }

  set textBaseline(value) {
    this.state.textBaseline = value;
  }

  get textBaseline() {
    return this.state.textBaseline;
  }

  set globalAlpha(value) {
    this.state.globalAlpha = value;
  }

  get globalAlpha() {
    return this.state.globalAlpha;
  }

  set lineCap(value) {
    this.state.lineCap = value;
  }

  set lineJoin(value) {
    this.state.lineJoin = value;
  }

  // Helper methods for testing
  getOperationsByType(type) {
    return this.operations.filter((op) => op.type === type);
  }

  hasOperation(type) {
    return this.operations.some((op) => op.type === type);
  }

  getLastOperation() {
    return this.operations[this.operations.length - 1];
  }

  reset() {
    this.operations = [];
    this.transformStack = [];
    this.state = {
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      globalAlpha: 1.0,
    };
  }
}

describe('AWSIcons', () => {
  let mockCtx;

  beforeEach(() => {
    mockCtx = new MockCanvasContext();
  });

  describe('Service Colour Mapping', () => {
    test('should return correct colours for AWS services', () => {
      expect(AWSIcons.getServiceColour('s3')).toBe('#FF9900');
      expect(AWSIcons.getServiceColour('lambda')).toBe('#FF9900');
      expect(AWSIcons.getServiceColour('rds')).toBe('#3F48CC');
      expect(AWSIcons.getServiceColour('ec2')).toBe('#FF9900');
      expect(AWSIcons.getServiceColour('apigateway')).toBe('#FF4B4B');
      expect(AWSIcons.getServiceColour('dynamodb')).toBe('#3F48CC');
      expect(AWSIcons.getServiceColour('cloudfront')).toBe('#9D5AAE');
      expect(AWSIcons.getServiceColour('iam')).toBe('#DD344C');
    });

    test('should return default colour for unknown service', () => {
      expect(AWSIcons.getServiceColour('unknown')).toBe('#888888');
    });
  });

  describe('Icon Rendering', () => {
    test('should render S3 icon with correct operations', () => {
      AWSIcons.renderS3Icon(mockCtx, 0, 0, 32);

      expect(mockCtx.hasOperation('save')).toBe(true);
      expect(mockCtx.hasOperation('restore')).toBe(true);
      expect(mockCtx.hasOperation('translate')).toBe(true);
      expect(mockCtx.hasOperation('scale')).toBe(true);
      expect(mockCtx.hasOperation('fillRect')).toBe(true);
      expect(mockCtx.hasOperation('fillText')).toBe(true);

      // Check that S3 text is rendered
      const textOps = mockCtx.getOperationsByType('fillText');
      expect(textOps.some((op) => op.text === 'S3')).toBe(true);
    });

    test('should render Lambda icon with lambda symbol', () => {
      AWSIcons.renderLambdaIcon(mockCtx, 0, 0, 32);

      expect(mockCtx.hasOperation('save')).toBe(true);
      expect(mockCtx.hasOperation('restore')).toBe(true);
      expect(mockCtx.hasOperation('arc')).toBe(true); // Circle background
      expect(mockCtx.hasOperation('stroke')).toBe(true); // Lambda symbol
    });
  });

  describe('Main Render Function', () => {
    test('should dispatch to correct icon renderer', () => {
      const services = ['s3', 'lambda', 'rds', 'ec2'];

      services.forEach((service) => {
        mockCtx.reset();
        AWSIcons.renderIcon(mockCtx, service, 0, 0, 32);

        // Each service should have save/restore operations
        expect(mockCtx.hasOperation('save')).toBe(true);
        expect(mockCtx.hasOperation('restore')).toBe(true);
      });
    });

    test('should render generic icon for unknown service', () => {
      AWSIcons.renderIcon(mockCtx, 'unknown-service', 0, 0, 32);

      expect(mockCtx.hasOperation('save')).toBe(true);
      expect(mockCtx.hasOperation('restore')).toBe(true);
      expect(mockCtx.hasOperation('fillRect')).toBe(true);

      // Check that question mark is rendered
      const textOps = mockCtx.getOperationsByType('fillText');
      expect(textOps.some((op) => op.text === '?')).toBe(true);
    });
  });

  describe('Icon Scaling', () => {
    test('should scale icons correctly based on size parameter', () => {
      AWSIcons.renderS3Icon(mockCtx, 0, 0, 64); // Double size

      const scaleOps = mockCtx.getOperationsByType('scale');
      expect(scaleOps.length).toBeGreaterThan(0);

      // Should scale by 2 (64/32)
      expect(scaleOps[0].x).toBe(2);
      expect(scaleOps[0].y).toBe(2);
    });
  });

  describe('Icon Positioning', () => {
    test('should position icons correctly', () => {
      const positions = [
        [0, 0],
        [100, 50],
        [-25, 75],
      ];

      positions.forEach(([x, y]) => {
        mockCtx.reset();
        AWSIcons.renderIcon(mockCtx, 's3', x, y, 32);

        const translateOps = mockCtx.getOperationsByType('translate');
        expect(translateOps.length).toBeGreaterThan(0);
        expect(translateOps[0].x).toBe(x);
        expect(translateOps[0].y).toBe(y);
      });
    });
  });
});
