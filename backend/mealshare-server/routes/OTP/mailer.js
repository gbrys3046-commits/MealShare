const nodemailer = require('nodemailer');

// Create transporter - environment variables loaded from server.js
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// Debug info
console.log('📧 SMTP User:', process.env.SMTP_USER || 'NOT SET');
console.log('📧 SMTP Pass:', process.env.SMTP_PASS ? '*****' : 'NOT SET');

// Verify connection (non-blocking)
transporter.verify()
.then(() => console.log('✅ Gmail SMTP Ready'))
.catch(err => console.error('❌ Gmail SMTP Error:', err.message));

module.exports = transporter;