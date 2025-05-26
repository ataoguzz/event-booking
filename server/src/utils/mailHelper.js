import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // For development, you can use Gmail with app passwords or a service like Ethereal
  // For production, use a proper email service like SendGrid, AWS SES, etc.
  
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development configuration - using Gmail for testing
    // You'll need to set up app passwords in Gmail for this to work
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });
  }
};

// Generic email sending function
export const sendEmail = async (to, subject, htmlContent, textContent = null) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"EventBooking Platform" <${process.env.EMAIL_USER || 'noreply@eventbooking.com'}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Simplified ticket confirmation email with PDF attachment
export const sendTicketConfirmationEmailWithPDF = async (emailData) => {
  const { 
    email, 
    guestName, 
    eventName, 
    totalAmount, 
    transactionId,
    ticketCount,
    pdfAttachments // Array of { filename, content } objects
  } = emailData;

  const subject = `Your Tickets for ${eventName} - Confirmation`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .summary-box { background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .important { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .ticket-info { display: flex; justify-content: space-between; margin: 10px 0; }
            .ticket-info span:first-child { font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎫 Ticket Confirmation</h1>
            <p>Your tickets have been successfully purchased!</p>
        </div>
        
        <div class="content">
            <h2>Hello ${guestName}!</h2>
            <p>Thank you for your purchase. Your tickets for <strong>${eventName}</strong> have been confirmed and are attached to this email as PDF files.</p>
            
            <div class="summary-box">
                <h3>📋 Purchase Summary</h3>
                <div class="ticket-info">
                    <span>Event:</span>
                    <span>${eventName}</span>
                </div>
                <div class="ticket-info">
                    <span>Tickets Purchased:</span>
                    <span>${ticketCount}</span>
                </div>
                <div class="ticket-info">
                    <span>Total Paid:</span>
                    <span>$${totalAmount.toFixed(2)}</span>
                </div>
                <div class="ticket-info">
                    <span>Transaction ID:</span>
                    <span>${transactionId}</span>
                </div>
            </div>

            <div class="important">
                <h4>📎 Your Tickets Are Attached</h4>
                <p>Your tickets are attached to this email as PDF files. Each ticket contains:</p>
                <ul>
                    <li>Event details and venue information</li>
                    <li>Your seat assignment or tier information</li>
                    <li>A unique QR code for entry</li>
                    <li>Important event policies and arrival instructions</li>
                </ul>
            </div>

            <div class="important">
                <h4>⚠️ Important Information</h4>
                <ul>
                    <li>Please arrive at least 30 minutes before the event starts</li>
                    <li>Bring a valid photo ID for entry verification</li>
                    <li>Present the PDF tickets or QR codes for entry</li>
                    <li>Screenshots are not accepted - use the original PDF files</li>
                    <li>Tickets are non-transferable and non-refundable unless the event is cancelled</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-tickets" class="btn">View My Tickets Online</a>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for choosing our platform!</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>&copy; 2024 EventBooking Platform. All rights reserved.</p>
        </div>
    </body>
    </html>
  `;

  // Prepare mail options with attachments
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"EventBooking Platform" <${process.env.EMAIL_USER || 'noreply@eventbooking.com'}>`,
    to: email,
    subject: subject,
    html: htmlContent,
    text: htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    attachments: pdfAttachments || []
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email with PDF attachments sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email with PDF attachments:', error);
    return { success: false, error: error.message };
  }
};

// Password reset email template (for future use)
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const subject = 'Password Reset Request - EventBooking Platform';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
        </div>
        
        <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>We received a request to reset your password for your EventBooking Platform account.</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="btn">Reset Your Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px;">${resetUrl}</p>
            
            <div class="warning">
                <h4>⚠️ Security Notice</h4>
                <ul>
                    <li>This link will expire in 1 hour for security reasons</li>
                    <li>If you didn't request this password reset, please ignore this email</li>
                    <li>Never share this link with anyone</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>If you have any questions, please contact our support team.</p>
            <p>&copy; 2024 EventBooking Platform. All rights reserved.</p>
        </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, htmlContent);
};

// Test email function for development
export const sendTestEmail = async (to) => {
  const subject = 'Test Email - EventBooking Platform';
  const htmlContent = `
    <h1>Test Email</h1>
    <p>This is a test email to verify the email configuration is working correctly.</p>
    <p>Sent at: ${new Date().toISOString()}</p>
  `;

  return await sendEmail(to, subject, htmlContent);
}; 