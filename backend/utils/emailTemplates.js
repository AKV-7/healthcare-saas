// Production-ready email templates for various events

module.exports = {
  bookingConfirmed: ({ user, appointment }) => ({
    subject: "Your Appointment is Confirmed!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c5aa0; margin: 0;">Khushi Homoeopathic Clinic</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Quality Healthcare Services</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #28a745; margin: 0 0 15px 0;">✅ Appointment Confirmed</h2>
          <p style="margin: 0; color: #333;">Dear ${user.name || 'Valued Patient'},</p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #333; margin: 0 0 15px 0;">Appointment Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555; width: 30%;">Patient Name:</td>
              <td style="padding: 10px 0; color: #333;">${user.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Phone:</td>
              <td style="padding: 10px 0; color: #333;">${user.phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Date:</td>
              <td style="padding: 10px 0; color: #333;">${appointment.date}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Time:</td>
              <td style="padding: 10px 0; color: #333;">${appointment.time}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Appointment Type:</td>
              <td style="padding: 10px 0; color: #333;">${appointment.type || 'General Consultation'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Doctor:</td>
              <td style="padding: 10px 0; color: #333;">Dr. ${appointment.doctorName}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #1976d2;"><strong>Please arrive 15 minutes before your scheduled time.</strong></p>
          <p style="margin: 5px 0 0 0; color: #1976d2; font-size: 14px;">Bring a valid ID and any previous medical records.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0;">Thank you for choosing Khushi Homoeopathic Clinic</p>
          <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">If you have any questions, please reply to this email or call us.</p>
        </div>
      </div>
    `
  }),

  bookingCancelled: ({ user, appointment }) => ({
    subject: "Appointment Cancelled",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c5aa0; margin: 0;">Khushi Homoeopathic Clinic</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Quality Healthcare Services</p>
        </div>
        
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #f57c00; margin: 0 0 15px 0;">⚠️ Appointment Cancelled</h2>
          <p style="margin: 0; color: #333;">Dear ${user.name || 'Valued Patient'},</p>
        </div>
        
        <p style="color: #333; line-height: 1.6;">We regret to inform you that your appointment has been cancelled.</p>
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #333; margin: 0 0 15px 0;">Cancelled Appointment Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555; width: 30%;">Patient Name:</td>
              <td style="padding: 10px 0; color: #333;">${user.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Phone:</td>
              <td style="padding: 10px 0; color: #333;">${user.phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Date:</td>
              <td style="padding: 10px 0; color: #333;">${appointment.date}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Time:</td>
              <td style="padding: 10px 0; color: #333;">${appointment.time}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Doctor:</td>
              <td style="padding: 10px 0; color: #333;">Dr. ${appointment.doctorName}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #2e7d32;">If you wish to reschedule, please contact us or book a new appointment through our system.</p>
          <p style="margin: 10px 0 0 0; color: #2e7d32; font-size: 14px;">We apologize for any inconvenience caused.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0;">Khushi Homoeopathic Clinic</p>
          <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">If you have any questions, please reply to this email or call us.</p>
        </div>
      </div>
    `
  }),

  bookingRescheduled: ({ user, appointment, oldAppointment }) => ({
    subject: "Appointment Rescheduled",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c5aa0; margin: 0;">Khushi Homoeopathic Clinic</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Quality Healthcare Services</p>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1976d2; margin: 0 0 15px 0;">📅 Appointment Rescheduled</h2>
          <p style="margin: 0; color: #333;">Dear ${user.name || 'Valued Patient'},</p>
        </div>
        
        <p style="color: #333; line-height: 1.6;">Your appointment has been rescheduled. Please find the updated details below:</p>
        
        ${oldAppointment?.date ? `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #999; margin: 0 0 10px 0; text-decoration: line-through;">Previous Appointment:</h3>
          <p style="color: #999; margin: 0;">${oldAppointment.date} at ${oldAppointment.time}</p>
        </div>
        ` : ''}
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #333; margin: 0 0 15px 0;">New Appointment Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555; width: 30%;">Patient Name:</td>
              <td style="padding: 10px 0; color: #333;">${user.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Phone:</td>
              <td style="padding: 10px 0; color: #333;">${user.phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Date:</td>
              <td style="padding: 10px 0; color: #333; font-weight: bold;">${appointment.date}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Time:</td>
              <td style="padding: 10px 0; color: #333; font-weight: bold;">${appointment.time}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Appointment Type:</td>
              <td style="padding: 10px 0; color: #333;">${appointment.type || 'General Consultation'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Doctor:</td>
              <td style="padding: 10px 0; color: #333;">Dr. ${appointment.doctorName}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #2e7d32;"><strong>Please arrive 15 minutes before your new scheduled time.</strong></p>
          <p style="margin: 5px 0 0 0; color: #2e7d32; font-size: 14px;">Bring a valid ID and any previous medical records.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0;">Thank you for your understanding - Khushi Homoeopathic Clinic</p>
          <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">If you have any questions, please reply to this email or call us.</p>
        </div>
      </div>
    `
  }),

  appointmentStatusUpdate: ({ user, appointment, status, _oldStatus }) => ({
    subject: `Appointment Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c5aa0; margin: 0;">Khushi Homoeopathic Clinic</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Quality Healthcare Services</p>
        </div>
        
        <div style="background-color: ${status === 'confirmed' ? '#d4edda' : status === 'completed' ? '#cce5ff' : status === 'cancelled' ? '#f8d7da' : '#fff3cd'}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: ${status === 'confirmed' ? '#28a745' : status === 'completed' ? '#007bff' : status === 'cancelled' ? '#dc3545' : '#856404'}; margin: 0 0 15px 0;">
            ${status === 'confirmed' ? '✅ Appointment Confirmed' : 
              status === 'completed' ? '✅ Appointment Completed' : 
              status === 'cancelled' ? '❌ Appointment Cancelled' : 
              status === 'no-show' ? '⚠️ Missed Appointment' : 
              '📅 Appointment Updated'}
          </h2>
          <p style="margin: 0; color: #333;">Dear ${user.name || 'Valued Patient'},</p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
            ${status === 'confirmed' ? 
              'Your appointment has been confirmed. We look forward to seeing you!' : 
              status === 'completed' ? 
              'Thank you for visiting our clinic. We hope you had a positive experience.' : 
              status === 'cancelled' ? 
              'Your appointment has been cancelled. If you need to reschedule, please contact us.' : 
              status === 'no-show' ? 
              'We noticed you missed your scheduled appointment. Please contact us to reschedule.' : 
              'Your appointment status has been updated.'}
          </p>
          
          <h3 style="color: #333; margin: 0 0 15px 0;">Appointment Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555; width: 30%;">Patient Name:</td>
              <td style="padding: 10px 0; color: #333;">${user.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Phone:</td>
              <td style="padding: 10px 0; color: #333;">${user.phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Status:</td>
              <td style="padding: 10px 0; color: #333; text-transform: capitalize; font-weight: bold;">${status}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Date:</td>
              <td style="padding: 10px 0; color: #333;">${appointment.date}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Time:</td>
              <td style="padding: 10px 0; color: #333;">${appointment.time}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Appointment Type:</td>
              <td style="padding: 10px 0; color: #333;">${appointment.type || 'General Consultation'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #555;">Doctor:</td>
              <td style="padding: 10px 0; color: #333;">Dr. ${appointment.doctorName}</td>
            </tr>
          </table>
        </div>
        
        ${status === 'confirmed' ? 
          '<div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;"><p style="margin: 0; color: #1976d2;"><strong>Please arrive 15 minutes before your scheduled time.</strong></p><p style="margin: 5px 0 0 0; color: #1976d2; font-size: 14px;">Bring a valid ID and any previous medical records.</p></div>' : 
          status === 'completed' ? 
          '<div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px;"><p style="margin: 0; color: #2e7d32;"><strong>We hope you found your visit helpful. Please follow any prescribed treatments.</strong></p><p style="margin: 5px 0 0 0; color: #2e7d32; font-size: 14px;">If you have any questions about your treatment, please contact us.</p></div>' : 
          status === 'cancelled' ? 
          '<div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin-bottom: 20px;"><p style="margin: 0; color: #c62828;"><strong>Need to reschedule? Please contact us at your convenience.</strong></p><p style="margin: 5px 0 0 0; color: #c62828; font-size: 14px;">We apologize for any inconvenience caused.</p></div>' : 
          ''}
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0;">Thank you for choosing Khushi Homoeopathic Clinic</p>
          <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">If you have any questions, please reply to this email or call us.</p>
        </div>
      </div>
    `
  }),

  adminOtp: ({ otp }) => ({
    subject: "Your Admin OTP for Password Reset",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c5aa0; margin: 0;">Khushi Homoeopathic Clinic</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Admin Portal</p>
        </div>
        
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #f57c00; margin: 0 0 15px 0;">🔐 Password Reset OTP</h2>
        </div>
        
        <p style="color: #333; line-height: 1.6;">Your OTP for password reset is:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background-color: #f5f5f5; padding: 20px 40px; border-radius: 8px; border: 2px dashed #ccc;">
            <span style="font-size: 36px; font-weight: bold; color: #333; letter-spacing: 8px;">${otp}</span>
          </div>
        </div>
        
        <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #c62828;"><strong>This OTP is valid for 10 minutes only.</strong></p>
          <p style="margin: 10px 0 0 0; color: #c62828;">If you did not request this, please ignore this email.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0;">Khushi Homoeopathic Clinic - Admin Portal</p>
        </div>
      </div>
    `
  })
};