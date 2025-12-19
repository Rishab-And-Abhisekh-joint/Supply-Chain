// app/api/orders/route.ts
// Orders API with proper error handling and fallback data

import { NextRequest, NextResponse } from 'next/server';

// Demo data fallback when database is unavailable
const DEMO_ORDERS = [
  {
    id: 'demo-1',
    orderNumber: 'ORD-DEMO01',
    trackingNumber: 'TRK-DEMO0001',
    customerId: 'CUST-001',
    customerName: 'Reliance Fresh',
    items: [{ productId: 'P1', productName: 'Organic Wheat Flour', quantity: 100, unitPrice: 45, total: 4500 }],
    totalAmount: 4500,
    status: 'processing',
    shippingAddress: 'Mumbai, Maharashtra',
    deliveryType: 'Standard',
    vehicleNumber: 'MH-01-AB-1234',
    driverName: 'Rajesh Kumar',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    orderNumber: 'ORD-DEMO02',
    trackingNumber: 'TRK-DEMO0002',
    customerId: 'CUST-002',
    customerName: 'BigBasket',
    items: [{ productId: 'P2', productName: 'Basmati Rice Premium', quantity: 200, unitPrice: 85, total: 17000 }],
    totalAmount: 17000,
    status: 'shipped',
    shippingAddress: 'Delhi, NCR',
    deliveryType: 'Express',
    vehicleNumber: 'DL-02-CD-5678',
    driverName: 'Amit Singh',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

// GET /api/orders
export async function GET(request: NextRequest) {
  const userEmail = getUserEmail(request);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not configured, using demo data');
    let filtered = DEMO_ORDERS;
    if (status) filtered = filtered.filter(o => o.status === status);
    return NextResponse.json({ success: true, data: filtered, source: 'demo' });
  }

  try {
    // Dynamic import to avoid build errors if pg is not installed
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    let queryText = `
      SELECT id, order_number, tracking_number, customer_id, customer_name,
             items, total_amount, status, shipping_address, delivery_type,
             assigned_vehicle, vehicle_number, driver_name, notes, created_at, updated_at
      FROM orders WHERE user_email = $1
    `;
    const params: unknown[] = [userEmail];

    if (status) {
      queryText += ` AND status = $2`;
      params.push(status);
    }
    queryText += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await pool.query(queryText, params);
    await pool.end();

    // Transform to camelCase
    const orders = result.rows.map((o: Record<string, unknown>) => ({
      id: o.id,
      orderNumber: o.order_number,
      trackingNumber: o.tracking_number,
      customerId: o.customer_id,
      customerName: o.customer_name,
      items: o.items || [],
      totalAmount: parseFloat(String(o.total_amount || 0)),
      status: o.status || 'pending',
      shippingAddress: o.shipping_address || '',
      deliveryType: o.delivery_type || 'Standard',
      assignedVehicle: o.assigned_vehicle,
      vehicleNumber: o.vehicle_number,
      driverName: o.driver_name,
      notes: o.notes,
      createdAt: o.created_at || new Date().toISOString(),
      updatedAt: o.updated_at || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, data: orders });

  } catch (error: unknown) {
    console.error('Database error:', error);
    // Return demo data on database error
    let filtered = DEMO_ORDERS;
    if (status) filtered = filtered.filter(o => o.status === status);
    return NextResponse.json({ 
      success: true, 
      data: filtered, 
      source: 'demo',
      note: 'Database temporarily unavailable'
    });
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

    // Generate order and tracking numbers
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let orderNumber = 'ORD-';
    let trackingNumber = 'TRK-';
    for (let i = 0; i < 6; i++) orderNumber += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 8; i++) trackingNumber += chars.charAt(Math.floor(Math.random() * chars.length));

    const totalAmount = body.totalAmount || body.items.reduce((sum: number, item: { total: number }) => sum + (item.total || 0), 0);

    if (!process.env.DATABASE_URL) {
      // Demo mode
      const newOrder = {
        id: `demo-${Date.now()}`,
        orderNumber,
        trackingNumber,
        customerId: body.customerId || `CUST-${Date.now()}`,
        customerName: body.customerName || 'Self',
        items: body.items,
        totalAmount,
        status: 'pending',
        shippingAddress: body.shippingAddress || '',
        deliveryType: body.deliveryType || 'Standard',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, data: newOrder, source: 'demo' }, { status: 201 });
    }

    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const result = await pool.query(`
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

    await pool.end();

    const o = result.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        id: o.id,
        orderNumber: o.order_number,
        trackingNumber: o.tracking_number,
        status: o.status,
        totalAmount: parseFloat(String(o.total_amount || 0)),
        createdAt: o.created_at,
      }
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating order:', error);
    const pgError = error as { code?: string };
    if (pgError.code === '23505') {
      return NextResponse.json({ error: 'Order number already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
