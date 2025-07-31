#!/usr/bin/env node

/**
 * Deployment script to update API configuration
 * Usage: node scripts/update-config.js --api-url https://your-api-url.com --environment production
 */

const fs = require("fs");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(name);
  return index !== -1 ? args[index + 1] : null;
};

const apiUrl = getArg("--api-url");
const environment = getArg("--environment") || "production";

if (!apiUrl) {
  console.error("Error: --api-url is required");
  console.log(
    "Usage: node scripts/update-config.js --api-url https://your-api-url.com --environment production"
  );
  process.exit(1);
}

// Path to config file
const configPath = path.join(__dirname, "../frontend/js/config.js");

try {
  // Read current config file
  let configContent = fs.readFileSync(configPath, "utf8");

  // Update API_BASE_URL
  configContent = configContent.replace(
    /API_BASE_URL:\s*['"][^'"]*['"]/,
    `API_BASE_URL: '${apiUrl}'`
  );

  // Update environment
  configContent = configContent.replace(
    /ENVIRONMENT:\s*['"][^'"]*['"]/,
    `ENVIRONMENT: '${environment}'`
  );

  // Write updated config
  fs.writeFileSync(configPath, configContent);

  console.log(`✅ Configuration updated successfully:`);
  console.log(`   API URL: ${apiUrl}`);
  console.log(`   Environment: ${environment}`);
} catch (error) {
  console.error("❌ Error updating configuration:", error.message);
  process.exit(1);
}
