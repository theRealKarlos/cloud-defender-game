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
        const apiUrl = execSync('terraform output -raw api_gateway_url', { 
            cwd: path.join(__dirname, '..', 'infra'),
            encoding: 'utf8' 
        }).trim();
        
        console.log('Found API URL:', apiUrl);
        
        // Read and update the config file
        const configPath = path.join(__dirname, '..', 'frontend', 'js', 'config.js');
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        // Update the baseUrl in config.js
        const configUrlRegex = /baseUrl:\s*['"`][^'"`]*['"`]/;
        const newConfigUrl = `baseUrl: '${apiUrl}'`;
        
        if (configUrlRegex.test(configContent)) {
            configContent = configContent.replace(configUrlRegex, newConfigUrl);
            console.log('Updated baseUrl in config.js');
            fs.writeFileSync(configPath, configContent);
        } else {
            console.error('Could not find baseUrl pattern in config.js');
            return false;
        }
        
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