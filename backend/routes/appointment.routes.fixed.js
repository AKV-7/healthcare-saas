const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendAppointmentConfirmation } = require('../utils/notification');

// Register user and create appointment in one request (FIXED)
router.post('/register-appointment', async (req, res) => {
  try {
    const { user, appointment } = req.body;

    // Validate required fields
    if (!user || !appointment) {
      return res.status(400).json({ message: 'User and appointment data are required' });
    }

    // Check if user already exists by email
    let existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      // Create new user with required fields from schema
      existingUser = new User({
        userId: user.userId || (user.email + '-' + Date.now()),
        name: user.name || user.patientName || user.firstName || 'Unknown',
        email: user.email,
        phone: user.phone,
        age: user.age || 30, // fallback if not provided
        gender: user.gender || 'other',
        address: user.address || '',
        role: 'patient',
        isVerified: true
      });
      await existingUser.save();
    }

    // Create appointment with required fields from schema
    const newAppointment = new Appointment({
      userId: existingUser.userId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      doctor: appointment.doctor,
      appointmentType: appointment.appointmentType,
      symptoms: appointment.symptoms,
      additionalNotes: appointment.additionalNotes || '',
      patientName: appointment.patientName || existingUser.name,
      patientEmail: appointment.patientEmail || existingUser.email,
      patientPhone: appointment.patientPhone || existingUser.phone,
      attachments: appointment.attachments || [],
      status: 'pending'
    });
    await newAppointment.save();

    // Send confirmation email (optional)
    try {
      const mockDoctor = {
        firstName: appointment.doctor?.split(' ')[1] || 'Doctor',
        lastName: appointment.doctor?.split(' ')[0] || 'Unknown'
      };
      await sendAppointmentConfirmation(newAppointment, existingUser, mockDoctor);
    } catch (emailError) {
      console.warn(`Failed to send confirmation email: ${emailError.message}`);
    }

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointmentId: newAppointment._id,
      userId: existingUser.userId
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Failed to create appointment', error: error.message });
  }
});

module.exports = router;
