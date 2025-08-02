/**
 * Configuration for Cloud Defenders Game
 * This file is automatically updated by deployment scripts
 */

window.API_CONFIG = {
  // API Gateway URL - updated automatically during deployment
  baseUrl: "https://n8zszsigg3.execute-api.eu-west-2.amazonaws.com/dev",

  // API configuration
  timeout: 10000,
  version: "1.0.0",

  // Feature flags
  features: {
    scoreValidation: true,
    leaderboard: true,
    realTimeUpdates: false,
  },
};
