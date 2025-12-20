// ============================================================================
// VERIFY RESET CODE API - /api/auth/verify-reset-code/route.ts
// Verifies the password reset code before allowing password change
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

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
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  let client = null;
  
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Code must be 6 digits' },
        { status: 400 }
      );
    }

    console.log('Verifying reset code for:', email);

    // Connect to database
    const dbPool = getPool();
    client = await dbPool.connect();

    // Find the code in database
    const result = await client.query(
      `SELECT id, email, expires_at FROM password_reset_codes 
       WHERE LOWER(email) = LOWER($1) 
       AND code = $2 
       AND used = FALSE 
       AND expires_at > NOW()`,
      [email, code]
    );

    if (result.rows.length === 0) {
      // Check if code exists but is expired
      const expiredCheck = await client.query(
        `SELECT id FROM password_reset_codes 
         WHERE LOWER(email) = LOWER($1) AND code = $2 AND used = FALSE`,
        [email, code]
      );

      if (expiredCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Verification code has expired. Please request a new one.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    console.log('Code verified successfully for:', email);

    return NextResponse.json({
      success: true,
      message: 'Code verified successfully',
    });

  } catch (error: any) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Unable to verify code. Please try again.',
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