// app/api/orders/[id]/route.ts
// API routes for individual order operations - NO external auth dependencies

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Helper to get user email from request headers
function getUserEmail(request: NextRequest): string {
  // Try to get from custom header (set by frontend)
  const userHeader = request.headers.get('X-User-Email');
  if (userHeader) return userHeader;
  
  // Fallback to demo user
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

interface UpdateOrderRequest {
  status?: string;
  shippingAddress?: string;
  deliveryType?: string;
  assignedVehicle?: string;
  vehicleNumber?: string;
  driverName?: string;
  notes?: string;
}

// GET /api/orders/[id] - Get a single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userEmail = getUserEmail(request);
    const orderId = params.id;

    const order = await queryOne(`
      SELECT 
        o.*,
        s.id as shipment_id,
        s.status as shipment_status,
        s.progress as shipment_progress,
        s.current_lat,
        s.current_lng,
        s.eta,
        s.origin_name,
        s.destination_name
      FROM orders o
      LEFT JOIN shipments s ON o.id = s.order_id
      WHERE o.user_email = $1 AND (o.id::text = $2 OR o.order_number = $2)
    `, [userEmail, orderId]);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update an order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userEmail = getUserEmail(request);
    const orderId = params.id;
    const body: UpdateOrderRequest = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(body.status);
      paramIndex++;
    }

    if (body.shippingAddress !== undefined) {
      updates.push(`shipping_address = $${paramIndex}`);
      values.push(body.shippingAddress);
      paramIndex++;
    }

    if (body.deliveryType !== undefined) {
      updates.push(`delivery_type = $${paramIndex}`);
      values.push(body.deliveryType);
      paramIndex++;
    }

    if (body.assignedVehicle !== undefined) {
      updates.push(`assigned_vehicle = $${paramIndex}`);
      values.push(body.assignedVehicle);
      paramIndex++;
    }

    if (body.vehicleNumber !== undefined) {
      updates.push(`vehicle_number = $${paramIndex}`);
      values.push(body.vehicleNumber);
      paramIndex++;
    }

    if (body.driverName !== undefined) {
      updates.push(`driver_name = $${paramIndex}`);
      values.push(body.driverName);
      paramIndex++;
    }

    if (body.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(body.notes);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(userEmail, orderId);

    const result = await queryOne(`
      UPDATE orders
      SET ${updates.join(', ')}
      WHERE user_email = $${paramIndex} AND (id::text = $${paramIndex + 1} OR order_number = $${paramIndex + 1})
      RETURNING *
    `, values);

    if (!result) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Delete an order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userEmail = getUserEmail(request);
    const orderId = params.id;

    const result = await queryOne(`
      DELETE FROM orders
      WHERE user_email = $1 AND (id::text = $2 OR order_number = $2)
      RETURNING id, order_number
    `, [userEmail, orderId]);

    if (!result) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
      data: result
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
