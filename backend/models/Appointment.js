const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required']
  },
  doctor: {
    type: String,
    required: [true, 'Doctor is required']
  },
  appointmentType: {
    type: String,
    enum: [
      'initial-consultation',
      'follow-up', 
      'chronic-condition',
      'pediatric-consultation',
      'women-health',
      'mental-health',
      'skin-treatment',
      'joint-pain',
      'emergency',
      'consultation',
      'routine-checkup'
    ],
    required: [true, 'Appointment type is required']
  },
  symptoms: {
    type: String,
    required: [true, 'Symptoms are required'],
    maxlength: [500, 'Symptoms cannot exceed 500 characters']
  },
  additionalNotes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  patientName: {
    type: String,
    required: true
  },
  patientEmail: {
    type: String,
    required: [true, 'Patient email is required'],
    validate: {
      validator: function(value) {
        return value && value.trim().length > 0;
      },
      message: 'Patient email cannot be empty'
    }
  },
  patientPhone: {
    type: String,
    required: [true, 'Patient phone is required'],
    validate: {
      validator: function(value) {
        return value && value.trim().length > 0;
      },
      message: 'Patient phone cannot be empty'
    }
  },
  attachments: {
    type: [String], // Array of image URLs
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for appointment status color
appointmentSchema.virtual('statusColor').get(function() {
  const statusColors = {
    pending: 'yellow',
    confirmed: 'blue',
    completed: 'green',
    cancelled: 'red',
    'no-show': 'gray'
  };
  return statusColors[this.status] || 'gray';
});

// Virtual for formatted appointment date
appointmentSchema.virtual('formattedDate').get(function() {
  return this.appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for formatted appointment time
appointmentSchema.virtual('formattedTime').get(function() {
  return this.appointmentTime;
});

// Indexes for better query performance
appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ 'cancelledBy.cancelledAt': 1 });

// Pre-save middleware to set reminder date
appointmentSchema.pre('save', function(next) {
  if (this.isModified('appointmentDate') && !this.reminderDate) {
    // Set reminder 24 hours before appointment
    this.reminderDate = new Date(this.appointmentDate.getTime() - 24 * 60 * 60 * 1000);
  }
  next();
});

// Static method to find appointments by date range
appointmentSchema.statics.findByDateRange = function(startDate, endDate, doctorId = null) {
  const query = {
    appointmentDate: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (doctorId) {
    query.doctor = doctorId;
  }
  
  return this.find(query).populate('patient doctor', 'firstName lastName email phone');
};

// Static method to find upcoming appointments
appointmentSchema.statics.findUpcoming = function(userId, role = 'patient', limit = 10) {
  const query = {
    appointmentDate: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  };
  
  if (role === 'patient') {
    query.patient = userId;
  } else if (role === 'doctor') {
    query.doctor = userId;
  }
  
  return this.find(query)
    .populate('patient doctor', 'firstName lastName email phone')
    .sort({ appointmentDate: 1 })
    .limit(limit);
};

// Instance method to cancel appointment
appointmentSchema.methods.cancel = function(userId, reason) {
  this.status = 'cancelled';
  this.cancelledBy = {
    user: userId,
    reason: reason,
    cancelledAt: new Date()
  };
  return this.save();
};

// Instance method to confirm appointment
appointmentSchema.methods.confirm = function() {
  this.status = 'confirmed';
  return this.save();
};

// Instance method to complete appointment
appointmentSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

module.exports = mongoose.model('Appointment', appointmentSchema); 