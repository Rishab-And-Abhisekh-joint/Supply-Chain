// app/api/orders/route.ts
// API routes for order management - STANDALONE (no external dependencies)

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Helper to get user email from request headers
function getUserEmail(request: NextRequest): string {
  const userHeader = request.headers.get('X-User-Email');
  if (userHeader) return userHeader;
  return 'demo@example.com';
}

// Helper to query database
async function query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

async function queryOne<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

// Helper to generate order number
function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ORD-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper to generate tracking number
function generateTrackingNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TRK-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET /api/orders
export async function GET(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let queryText = `
      SELECT 
        id, order_number, tracking_number, customer_id, customer_name,
        items, total_amount, status, shipping_address, delivery_type,
        assigned_vehicle, vehicle_number, driver_name, notes,
        created_at, updated_at
      FROM orders
      WHERE user_email = $1
    `;
    const params: unknown[] = [userEmail];
    let paramIndex = 2;

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (
        order_number ILIKE $${paramIndex} OR 
        tracking_number ILIKE $${paramIndex} OR 
        customer_name ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const orders = await query(queryText, params);

    // Transform to camelCase
    const transformedOrders = orders.map((o: Record<string, unknown>) => ({
      id: o.id,
      orderNumber: o.order_number,
      trackingNumber: o.tracking_number,
      customerId: o.customer_id,
      customerName: o.customer_name,
      items: o.items,
      totalAmount: parseFloat(String(o.total_amount || 0)),
      status: o.status,
      shippingAddress: o.shipping_address,
      deliveryType: o.delivery_type,
      assignedVehicle: o.assigned_vehicle,
      vehicleNumber: o.vehicle_number,
      driverName: o.driver_name,
      notes: o.notes,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: transformedOrders
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders
export async function POST(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const body = await request.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Order must have at least one item' }, { status: 400 });
    }

    const orderNumber = body.orderNumber || generateOrderNumber();
    const trackingNumber = body.trackingNumber || generateTrackingNumber();
    const totalAmount = body.totalAmount || body.items.reduce((sum: number, item: { total: number }) => sum + item.total, 0);

    const result = await queryOne(`
      INSERT INTO orders (
        order_number, tracking_number, user_email, customer_id, customer_name,
        items, total_amount, status, shipping_address, delivery_type,
        assigned_vehicle, vehicle_number, driver_name, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      orderNumber, trackingNumber, userEmail,
      body.customerId || `CUST-${Date.now()}`,
      body.customerName || 'Self',
      JSON.stringify(body.items),
      totalAmount,
      body.status || 'pending',
      body.shippingAddress || '',
      body.deliveryType || 'Standard',
      body.assignedVehicle || null,
      body.vehicleNumber || null,
      body.driverName || null,
      body.notes || null
    ]);

    return NextResponse.json({ success: true, data: result }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating order:', error);
    const pgError = error as { code?: string };
    if (pgError.code === '23505') {
      return NextResponse.json({ error: 'Order number already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
