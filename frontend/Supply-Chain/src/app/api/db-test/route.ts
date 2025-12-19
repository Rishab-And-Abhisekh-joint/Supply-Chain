// app/api/db-test/route.ts
// Test database connectivity - use this to diagnose issues

import { NextRequest, NextResponse } from 'next/server';

interface DbTestResults {
  timestamp: string;
  hasDbUrl: boolean;
  dbUrlPrefix: string;
  connection?: string;
  serverTime?: string;
  database?: string;
  tables?: string[];
  ordersColumns?: Array<{ column_name: string; data_type: string; is_nullable: string }>;
  shipmentsColumns?: Array<{ column_name: string; data_type: string; is_nullable: string }>;
  ordersCount?: number | string;
  shipmentsCount?: number | string;
  status?: string;
  message?: string;
  error?: string;
  errorCode?: string;
}

export async function GET(request: NextRequest) {
  const results: DbTestResults = {
    timestamp: new Date().toISOString(),
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET',
  };

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      ...results,
      status: 'NO_DATABASE_URL',
      message: 'DATABASE_URL environment variable is not set'
    });
  }

  let pool = null;
  
  try {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    // Test basic connection
    const connectResult = await pool.query('SELECT NOW() as time, current_database() as db');
    results.connection = 'SUCCESS';
    results.serverTime = connectResult.rows[0].time;
    results.database = connectResult.rows[0].db;

    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    results.tables = tablesResult.rows.map((r: { table_name: string }) => r.table_name);

    // Check orders table structure if it exists
    if (results.tables && results.tables.includes('orders')) {
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'orders'
        ORDER BY ordinal_position
      `);
      results.ordersColumns = columnsResult.rows;
    }

    // Check shipments table structure if it exists
    if (results.tables && results.tables.includes('shipments')) {
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'shipments'
        ORDER BY ordinal_position
      `);
      results.shipmentsColumns = columnsResult.rows;
    }

    // Count records
    try {
      const ordersCount = await pool.query('SELECT COUNT(*) FROM orders');
      results.ordersCount = parseInt(ordersCount.rows[0].count);
    } catch {
      results.ordersCount = 'Table does not exist';
    }

    try {
      const shipmentsCount = await pool.query('SELECT COUNT(*) FROM shipments');
      results.shipmentsCount = parseInt(shipmentsCount.rows[0].count);
    } catch {
      results.shipmentsCount = 'Table does not exist';
    }

    await pool.end();
    
    return NextResponse.json({
      ...results,
      status: 'SUCCESS',
      message: 'Database connection successful'
    });

  } catch (error: unknown) {
    if (pool) {
      try { await pool.end(); } catch { /* ignore */ }
    }
    
    const pgError = error as { code?: string; message?: string };
    
    return NextResponse.json({
      ...results,
      status: 'ERROR',
      error: pgError.message,
      errorCode: pgError.code,
      message: 'Database connection failed'
    }, { status: 500 });
  }
}

// POST to create/fix tables
export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      status: 'NO_DATABASE_URL',
      message: 'DATABASE_URL environment variable is not set'
    }, { status: 400 });
  }

  let pool = null;
  const results: string[] = [];
  
  try {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(100) UNIQUE NOT NULL,
        tracking_number VARCHAR(100) UNIQUE NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        customer_id VARCHAR(100),
        customer_name VARCHAR(255),
        items JSONB DEFAULT '[]',
        total_amount DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address TEXT,
        delivery_type VARCHAR(100),
        assigned_vehicle VARCHAR(100),
        vehicle_number VARCHAR(50),
        driver_name VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('Orders table created/verified');

    // Create shipments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        order_number VARCHAR(100),
        user_email VARCHAR(255) NOT NULL,
        vehicle_id VARCHAR(100),
        vehicle_number VARCHAR(50),
        driver_name VARCHAR(255),
        vehicle_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'picking_up',
        origin_name VARCHAR(255),
        origin_lat DECIMAL(10,6),
        origin_lng DECIMAL(10,6),
        destination_name VARCHAR(255),
        destination_lat DECIMAL(10,6),
        destination_lng DECIMAL(10,6),
        current_lat DECIMAL(10,6),
        current_lng DECIMAL(10,6),
        route_data JSONB,
        eta VARCHAR(100),
        progress INTEGER DEFAULT 0,
        distance VARCHAR(100),
        savings VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('Shipments table created/verified');

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        order_id VARCHAR(255),
        order_number VARCHAR(100),
        tracking_number VARCHAR(100),
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('Notifications table created/verified');

    // Create pending_orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(255) NOT NULL,
        product_id VARCHAR(100),
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
        total DECIMAL(12,2) NOT NULL DEFAULT 0,
        recommendation TEXT,
        source VARCHAR(100) DEFAULT 'manual',
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('Pending orders table created/verified');

    // Create trucks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trucks (
        id VARCHAR(100) PRIMARY KEY,
        vehicle_number VARCHAR(50) UNIQUE NOT NULL,
        driver_name VARCHAR(255),
        vehicle_type VARCHAR(100),
        capacity_kg INTEGER DEFAULT 10000,
        status VARCHAR(50) DEFAULT 'available',
        current_lat DECIMAL(10,6),
        current_lng DECIMAL(10,6),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('Trucks table created/verified');

    // Create optimized_routes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS optimized_routes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(255) NOT NULL,
        route_name VARCHAR(255),
        from_location VARCHAR(255),
        to_location VARCHAR(255),
        from_lat DECIMAL(10,6),
        from_lng DECIMAL(10,6),
        to_lat DECIMAL(10,6),
        to_lng DECIMAL(10,6),
        distance VARCHAR(100),
        time VARCHAR(100),
        savings VARCHAR(50),
        fuel_cost DECIMAL(10,2),
        route_coordinates JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('Optimized routes table created/verified');

    await pool.end();
    
    return NextResponse.json({
      status: 'SUCCESS',
      message: 'All tables created/verified successfully',
      results
    });

  } catch (error: unknown) {
    if (pool) {
      try { await pool.end(); } catch { /* ignore */ }
    }
    
    const pgError = error as { code?: string; message?: string };
    
    return NextResponse.json({
      status: 'ERROR',
      error: pgError.message,
      errorCode: pgError.code,
      results
    }, { status: 500 });
  }
}