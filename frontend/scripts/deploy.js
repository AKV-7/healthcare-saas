#!/usr/bin/env node
/**
 * Deployment script for the Healthcare SaaS Project
 * This script handles the deployment of both frontend and backend
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  backendDir: path.resolve(__dirname, '../backend'),
  frontendDir: path.resolve(__dirname, '..'),
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  nodeEnv: process.env.NODE_ENV || 'production',
  backendStartTimeout: 30000, // 30 seconds
};

// Helper functions
function executeCommand(command, cwd) {
  console.log(`\n🚀 Executing: ${command}`);
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

function checkEnvFile(dir, templateFile) {
  const envPath = path.join(dir, '.env');
  const templatePath = path.join(dir, templateFile);
  
  if (!fs.existsSync(envPath) && fs.existsSync(templatePath)) {
    console.log(`⚠️ No .env file found in ${dir}. Creating from template...`);
    fs.copyFileSync(templatePath, envPath);
    console.log(`✅ Created ${envPath} from template. Please update with your actual values.`);
    return false;
  }
  
  return fs.existsSync(envPath);
}

// Main deployment steps
async function deploy() {
  console.log('🏥 Starting Healthcare SaaS Deployment');
  console.log('====================================');
  
  // 1. Check environment files
  console.log('\n📝 Checking environment files...');
  const backendEnvOk = checkEnvFile(config.backendDir, 'env.example');
  
  if (!backendEnvOk) {
    console.log('⚠️ Please update the backend .env file with your actual values and restart deployment');
    process.exit(1);
  }
  
  // 2. Install dependencies for backend
  console.log('\n📦 Installing backend dependencies...');
  if (!executeCommand('npm install --production', config.backendDir)) {
    process.exit(1);
  }
  
  // 3. Start backend server
  console.log('\n🚀 Starting backend server...');
  try {
    // Start backend server as a detached process
    const child = require('child_process').spawn('node', ['server.js'], {
      cwd: config.backendDir,
      stdio: 'ignore',
      detached: true,
    });
    child.unref();
    console.log(`✅ Backend server started with PID ${child.pid}`);
  } catch (error) {
    console.error('❌ Failed to start backend server:', error.message);
    process.exit(1);
  }
  
  // 4. Wait for backend to be ready
  console.log('\n⏳ Waiting for backend to be ready...');
  executeCommand(`node scripts/check-backend.js --url ${config.backendUrl}/api/health --retries 10 --interval 3000`, config.frontendDir);
  
  // 5. Build and start frontend
  console.log('\n🔨 Building frontend...');
  if (!executeCommand('npm install --production', config.frontendDir)) {
    process.exit(1);
  }
  
  if (!executeCommand('npm run build', config.frontendDir)) {
    process.exit(1);
  }
  
  console.log('\n🚀 Starting frontend...');
  executeCommand('npm run start', config.frontendDir);
}

// Start deployment
deploy().catch(error => {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
});
