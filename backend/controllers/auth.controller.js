const User = require('../models/User');
const crypto = require('crypto');
const { logger, createLogger } = require('../utils/logger');
const authLogger = createLogger('auth');
const { sendMail } = require('../utils/email');
const emailTemplates = require('../utils/emailTemplates');

// Constants for password requirements
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60 * 1000 // 30 minutes
};

// In-memory OTP store for demo (replace with DB/cache in production)
const adminOtpStore = {};

// Helper function to check if user is locked out
const isUserLockedOut = async (user) => {
  if (!user.failedLoginAttempts) return false;
  
  const lastFailedAttempt = new Date(user.lastFailedLogin);
  const lockoutTime = new Date(lastFailedAttempt.getTime() + PASSWORD_REQUIREMENTS.LOCKOUT_DURATION);
  
  return lockoutTime > new Date();
};

// Helper function to update failed login attempts
const updateFailedAttempts = async (user) => {
  const now = new Date();
  
  if (user.failedLoginAttempts >= PASSWORD_REQUIREMENTS.MAX_ATTEMPTS - 1) {
    await User.findByIdAndUpdate(user._id, {
      isLocked: true,
      lastFailedLogin: now
    });
    return true;
  }
  
  await User.findByIdAndUpdate(user._id, {
    failedLoginAttempts: user.failedLoginAttempts + 1,
    lastFailedLogin: now
  });
  return false;
};

// Helper function to reset failed login attempts
const resetFailedAttempts = async (user) => {
  await User.findByIdAndUpdate(user._id, {
    failedLoginAttempts: 0,
    isLocked: false
  });
};

// Helper function to send JWT token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImage: user.profileImage,
        emailVerified: user.emailVerified
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, firstName, lastName, role, phone, dateOfBirth, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
        code: 'AUTH_001'
      });
    }

    // Create user without password for simplified app
    const user = await User.create({
      email,
      password: 'NO_PASSWORD_REQUIRED', // Temporary password that will be hashed
      firstName,
      lastName,
      role: role || 'patient',
      phone,
      dateOfBirth,
      gender,
      emailVerified: true, // Auto-verify for simplified app
      verificationToken: undefined,
      verificationTokenExpires: undefined
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Add user to Brevo contacts
    try {
      const SibApiV3Sdk = require('@sendinblue/client');
      const brevoClient = new SibApiV3Sdk.ContactsApi();
      brevoClient.setApiKey(SibApiV3Sdk.ContactsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
      await brevoClient.createContact({
        email: user.email,
        attributes: {
          FIRSTNAME: user.firstName,
          LASTNAME: user.lastName
        },
        updateEnabled: true // Update if contact already exists
      });
    } catch (err) {
      console.error('Failed to add user to Brevo contacts:', err.message);
    }


    authLogger.info(`New user registered: ${user.email} with role: ${user.role}`);

    // Return user data with 8-digit userId for simplified app
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        userId: user.userId, // 8-digit userId
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender
      }
    });
  } catch (error) {
    authLogger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      code: 'AUTH_002',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token',
        code: 'AUTH_003'
      });
    }

    if (user.verificationTokenExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired',
        code: 'AUTH_004'
      });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    authLogger.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      code: 'AUTH_005',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
        code: 'AUTH_006'
      });
    }

    // Check for user
    const user = await User.findByEmail(email).select('+password');

    if (!user) {
      // Increment failed attempts even if user doesn't exist
      // to prevent user enumeration attacks
      await User.findOneAndUpdate(
        { email },
        { $inc: { failedLoginAttempts: 1 }, lastFailedLogin: new Date() },
        { upsert: true, new: true }
      );

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'AUTH_007'
      });
    }

    // Check if account is locked
    if (await isUserLockedOut(user)) {
      return res.status(401).json({
        success: false,
        message: 'Account is locked. Please contact support',
        code: 'AUTH_008'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first',
        code: 'AUTH_009'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Update failed login attempts
      const isLocked = await updateFailedAttempts(user);
      if (isLocked) {
        return res.status(401).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 30 minutes',
          code: 'AUTH_010'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'AUTH_011'
      });
    }

    // Reset failed attempts on successful login
    await resetFailedAttempts(user);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    authLogger.info(`User logged in: ${user.email}`);

    sendTokenResponse(user, 200, res);
  } catch (error) {
    authLogger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      code: 'AUTH_012',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    logger.info(`User logged out: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
const updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      address: req.body.address
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    logger.info(`User details updated: ${user.email}`);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Update details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user details'
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    logger.info(`Password updated for user: ${user.email}`);

    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  let user;
  try {
    user = await User.findByEmail(req.body.email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user with that email'
      });
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

    // TODO: Send email with reset URL
    // For now, just log it
    logger.info(`Password reset URL: ${resetUrl}`);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);

    // Reset user fields
    if (user) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(500).json({
      success: false,
      message: 'Email could not be sent'
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    logger.info(`Password reset for user: ${user.email}`);

    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

// Send OTP to admin email for password reset
const sendAdminOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with email as key
    adminOtpStore[email.toLowerCase()] = { 
      otp, 
      expires: Date.now() + 10 * 60 * 1000 // 10 min expiry
    };

    authLogger.info(`OTP generated for admin email: ${email}`);

    // Generate email content
    const emailContent = emailTemplates.adminOtp({ otp });
    
    // Send email
    await sendMail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    authLogger.info(`OTP email sent successfully to: ${email}`);
    res.json({ success: true, message: 'OTP sent to your email' });
    
  } catch (err) {
    authLogger.error(`Failed to send admin OTP: ${err.message}`, { 
      error: err, 
      stack: err.stack,
      email: req.body?.email 
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  sendAdminOtp,
  adminOtpStore
};
