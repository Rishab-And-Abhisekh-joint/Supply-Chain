// ============================================================================
// LOGIN API - /api/auth/login/route.ts
// Authenticates user and returns token
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://supplychainuser:vQKnELrP9zskcONMdFq2OK3vahcy1Rt0@dpg-d4vpefumcj7s73drp540-a.oregon-postgres.render.com/supplychaindb_wpdq';

let pool: any = null;

async function getPool() {
  if (!pool) {
    try {
      const { Pool } = await import('pg');
      pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      console.log('Login: Database pool created');
    } catch (error) {
      console.error('Failed to create pool:', error);
      throw error;
    }
  }
  return pool;
}

// ============================================================================
// PASSWORD VERIFICATION
// ============================================================================

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    // Handle the salt:hash format
    if (storedHash.includes(':')) {
      const [salt, hash] = storedHash.split(':');
      if (!salt || !hash) return false;
      
      const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
    }
    
    // Fallback for plain text passwords (legacy - should not happen in production)
    return password === storedHash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Generate a simple token
function generateToken(userId: number, email: string): string {
  const payload = `${userId}:${email}:${Date.now()}`;
  const secret = process.env.JWT_SECRET || 'supply-chain-secret-key-2024';
  const hash = crypto.createHash('sha256').update(payload + secret).digest('hex');
  return `${Buffer.from(payload).toString('base64')}.${hash}`;
}

// ============================================================================
// ENSURE TABLES EXIST
// ============================================================================

async function ensureTablesExist(client: any) {
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

  await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`);
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('=== LOGIN REQUEST RECEIVED ===');
  
  let client = null;
  
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Login attempt for:', email);

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to database
    console.log('Connecting to database...');
    const dbPool = await getPool();
    client = await dbPool.connect();
    console.log('Database connected');
    
    // Ensure tables exist
    await ensureTablesExist(client);

    // Find user by email
    console.log('Finding user...');
    const result = await client.query(
      `SELECT id, email, password, first_name, last_name, phone, role, company, address, city, state, pincode, is_active
       FROM users 
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (result.rows.length === 0) {
      console.log('User not found:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    console.log('User found:', user.id);

    // Check if account is active
    if (user.is_active === false) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    console.log('Verifying password...');
    if (!verifyPassword(password, user.password)) {
      console.log('Invalid password for:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('Password verified');

    // Update last login
    await client.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate token
    const token = generateToken(user.id, user.email);

    console.log('Login successful for:', email);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phone: user.phone || '',
        role: user.role || 'user',
        company: user.company || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
      },
      token,
    });

  } catch (error: any) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error:', error.message);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Login failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        client.release();
        console.log('Database connection released');
      } catch (e) {
        console.error('Error releasing client:', e);
      }
    }
  }
}

// ============================================================================
// GET HANDLER - For testing
// ============================================================================

export async function GET() {
  return NextResponse.json({
    message: 'Login API is working',
    method: 'POST',
    requiredFields: ['email', 'password'],
  });
}