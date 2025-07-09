const express = require('express');
const { body, query, validationResult } = require('express-validator');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getDoctors,
  getUserStats,
  toggleUserStatus
} = require('../controllers/user.controller');
const { protect, authorize, authorizeSuperAdmin, authorizeAdminLevel, authorizeHospitalManager, checkOwnership } = require('../middleware/auth');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const Appointment = require('../models/Appointment');
const { adminLimiter } = require('../middleware/rateLimit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Public route for verifying existing patients (no authentication required)
router.get('/verify/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    const user = await User.findOne({ userId: userId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (user.email !== email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email does not match' 
      });
    }
    
    if (user.role !== 'patient') {
      return res.status(400).json({ 
        success: false, 
        message: 'This account is not registered as a patient' 
      });
    }
    
    res.json({
      success: true,
      data: {
        _id: user._id,
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Error verifying existing patient:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying patient' 
    });
  }
});

// Public route for retrieving user ID by email and phone (no authentication required)
router.post('/forgot-user-id', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid email and phone number',
        errors: errors.array()
      });
    }
    
    // Find user by email and phone
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      phone: phone,
      role: 'patient'
    }).select('userId firstName lastName email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No patient found with the provided email and phone number. Please check your details and try again.'
      });
    }
    
    // In a real application, you would send an email/SMS here
    // For now, we'll return the user ID directly
    logger.info(`User ID retrieved for: ${email}`);
    
    res.status(200).json({
      success: true,
      message: 'User ID found successfully',
      data: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
    
  } catch (error) {
    logger.error('Forgot user ID error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving your user ID. Please try again.'
    });
  }
});

// Public route for verifying existing patients by name and phone (no authentication required)
router.post('/verify-by-name-phone', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('phone').matches(/^\+91[6-9]\d{9}$/).withMessage('Please provide a valid Indian mobile number with +91')
], async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid name and phone number',
        errors: errors.array()
      });
    }
    
    // Find user by name and phone (case-insensitive name search)
    const user = await User.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      phone: phone.trim(),
      role: 'patient'
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found with the provided name and phone number' 
      });
    }
    
    res.json({
      success: true,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Error verifying existing patient by name and phone:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying patient' 
    });
  }
});

// TEMPORARY: Simple verification route without validation (for debugging)
router.post('/verify-by-name-phone-simple', async (req, res) => {
  try {
    console.log('🎯 Simple verification route hit!');
    console.log('Request body:', req.body);
    const { name, phone } = req.body;
    
    if (!name || !phone) {
      console.log('❌ Missing name or phone');
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }
    
    console.log('🔍 Searching for user with:');
    console.log('  Name (case-insensitive):', name.trim());
    console.log('  Phone:', phone.trim());
    console.log('  Role: patient');
    
    // Try multiple query approaches
    console.log('\n🧪 Trying different query methods...');
    
    // Method 1: Exact match (case-sensitive)
    let user = await User.findOne({ 
      name: name.trim(),
      phone: phone.trim(),
      role: 'patient'
    });
    console.log('Method 1 (exact match):', user ? '✅ Found' : '❌ Not found');
    
    // Method 2: Case-insensitive without regex
    if (!user) {
      const users = await User.find({ 
        phone: phone.trim(),
        role: 'patient'
      });
      
      user = users.find(u => u.name.toLowerCase() === name.trim().toLowerCase());
      console.log('Method 2 (manual case check):', user ? '✅ Found' : '❌ Not found');
    }
    
    // Method 3: Simple regex
    if (!user) {
      user = await User.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        phone: phone.trim(),
        role: 'patient'
      });
      console.log('Method 3 (regex):', user ? '✅ Found' : '❌ Not found');
    }
    
    console.log('📊 Final query result:', user ? 'User found' : 'No user found');
    
    if (!user) {
      console.log('❌ No user found with provided credentials');
      // Let's also check if there are any users at all
      const totalUsers = await User.countDocuments();
      const usersWithRole = await User.countDocuments({ role: 'patient' });
      const usersWithPhone = await User.countDocuments({ phone: phone.trim() });
      console.log(`📈 Total users: ${totalUsers}, Patients: ${usersWithRole}, With this phone: ${usersWithPhone}`);
      
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found with the provided name and phone number' 
      });
    }
    
    console.log('✅ User found successfully:', user.name);
    res.json({
      success: true,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Error in simple verification route:', error);
    logger.error('Error in simple verification route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying patient' 
    });
  }
});

// TEMPORARY: Debug endpoint to list available patients (public access)
router.get('/debug/list', async (req, res) => {
  try {
    console.log('📋 Debug: Listing available patients');
    
    const patients = await User.find({ role: 'patient' })
      .select('name phone email userId createdAt')
      .limit(10);
    
    res.json({
      success: true,
      message: 'Available patients for testing',
      count: patients.length,
      data: patients.map(user => ({
        name: user.name,
        phone: user.phone,
        email: user.email,
        userId: user.userId,
        registeredAt: user.createdAt
      }))
    });
  } catch (error) {
    logger.error('Error listing patients:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error listing patients' 
    });
  }
});

// Protect all routes
router.use(protect);

// Validation middleware
const validateCreateUser = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .isIn(['admin', 'doctor', 'patient'])
    .withMessage('Invalid role'),
  body('phone')
    .optional()
    .matches(/^[+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Invalid gender'),
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Street address must be less than 100 characters'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City must be less than 50 characters'),
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be less than 50 characters'),
  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Zip code must be less than 20 characters'),
  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country must be less than 50 characters')
];

const validateUpdateUser = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^[+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Invalid gender'),
  body('role')
    .optional()
    .isIn(['admin', 'doctor', 'patient'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('emailVerified')
    .optional()
    .isBoolean()
    .withMessage('emailVerified must be a boolean'),
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Street address must be less than 100 characters'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City must be less than 50 characters'),
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be less than 50 characters'),
  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Zip code must be less than 20 characters'),
  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country must be less than 50 characters')
];

const validateQueryParams = [
  query('role')
    .optional()
    .isIn(['admin', 'doctor', 'patient'])
    .withMessage('Invalid role filter'),
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive must be true or false'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Public routes (no authentication required)
router.get('/doctors', getDoctors);

// Get user by userId (admin only)
router.get('/by-userid/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ userId: userId }).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user by userId error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// Admin only routes
router.route('/')
  .get(authorize('admin'), validateQueryParams, getUsers)
  .post(authorize('admin'), validateCreateUser, createUser);

router.route('/stats')
  .get(authorize('admin'), getUserStats);

// List all admin users (all admin levels can view) - MUST BE BEFORE /:id routes
router.get('/admins', protect, authorizeHospitalManager, async (req, res) => {
  try {
    const admins = await User.find({ 
      role: { $in: ['super_admin', 'admin', 'hospital_manager'] } 
    }).select('-password');
    res.json({ success: true, admins });
  } catch (error) {
    logger.error('Error fetching admins:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admins' });
  }
});

// Add a new admin user (only super_admin and admin can add)
router.post('/admins', protect, authorizeAdminLevel, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Validate role
    if (!['super_admin', 'admin', 'hospital_manager'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid admin role' });
    }

    // Set admin level based on role
    let adminLevel;
    switch (role) {
      case 'super_admin': adminLevel = 1; break;
      case 'admin': adminLevel = 2; break;
      case 'hospital_manager': adminLevel = 3; break;
      default: adminLevel = 3;
    }

    // Check permissions - only super_admin can create super_admin
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super admins can create super admin accounts' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Admin with this email already exists' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role,
      adminLevel,
      isActive: true,
      emailVerified: true,
      userId: `ADMIN_${Date.now()}`,
      gender: 'prefer-not-to-say',
      dateOfBirth: new Date('1990-01-01')
    });
    await admin.save();
    res.status(201).json({ 
      success: true, 
      admin: { 
        id: admin._id, 
        firstName, 
        lastName, 
        email, 
        phone, 
        role: admin.role, 
        adminLevel: admin.adminLevel,
        isActive: admin.isActive 
      } 
    });
  } catch (error) {
    logger.error('Error creating admin:', error);
    res.status(500).json({ success: false, message: 'Failed to create admin' });
  }
});

// Delete an admin user (only super_admin can delete admins)
router.delete('/admins/:id', protect, authorizeSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }
    const admin = await User.findOneAndDelete({ 
      _id: id, 
      role: { $in: ['super_admin', 'admin', 'hospital_manager'] } 
    });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    logger.error('Error deleting admin:', error);
    res.status(500).json({ success: false, message: 'Failed to delete admin' });
  }
});

// Reset admin password (only super_admin can reset other admin passwords)
router.put('/admins/:id/reset-password', protect, authorizeSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }
    
    if (req.user.id === id) {
      return res.status(400).json({ success: false, message: 'You cannot reset your own password using this route' });
    }
    
    const admin = await User.findOne({ 
      _id: id, 
      role: { $in: ['super_admin', 'admin', 'hospital_manager'] } 
    });
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    admin.password = hashedPassword;
    await admin.save();
    
    logger.info(`Super Admin ${req.user.email} reset password for admin ${admin.email}`);
    
    res.json({ 
      success: true, 
      message: 'Admin password reset successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role
      }
    });
  } catch (error) {
    logger.error('Error resetting admin password:', error);
    res.status(500).json({ success: false, message: 'Failed to reset admin password' });
  }
});

// Change own password (any admin can change their own password)
router.put('/admins/change-password', protect, authorizeHospitalManager, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }
    
    const admin = await User.findById(req.user.id).select('+password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedNewPassword;
    await admin.save();
    
    logger.info(`Admin ${admin.email} changed their password`);
    
    res.json({ 
      success: true, 
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Error changing admin password:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// Delete all users - requires admin passkey verification
router.delete('/delete-all', protect, authorizeAdminLevel, adminLimiter, async (req, res) => {
  try {
    const { adminPasskey } = req.body;
    
    if (!adminPasskey) {
      return res.status(400).json({
        success: false,
        message: 'Admin passkey is required'
      });
    }
    
    // Read the admin passkey from config file
    const adminPasskeyPath = path.join(__dirname, '../config/admin-passkey.json');
    
    if (!fs.existsSync(adminPasskeyPath)) {
      return res.status(500).json({
        success: false,
        message: 'Admin passkey configuration not found'
      });
    }
    
    const adminPasskeyConfig = JSON.parse(fs.readFileSync(adminPasskeyPath, 'utf8'));
    const storedPasskey = adminPasskeyConfig.passkey;
    
    if (adminPasskey !== storedPasskey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin passkey'
      });
    }
    
    // Delete all users except admin users
    const result = await User.deleteMany({ role: { $ne: 'admin' } });
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} users`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting all users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all users',
      error: error.message
    });
  }
});

// Protected routes - MUST BE AFTER specific routes like /admins
router.route('/:id')
  .get(checkOwnership('User'), getUser)
  .put(checkOwnership('User'), validateUpdateUser, updateUser)
  .delete(authorize('admin'), deleteUser);

router.route('/:id/toggle-status')
  .put(authorize('admin'), toggleUserStatus);

// Add the admin rate limiter to admin routes
router.get('/', protect, authorizeHospitalManager, adminLimiter, getUsers);
router.get('/stats', protect, authorizeHospitalManager, adminLimiter, getUserStats);
router.get('/doctors', protect, authorizeHospitalManager, adminLimiter, getDoctors);
router.get('/:userId', protect, adminLimiter, checkOwnership, getUser);
router.post('/', protect, authorizeAdminLevel, adminLimiter, createUser);
router.put('/:userId', protect, adminLimiter, checkOwnership, updateUser);
router.delete('/:userId', protect, authorizeAdminLevel, adminLimiter, deleteUser);
router.put('/:userId/status', protect, authorizeAdminLevel, adminLimiter, toggleUserStatus);

module.exports = router;
