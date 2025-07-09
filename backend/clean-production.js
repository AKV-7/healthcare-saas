const fs = require('fs');
const path = require('path');

const filesToDelete = [
  // Test files
  'test-simple-client.js',
  'test-simple-server.js',
  'test-delete-flow.js',
  'test-delete-direct.js',
  'test-env.js',
  'test-verification.html',
  'test-simple-route.js',
  'test-both-routes.js',
  'test-user-routes.js',
  'test-route-registration.js',
  'test-templates.js',
  'test-route.js',
  'test-patient-flow.js',
  'test-registration.js',
  'test-email.js',
  
  // Debug files
  'debug-jwt.js',
  'debug-compound-query.js',
  'debug-regex.js',
  'debug-test.js',
  'debug-server.js',
  
  // Check files
  'check-current-passkey.js',
  'check-ankur.js',
  'check-available-users.js',
  'check-routes.js',
  'check-users.js',
  'check-user.js',
  
  // Other development files
  'simple-test-server.js',
  'create-test-appointments.js',
  'fix-existing-users.js',
  'register-ankur.js',
  'route-analysis.js',
  'clean-server.js',
  'comprehensive-test.js'
];

console.log('Starting cleanup of development files...');

filesToDelete.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted: ${file}`);
    } else {
      console.log(`⚠️ Not found: ${file}`);
    }
  } catch (err) {
    console.error(`❌ Error deleting ${file}:`, err.message);
  }
});

console.log('Cleanup complete!'); 