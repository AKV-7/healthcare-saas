const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  sendAdminOtp,
  adminOtpStore
} = require('../controllers/auth.controller');
const { protect, authRateLimit } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit(authRateLimit);

// Validation middleware
const validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'doctor', 'patient', 'nurse'])
    .withMessage('Invalid role'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Invalid gender')
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateUpdateDetails = [
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
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Invalid gender')
];

const validateUpdatePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 12 })
    .withMessage('New password must be at least 12 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

const validateResetPassword = [
  body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Routes
router.post('/register', authLimiter, validateRegistration, register);
router.get('/verify/:token', verifyEmail);
router.post('/login', authLimiter, validateLogin, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, validateUpdateDetails, updateDetails);
router.put('/updatepassword', protect, validateUpdatePassword, updatePassword);
router.post('/forgotpassword', authLimiter, validateForgotPassword, forgotPassword);
router.put('/resetpassword/:resettoken', validateResetPassword, resetPassword);

// Admin login route
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.info('Admin login attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin user by email (any admin role)
    const user = await User.findOne({ 
      email, 
      role: { $in: ['super_admin', 'admin', 'hospital_manager'] } 
    }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        adminLevel: user.adminLevel
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Return success response
    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        adminLevel: user.adminLevel
      }
    });

  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Admin token refresh route
router.post('/admin-refresh', protect, async (req, res) => {
  try {
    // Check if user is an admin
    if (!['super_admin', 'admin', 'hospital_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to refresh admin token'
      });
    }

    // Generate new token
    const token = jwt.sign(
      { 
        id: req.user._id, 
        email: req.user.email, 
        role: req.user.role,
        adminLevel: req.user.adminLevel
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token,
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        adminLevel: req.user.adminLevel
      }
    });

  } catch (error) {
    logger.error('Admin token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
});

// Admin password verification route
router.post('/admin-verify-password', protect, async (req, res) => {
  try {
    const { password } = req.body;
    
    // Check if user is an admin
    if (!['super_admin', 'admin', 'hospital_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify admin password'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Get the current admin user with password
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    res.json({
      success: true,
      message: 'Password verified successfully'
    });

  } catch (error) {
    logger.error('Admin password verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password verification'
    });
  }
});

// Admin password reset route
router.post('/admin-reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate input
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 12) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 12 characters long'
      });
    }

    // Find admin user by email
    const user = await User.findOne({
      email: email.toLowerCase(),
      role: { $in: ['super_admin', 'admin', 'hospital_manager'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Verify OTP against stored OTP
    const storedOtpData = adminOtpStore[email.toLowerCase()];
    if (!storedOtpData) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this email. Please request a new OTP.'
      });
    }

    // Check if OTP has expired
    if (Date.now() > storedOtpData.expires) {
      delete adminOtpStore[email.toLowerCase()]; // Clean up expired OTP
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Verify OTP matches
    if (otp !== storedOtpData.otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    // OTP is valid, clean up the stored OTP
    delete adminOtpStore[email.toLowerCase()];

    // Hash the new password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password directly without triggering pre-save hook
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    logger.info(`Admin password reset successful for: ${email}`);

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    logger.error('Admin password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// Add this route for admin OTP
router.post('/admin-send-otp', sendAdminOtp);

module.exports = router;
