// Simple script to test email configuration
// Run with: node test-email.js

const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  console.log('Testing email configuration...\n');

  console.log('SMTP Settings:');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  console.log('From Name:', process.env.SMTP_FROM_NAME);
  console.log('From Email:', process.env.SMTP_FROM_EMAIL);
  console.log('');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ Error: SMTP_USER and SMTP_PASSWORD must be set in .env.local');
    process.exit(1);
  }

  if (process.env.SMTP_USER === 'your-email@gmail.com') {
    console.error('❌ Error: Please update SMTP_USER in .env.local with your actual email');
    process.exit(1);
  }

  if (process.env.SMTP_PASSWORD === 'your-app-password') {
    console.error('❌ Error: Please update SMTP_PASSWORD in .env.local with your actual app password');
    process.exit(1);
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Kanban Board'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'Test Email - Kanban Board',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Configuration Test</h2>
          <p>This is a test email from your Kanban Board application.</p>
          <p>If you're seeing this, your email configuration is working correctly! ✅</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
            <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
            <p><strong>From Email:</strong> ${process.env.SMTP_FROM_EMAIL}</p>
          </div>
          <p style="color: #888; font-size: 12px;">
            Test email sent at ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `
Email Configuration Test

This is a test email from your Kanban Board application.
If you're seeing this, your email configuration is working correctly!

SMTP Host: ${process.env.SMTP_HOST}
SMTP Port: ${process.env.SMTP_PORT}
From Email: ${process.env.SMTP_FROM_EMAIL}

Test email sent at ${new Date().toLocaleString()}
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\nCheck your inbox at:', process.env.SMTP_USER);
    console.log('\n🎉 Email configuration is working correctly!');
  } catch (error) {
    console.error('\n❌ Email test failed:');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Verify SMTP_USER and SMTP_PASSWORD are correct');
    console.error('2. For Gmail, use an App Password (not your regular password)');
    console.error('3. Generate App Password at: https://myaccount.google.com/apppasswords');
    console.error('4. Check if your email provider requires different settings');
    process.exit(1);
  }
}

testEmail();
