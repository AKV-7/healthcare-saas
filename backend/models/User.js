const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*\.\w{2,3}$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    index: true,
    match: [/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian mobile number with +91']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [1, 'Age must be at least 1 year'],
    max: [120, 'Age cannot exceed 120 years']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  isVerified: {
    type: Boolean,
    default: true // Auto-verified for simplified registration
  },
  role: {
    type: String,
    enum: ['patient', 'admin', 'doctor'],
    default: 'patient'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastLoginDate: {
    type: Date
  },
  appointmentHistory: [{
    appointmentId: String,
    date: Date,
    status: String
  }]
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1, phone: 1 });
userSchema.index({ userId: 1 });

module.exports = mongoose.model('User', userSchema);
