// app/api/db-migrate/route.ts
// Database migration - fixes table schemas

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: false,
      error: 'DATABASE_URL not configured'
    }, { status: 400 });
  }

  const results: string[] = [];
  let pool = null;

  try {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });

    results.push('Connected to database');

    // Check current orders table structure
    const ordersCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'orders' AND table_schema = 'public'
    `);
    
    const existingColumns = ordersCheck.rows.map((r: { column_name: string }) => r.column_name);
    results.push(`Existing orders columns: ${existingColumns.join(', ')}`);

    // If orders table exists but is missing columns, we need to recreate it
    if (existingColumns.length > 0 && !existingColumns.includes('order_number')) {
      results.push('Orders table has wrong schema - dropping and recreating...');
      
      // First drop shipments (has foreign key to orders)
      await pool.query('DROP TABLE IF EXISTS shipments CASCADE');
      results.push('Dropped shipments table');
      
      // Drop orders
      await pool.query('DROP TABLE IF EXISTS orders CASCADE');
      results.push('Dropped orders table');
      
      // Drop notifications
      await pool.query('DROP TABLE IF EXISTS notifications CASCADE');
      results.push('Dropped notifications table');
    }

    // Create orders table with correct schema
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

    // Verify final structure
    const finalCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'orders' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    results.push(`Final orders columns: ${finalCheck.rows.map((r: { column_name: string }) => r.column_name).join(', ')}`);

    await pool.end();

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      results
    });

  } catch (error: unknown) {
    if (pool) {
      try { await pool.end(); } catch { /* ignore */ }
    }
    
    const pgError = error as { code?: string; message?: string };
    
    return NextResponse.json({
      success: false,
      error: pgError.message,
      errorCode: pgError.code,
      results
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Send a POST request to run the migration',
    warning: 'This will DROP and RECREATE tables if they have wrong schema!'
  });
}