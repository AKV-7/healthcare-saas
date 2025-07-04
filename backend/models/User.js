const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      // Generate 8-digit unique ID
      return Math.floor(10000000 + Math.random() * 90000000).toString();
    }
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*\.\w{2,3}$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [12, 'Password must be at least 12 characters'],
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'Please provide first name'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Please provide last name'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'hospital_manager', 'doctor', 'patient', 'nurse'],
    default: 'patient'
  },
  adminLevel: {
    type: Number,
    enum: [1, 2, 3], // 1=super_admin, 2=admin, 3=hospital_manager
    default: null
  },
  phone: {
    type: String,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please provide date of birth']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    required: [true, 'Please provide gender']
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [100, 'Street address cannot be more than 100 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot be more than 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State cannot be more than 50 characters']
    },
    zip: {
      type: String,
      trim: true,
      maxlength: [15, 'ZIP code cannot be more than 15 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [50, 'Country cannot be more than 50 characters']
    }
  },
  profileImage: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastFailedLogin: {
    type: Date
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  passwordHistory: [{
    type: String,
    required: true
  }],
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  verificationTokenExpires: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for better query performance (email index is already created by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Encrypt password using bcrypt with higher rounds
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (this.password.match(/^\$2[aby]\$/)) {
    // Password is already hashed, skip hashing
    return next();
  }

  // Check password history
  if (this.passwordHistory && this.passwordHistory.includes(this.password)) {
    throw new Error('Cannot reuse previous passwords');
  }

  // Update password history
  if (this.passwordHistory && this.passwordHistory.length >= 5) {
    this.passwordHistory.shift();
  }
  this.passwordHistory.push(this.password);

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Ensure userId is unique
userSchema.pre('save', async function(next) {
  if (this.isNew && this.userId) {
    // Check if userId already exists
    const existingUser = await this.constructor.findOne({ userId: this.userId });
    if (existingUser) {
      // Regenerate userId if it already exists
      this.userId = Math.floor(10000000 + Math.random() * 90000000).toString();
    }
  }
  next();
});

// Update passwordChangedAt when password is modified
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      email: this.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

// Instance method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by verification token
userSchema.statics.findByVerificationToken = function(token) {
  return this.findOne({ verificationToken: token });
};

// Static method to find user by password reset token
userSchema.statics.findByPasswordResetToken = function(token) {
  return this.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() }
  });
};

module.exports = mongoose.model('User', userSchema);
