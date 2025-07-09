const nodemailer = require('nodemailer');

/**
 * Simplified email service with fallback options
 */

// Create a basic console logger for emails when service is unavailable
const logEmailToConsole = (to, subject, content) => {
  console.log('\n📧 ============ EMAIL NOTIFICATION ============');
  console.log(`📬 TO: ${to}`);
  console.log(`📋 SUBJECT: ${subject}`);
  console.log('📄 CONTENT:');
  console.log('----------------------------------------');
  console.log(content.replace(/<[^>]*>/g, '')); // Strip HTML tags for console
  console.log('============================================\n');
};

/**
 * Send email with multiple fallback options
 * @param {Object} options - { to, subject, html, text }
 * @returns {Promise}
 */
async function sendMail(options) {
  const { to, subject, html, text } = options;
  
  console.log(`🔄 Attempting to send email to: ${to}`);
  
  // Always log to console first for debugging
  logEmailToConsole(to, subject, html || text);
  
  // Try different email services in order of preference
  const emailServices = [
    () => sendWithBrevo(options),
    () => sendWithGmail(options),
    () => sendWithNodemailer(options)
  ];
  
  for (const service of emailServices) {
    try {
      const result = await service();
      console.log('✅ Email sent successfully!');
      return result;
    } catch (error) {
      console.warn(`⚠️ Email service failed: ${error.message}`);
      continue;
    }
  }
  
  // If all services fail, log the email content to console as fallback
  console.log('📧 All email services failed. Email logged to console above.');
  return { 
    success: true, 
    method: 'console_fallback',
    message: 'Email logged to server console (email service unavailable)'
  };
}

/**
 * Send email using Brevo (Sendinblue)
 */
async function sendWithBrevo(options) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY not configured');
  }
  
  const SibApiV3Sdk = require('sib-api-v3-sdk');
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  
  const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
  
  const emailData = {
    sender: { 
      name: 'Khushi Homoeopathic Clinic', 
      email: process.env.BREVO_SENDER || 'noreply@khushihomoeo.com'
    },
    to: [{ email: options.to }],
    subject: options.subject,
    htmlContent: options.html,
  };
  
  if (options.text) {
    emailData.textContent = options.text;
  }
  
  const result = await brevoClient.sendTransacEmail(emailData);
  return { success: true, method: 'brevo', result };
}

/**
 * Send email using Gmail SMTP
 */
async function sendWithGmail(options) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    throw new Error('Gmail credentials not configured');
  }
  
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
  
  const mailOptions = {
    from: `"Khushi Homoeopathic Clinic" <${process.env.GMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  };
  
  const result = await transporter.sendMail(mailOptions);
  return { success: true, method: 'gmail', result };
}

/**
 * Send email using basic SMTP configuration
 */
async function sendWithNodemailer(options) {
  if (!process.env.SMTP_HOST) {
    throw new Error('SMTP configuration not available');
  }
  
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  const mailOptions = {
    from: `"Khushi Homoeopathic Clinic" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  };
  
  const result = await transporter.sendMail(mailOptions);
  return { success: true, method: 'smtp', result };
}

// Legacy function for backward compatibility
const addOrUpdateContact = async (contactData) => {
  console.log('📞 Contact data received:', contactData);
  return { success: true, message: 'Contact logged (service unavailable)' };
};

module.exports = { 
  sendMail, 
  addOrUpdateContact,
  // Legacy exports for backward compatibility
  sendEmail: sendMail
};
