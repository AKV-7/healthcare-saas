const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
const contactsClient = new SibApiV3Sdk.ContactsApi();

/**
 * Add or update a contact in Brevo
 * @param {Object} contactData - { email, firstName, lastName, phone }
 * @returns {Promise}
 */
async function addOrUpdateContact(contactData) {
  try {
    const { email, firstName, lastName, phone } = contactData;
    
    const contact = {
      email,
      attributes: {
        FIRSTNAME: firstName || '',
        LASTNAME: lastName || '',
        SMS: phone || ''
      },
      updateEnabled: true // Update if contact already exists
    };

    const result = await contactsClient.createContact(contact);
    return result;
  } catch (error) {
    console.error('Brevo addOrUpdateContact error:', error && (error.response?.body || error.message || error));
    // Don't throw error to prevent email sending from failing
    return null;
  }
}

/**
 * Send an email using Brevo (Sendinblue) API
 * @param {Object} options - { to, subject, text, html }
 * @returns {Promise}
 */
async function sendMail(options) {
  try {
    console.log('📧 Attempting to send email to:', options.to);
    
    // Validate required options
    if (!options.to) {
      throw new Error('Recipient email is required');
    }
    if (!options.subject) {
      throw new Error('Email subject is required');
    }
    if (!options.html && !options.text) {
      throw new Error('Email content (html or text) is required');
    }

    // Check if Brevo API key is configured
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    // Add recipient to Brevo contacts first (optional, don't fail if this fails)
    if (options.to) {
      try {
        await addOrUpdateContact({
          email: options.to,
          firstName: options.firstName || '',
          lastName: options.lastName || '',
          phone: options.phone || ''
        });
        console.log('✅ Contact added/updated successfully');
      } catch (contactError) {
        console.warn('⚠️ Failed to add/update contact (continuing with email):', contactError.message);
      }
    }

    // Prepare email data
    const emailData = {
      sender: { 
        name: 'Khushi Homoeo', 
        email: process.env.BREVO_SENDER || 'noreply@khushihomoeo.com'
      },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
    };

    if (options.text) {
      emailData.textContent = options.text;
    }

    console.log('📤 Sending email via Brevo...');
    const result = await brevoClient.sendTransacEmail(emailData);
    
    console.log('✅ Email sent successfully:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Brevo sendMail error:', {
      message: error.message,
      response: error.response?.body || error.response?.data,
      status: error.response?.status,
      to: options.to
    });
    
    // Re-throw with more context
    const enhancedError = new Error(`Failed to send email: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.recipient = options.to;
    throw enhancedError;
  }
}

module.exports = { sendMail, addOrUpdateContact }; 