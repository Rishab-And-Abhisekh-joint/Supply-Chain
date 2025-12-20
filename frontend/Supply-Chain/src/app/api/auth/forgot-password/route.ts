// ============================================================================
// FORGOT PASSWORD API - /api/auth/forgot-password/route.ts
// Sends verification code to user's email for password reset
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://supplychainuser:vQKnELrP9zskcONMdFq2OK3vahcy1Rt0@dpg-d4vpefumcj7s73drp540-a.oregon-postgres.render.com/supplychaindb_wpdq';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

// ============================================================================
// GENERATE 6-DIGIT CODE
// ============================================================================

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// ============================================================================
// SEND EMAIL (with multiple provider support)
// ============================================================================

async function sendResetEmail(email: string, code: string, firstName?: string): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">SupplyChain</h1>
        <p style="color: #6b7280; margin-top: 5px;">Password Reset Request</p>
      </div>
      
      <p style="color: #374151; font-size: 16px;">
        Hi${firstName ? ` ${firstName}` : ''},
      </p>
      
      <p style="color: #4b5563; font-size: 16px;">
        You requested to reset your password. Use the verification code below:
      </p>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
        <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #ffffff; font-family: monospace;">${code}</span>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        This code will expire in <strong>15 minutes</strong>.
      </p>
      
      <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          ⚠️ If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} SupplyChain. All rights reserved.
      </p>
    </div>
  `;

  try {
    // Option 1: Resend
    if (process.env.RESEND_API_KEY) {
      console.log('Sending email via Resend...');
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
          to: email,
          subject: 'Password Reset Code - SupplyChain',
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Resend error:', errorData);
        return false;
      }
      
      console.log('Email sent successfully via Resend');
      return true;
    }

    // Option 2: SendGrid
    if (process.env.SENDGRID_API_KEY) {
      console.log('Sending email via SendGrid...');
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
          content: [{ type: 'text/html', value: htmlContent }],
        }),
      });

      return response.ok;
    }

    // Fallback: Log to console (development mode)
    console.log('\n========================================');
    console.log('📧 PASSWORD RESET CODE (Development Mode)');
    console.log('========================================');
    console.log('Email:', email);
    console.log('Code:', code);
    console.log('Expires:', new Date(Date.now() + 15 * 60 * 1000).toLocaleString());
    console.log('========================================');
    console.log('💡 To send real emails, set RESEND_API_KEY or SENDGRID_API_KEY');
    console.log('========================================\n');
    
    return true; // Return true for development

  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

// ============================================================================
// INITIALIZE DATABASE TABLES
// ============================================================================

async function ensureTablesExist(client: any) {
  // Ensure users table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(20),
      role VARCHAR(50) DEFAULT 'user',
      company VARCHAR(255),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      pincode VARCHAR(20),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    )
  `);

  // Ensure password_reset_codes table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      email VARCHAR(255) NOT NULL,
      code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_reset_email_code ON password_reset_codes (email, code)
  `);
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  let client = null;
  
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    console.log('Processing forgot password request for:', email);

    // Connect to database
    const dbPool = getPool();
    client = await dbPool.connect();
    
    // Ensure tables exist
    await ensureTablesExist(client);

    // Check if user exists
    const userResult = await client.query(
      'SELECT id, email, first_name FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (userResult.rows.length === 0) {
      // For security, still return success (don't reveal if email exists)
      console.log('User not found:', email);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification code has been sent',
      });
    }

    const user = userResult.rows[0];
    console.log('User found:', user.email);

    // Generate verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing codes for this user
    await client.query(
      'DELETE FROM password_reset_codes WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    // Store new code
    await client.query(
      'INSERT INTO password_reset_codes (user_id, email, code, expires_at) VALUES ($1, LOWER($2), $3, $4)',
      [user.id, email, code, expiresAt]
    );

    console.log('Reset code stored in database');

    // Send email
    const emailSent = await sendResetEmail(email, code, user.first_name);
    
    if (!emailSent) {
      console.warn('Failed to send email, but code is stored');
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a verification code has been sent',
      // In development, include the code for testing (remove in production!)
      ...(process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY && !process.env.SENDGRID_API_KEY
        ? { devCode: code }
        : {}
      ),
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    
    // Return a user-friendly error
    return NextResponse.json(
      { 
        success: false, 
        error: 'Unable to process request. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        client.release();
      } catch (e) {
        console.error('Error releasing client:', e);
      }
    }
  }
}