import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://supplychainuser:vQKnELrP9zskcONMdFq2OK3vahcy1Rt0@dpg-d4vpefumcj7s73drp540-a.oregon-postgres.render.com/supplychaindb_wpdq',
  ssl: { rejectUnauthorized: false },
});

// Hash password using crypto (no external dependencies)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email, code, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Verify the code again (in case someone tries to bypass)
    const codeResult = await pool.query(
      `SELECT * FROM password_reset_codes 
       WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()`,
      [email.toLowerCase(), code]
    );

    if (codeResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    const resetCode = codeResult.rows[0];

    // Hash the new password
    const hashedPassword = hashPassword(newPassword);

    // Update user's password
    const updateResult = await pool.query(
      `UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2 RETURNING id`,
      [hashedPassword, email.toLowerCase()]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Mark the reset code as used
    await pool.query(
      'UPDATE password_reset_codes SET used = TRUE WHERE id = $1',
      [resetCode.id]
    );

    // Clean up old/expired codes for this user
    await pool.query(
      `DELETE FROM password_reset_codes 
       WHERE email = $1 AND (used = TRUE OR expires_at < NOW())`,
      [email.toLowerCase()]
    );

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}