#!/usr/bin/env node

/**
 * Update API Configuration Script
 * Automatically updates the frontend API service with the correct API Gateway URL
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function updateApiConfig() {
    try {
        console.log('Getting API URL from Terraform...');
        
        // Get the API URL from Terraform outputs
        const infraDir = path.join(__dirname, '..', '..', 'infra');
        const apiUrl = execSync('terraform output -raw api_gateway_url', { 
            cwd: infraDir,
            encoding: 'utf8' 
        }).trim();
        
        console.log('Found API URL:', apiUrl);
        
        // Generate new config.json file
        const configPath = path.join(__dirname, '..', '..', 'frontend', 'config.json');
        
        const configData = {
            apiBaseUrl: apiUrl,
            timeout: 10000,
            version: '1.0.0',
            features: {
                scoreValidation: true,
                leaderboard: true,
                realTimeUpdates: false
            }
        };
        
        console.log('Generating config.json with API URL:', apiUrl);
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
        console.log('Updated config.json successfully');
        
        console.log('API configuration updated successfully!');
        console.log('New API URL:', apiUrl);
        
        return true;
        
    } catch (error) {
        console.error('Error updating API configuration:', error.message);
        
        if (error.message.includes('terraform output')) {
            console.log('Make sure you have deployed the infrastructure first:');
            console.log('   cd infra && terraform apply');
        }
        
        return false;
    }
}

// Run the update
updateApiConfig().then(success => {
    process.exit(success ? 0 : 1);
});