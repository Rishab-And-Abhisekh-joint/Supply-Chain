// ============================================================================
// SIGNUP API - /api/auth/signup/route.ts
// Creates new user account with secure password hashing
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://supplychainuser:vQKnELrP9zskcONMdFq2OK3vahcy1Rt0@dpg-d4vpefumcj7s73drp540-a.oregon-postgres.render.com/supplychaindb_wpdq';

// Connection pool singleton
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
      console.log('Database pool created');
    } catch (error) {
      console.error('Failed to create pool:', error);
      throw error;
    }
  }
  return pool;
}

// ============================================================================
// PASSWORD HASHING - PBKDF2 with SHA-512
// ============================================================================

function hashPassword(password: string): string {
  // Generate a random 32-byte salt
  const salt = crypto.randomBytes(32).toString('hex');
  // Hash with PBKDF2: 100,000 iterations, 64-byte output, SHA-512
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  // Store as salt:hash
  return `${salt}:${hash}`;
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
  console.log('Ensuring tables exist...');
  
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
  console.log('Tables verified');
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('=== SIGNUP REQUEST RECEIVED ===');
  
  let client = null;
  
  try {
    // Parse request body
    const body = await request.json();
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      role, 
      company, 
      address, 
      city, 
      state, 
      pincode 
    } = body;

    console.log('Signup attempt for:', email);

    // Validation
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      console.log('Password too short');
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
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

    // Check if email already exists
    console.log('Checking if email exists...');
    const existingUser = await client.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('Email already exists:', email);
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = hashPassword(password);

    // Insert new user
    console.log('Inserting new user...');
    const result = await client.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, role, company, address, city, state, pincode)
       VALUES (LOWER($1), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, email, first_name, last_name, phone, role, company, address, city, state, pincode, created_at`,
      [
        email,
        hashedPassword,
        firstName || '',
        lastName || '',
        phone || '',
        role || 'user',
        company || '',
        address || '',
        city || '',
        state || '',
        pincode || ''
      ]
    );

    const user = result.rows[0];
    console.log('User created successfully:', user.id);
    
    // Generate token
    const token = generateToken(user.id, user.email);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
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
    console.error('=== SIGNUP ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    // Check for unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Signup failed. Please try again.',
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
    message: 'Signup API is working',
    method: 'POST',
    requiredFields: ['email', 'password'],
    optionalFields: ['firstName', 'lastName', 'phone', 'role', 'company', 'address', 'city', 'state', 'pincode'],
  });
}