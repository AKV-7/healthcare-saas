#!/usr/bin/env node
/**
 * This script checks if the backend API is running before starting the frontend
 * It can be used in deployment scripts or CI/CD pipelines
 * 
 * Usage: node check-backend.js [options]
 * Options:
 *  --url: The URL to check (default: http://localhost:5000/api/health)
 *  --retries: Number of retries (default: 10)
 *  --interval: Interval between retries in ms (default: 3000)
 *  --timeout: Timeout for each request in ms (default: 5000)
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const { exec } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  url: 'http://localhost:5000/api/health',
  retries: 10,
  interval: 3000,
  timeout: 5000
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    options.url = args[i + 1];
    i++;
  } else if (args[i] === '--retries' && args[i + 1]) {
    options.retries = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--interval' && args[i + 1]) {
    options.interval = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--timeout' && args[i + 1]) {
    options.timeout = parseInt(args[i + 1], 10);
    i++;
  }
}

console.log('Checking if backend API is running...');
console.log(`URL: ${options.url}`);
console.log(`Retries: ${options.retries}`);
console.log(`Interval: ${options.interval}ms`);
console.log(`Timeout: ${options.timeout}ms`);

/**
 * Check if the backend API is running
 */
function checkBackendHealth() {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(options.url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: options.timeout,
      headers: {
        'User-Agent': 'HealthCheck/1.0'
      }
    };

    const requester = urlObj.protocol === 'https:' ? https : http;
    
    const req = requester.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode, data });
        } else {
          resolve({ 
            success: false, 
            status: res.statusCode, 
            message: `API returned status code ${res.statusCode}` 
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, message: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, message: 'Request timed out' });
    });

    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  let attempt = 1;
  
  while (attempt <= options.retries) {
    console.log(`Attempt ${attempt} of ${options.retries}...`);
    
    const result = await checkBackendHealth();
    
    if (result.success) {
      console.log('\n✅ Backend API is running!');
      console.log(`Status: ${result.status}`);
      try {
        const responseData = JSON.parse(result.data);
        console.log('Response:', JSON.stringify(responseData, null, 2));
      } catch (e) {
        console.log('Response:', result.data);
      }
      process.exit(0); // Success
    }
    
    console.log(`❌ Backend API not available: ${result.message}`);
    
    if (attempt < options.retries) {
      console.log(`Waiting ${options.interval / 1000} seconds before next attempt...\n`);
      await new Promise(resolve => setTimeout(resolve, options.interval));
    }
    
    attempt++;
  }
  
  console.error('\n⛔ Failed to connect to backend API after all retries');
  process.exit(1); // Failure
}

// Start the check
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
