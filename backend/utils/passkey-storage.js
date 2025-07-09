const fs = require('fs');
const path = require('path');

// File to store the current admin passkey
const PASSKEY_FILE = path.join(__dirname, '..', 'config', 'admin-passkey.json');

// Ensure config directory exists
const configDir = path.dirname(PASSKEY_FILE);
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Get current admin passkey
function getCurrentAdminPasskey() {
  try {
    // First try to read from file
    if (fs.existsSync(PASSKEY_FILE)) {
      const data = fs.readFileSync(PASSKEY_FILE, 'utf8');
      const config = JSON.parse(data);
      if (config.passkey) {
        return config.passkey;
      }
    }
  } catch (error) {
    console.warn('Error reading admin passkey file:', error.message);
  }
  
  // Fallback to environment variable or default
  return process.env.ADMIN_PASSKEY || '111111';
}

// Set new admin passkey
function setAdminPasskey(newPasskey) {
  try {
    const config = {
      passkey: newPasskey,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(PASSKEY_FILE, JSON.stringify(config, null, 2));
    
    // Also update the process environment for this session
    process.env.ADMIN_PASSKEY = newPasskey;
    
    return true;
  } catch (error) {
    console.error('Error saving admin passkey:', error.message);
    return false;
  }
}

module.exports = {
  getCurrentAdminPasskey,
  setAdminPasskey
};
