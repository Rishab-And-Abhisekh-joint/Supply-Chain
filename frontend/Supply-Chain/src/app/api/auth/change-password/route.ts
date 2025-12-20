// ============================================================================
// CHANGE PASSWORD API - /api/auth/change-password/route.ts
// Changes user password (requires current password verification)
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
// PASSWORD UTILITIES
// ============================================================================

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (storedHash.includes(':')) {
      const [salt, hash] = storedHash.split(':');
      if (!salt || !hash) return false;
      
      const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
    }
    return password === storedHash;
  } catch {
    return false;
  }
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  let client = null;
  
  try {
    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // Validation
    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email, current password, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    console.log('Password change attempt for:', email);

    // Connect to database
    const dbPool = getPool();
    client = await dbPool.connect();

    // Find user
    const result = await client.query(
      'SELECT id, password FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Verify current password
    if (!verifyPassword(currentPassword, user.password)) {
      console.log('Current password incorrect for:', email);
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = hashPassword(newPassword);

    // Update password
    await client.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, user.id]
    );

    console.log('Password changed successfully for:', email);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });

  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to change password. Please try again.',
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