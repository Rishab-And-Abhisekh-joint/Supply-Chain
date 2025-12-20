import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://supplychainuser:vQKnELrP9zskcONMdFq2OK3vahcy1Rt0@dpg-d4vpefumcj7s73drp540-a.oregon-postgres.render.com/supplychaindb_wpdq',
  ssl: { rejectUnauthorized: false },
});

// Generate 6-digit code
function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Send email using a simple SMTP approach or external service
async function sendResetEmail(email: string, code: string): Promise<boolean> {
  try {
    // Option 1: Use Resend (recommended - free tier available)
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'noreply@supplychain.com',
          to: email,
          subject: 'Password Reset Code - SupplyChain',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb;">SupplyChain</h1>
              </div>
              <h2 style="color: #1f2937;">Password Reset Request</h2>
              <p style="color: #4b5563; font-size: 16px;">
                You requested to reset your password. Use the verification code below to proceed:
              </p>
              <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${code}</span>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                This code will expire in 15 minutes. If you didn't request this, please ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} SupplyChain. All rights reserved.
              </p>
            </div>
          `,
        }),
      });

      return response.ok;
    }

    // Option 2: Use SendGrid
    if (process.env.SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: process.env.FROM_EMAIL || 'noreply@supplychain.com' },
          subject: 'Password Reset Code - SupplyChain',
          content: [{
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb;">SupplyChain</h1>
                <h2>Password Reset Request</h2>
                <p>Use this code to reset your password:</p>
                <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</span>
                </div>
                <p style="color: #6b7280; font-size: 14px;">This code expires in 15 minutes.</p>
              </div>
            `,
          }],
        }),
      });

      return response.ok;
    }

    // Option 3: Use Mailgun
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      const formData = new FormData();
      formData.append('from', process.env.FROM_EMAIL || 'noreply@supplychain.com');
      formData.append('to', email);
      formData.append('subject', 'Password Reset Code - SupplyChain');
      formData.append('html', `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">SupplyChain</h1>
          <h2>Password Reset Request</h2>
          <p>Use this code to reset your password:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in 15 minutes.</p>
        </div>
      `);

      const response = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`,
        },
        body: formData,
      });

      return response.ok;
    }

    // Fallback: Log to console (for development)
    console.log('========================================');
    console.log('PASSWORD RESET CODE FOR:', email);
    console.log('CODE:', code);
    console.log('========================================');
    console.log('Note: Set RESEND_API_KEY, SENDGRID_API_KEY, or MAILGUN_API_KEY to send real emails');
    
    // Return true for development - code is logged
    return true;

  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists - security best practice
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification code has been sent',
      });
    }

    const user = userResult.rows[0];

    // Generate verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Ensure password_reset_codes table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Delete any existing codes for this user
    await pool.query(
      'DELETE FROM password_reset_codes WHERE email = $1',
      [email.toLowerCase()]
    );

    // Store new code
    await pool.query(
      'INSERT INTO password_reset_codes (user_id, email, code, expires_at) VALUES ($1, $2, $3, $4)',
      [user.id, email.toLowerCase(), code, expiresAt]
    );

    // Send email with code
    const emailSent = await sendResetEmail(email, code);

    if (!emailSent) {
      console.error('Failed to send reset email to:', email);
      // Still return success - don't reveal email sending issues
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a verification code has been sent',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}