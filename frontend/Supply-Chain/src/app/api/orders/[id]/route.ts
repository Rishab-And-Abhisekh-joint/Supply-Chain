// app/api/orders/[id]/route.ts
// Single order operations - Next.js 15 compatible with fallback

import { NextRequest, NextResponse } from 'next/server';

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const userEmail = getUserEmail(request);

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        data: {
          id: orderId,
          orderNumber: orderId.startsWith('ORD-') ? orderId : `ORD-${orderId.slice(0, 6)}`,
          trackingNumber: `TRK-DEMO${orderId.slice(-4)}`,
          customerName: 'Demo Customer',
          items: [{ productId: 'P1', productName: 'Sample Product', quantity: 10, unitPrice: 100, total: 1000 }],
          totalAmount: 1000,
          status: 'processing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        source: 'demo'
      });
    }

    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const result = await pool.query(`
      SELECT o.*, s.id as shipment_id, s.status as shipment_status, s.progress
      FROM orders o
      LEFT JOIN shipments s ON o.id = s.order_id
      WHERE o.user_email = $1 AND (o.id::text = $2 OR o.order_number = $2)
    `, [userEmail, orderId]);

    await pool.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const o = result.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        id: o.id,
        orderNumber: o.order_number,
        trackingNumber: o.tracking_number,
        customerName: o.customer_name,
        items: o.items || [],
        totalAmount: parseFloat(String(o.total_amount || 0)),
        status: o.status,
        shippingAddress: o.shipping_address,
        vehicleNumber: o.vehicle_number,
        driverName: o.driver_name,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        shipmentId: o.shipment_id,
        shipmentStatus: o.shipment_status,
        shipmentProgress: o.progress,
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const userEmail = getUserEmail(request);
    const body = await request.json();

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        data: { id: orderId, ...body, updatedAt: new Date().toISOString() },
        source: 'demo'
      });
    }

    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.status) { updates.push(`status = $${paramIndex}`); values.push(body.status); paramIndex++; }
    if (body.shippingAddress) { updates.push(`shipping_address = $${paramIndex}`); values.push(body.shippingAddress); paramIndex++; }
    if (body.notes) { updates.push(`notes = $${paramIndex}`); values.push(body.notes); paramIndex++; }

    if (updates.length === 0) {
      await pool.end();
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(userEmail, orderId);
    const result = await pool.query(`
      UPDATE orders SET ${updates.join(', ')}
      WHERE user_email = $${paramIndex} AND (id::text = $${paramIndex + 1} OR order_number = $${paramIndex + 1})
      RETURNING *
    `, values);

    await pool.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const userEmail = getUserEmail(request);

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, message: 'Order deleted (demo)' });
    }

    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await pool.query(`
      DELETE FROM orders WHERE user_email = $1 AND (id::text = $2 OR order_number = $2)
    `, [userEmail, orderId]);

    await pool.end();
    return NextResponse.json({ success: true, message: 'Order deleted' });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
