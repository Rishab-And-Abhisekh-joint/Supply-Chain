// app/api/shipments/[id]/route.ts
// Single shipment operations - Next.js 15 compatible with fallback

import { NextRequest, NextResponse } from 'next/server';

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userEmail = getUserEmail(request);

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        data: {
          id,
          orderNumber: `ORD-DEMO${id.slice(-4)}`,
          vehicleNumber: 'MH-01-AB-1234',
          driverName: 'Demo Driver',
          vehicleType: 'Heavy Truck',
          status: 'in_transit',
          origin: { name: 'Mumbai Warehouse', lat: 19.0760, lng: 72.8777 },
          destination: { name: 'Delhi Hub', lat: 28.7041, lng: 77.1025 },
          currentLocation: { lat: 23.0225, lng: 72.5714 },
          eta: '12 hours',
          progress: 45,
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
      SELECT * FROM shipments WHERE user_email = $1 AND (id::text = $2 OR order_number = $2)
    `, [userEmail, id]);

    await pool.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const s = result.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        id: s.id,
        orderId: s.order_id,
        orderNumber: s.order_number,
        vehicleNumber: s.vehicle_number,
        driverName: s.driver_name,
        vehicleType: s.vehicle_type,
        status: s.status,
        origin: { name: s.origin_name, lat: parseFloat(String(s.origin_lat || 0)), lng: parseFloat(String(s.origin_lng || 0)) },
        destination: { name: s.destination_name, lat: parseFloat(String(s.destination_lat || 0)), lng: parseFloat(String(s.destination_lng || 0)) },
        currentLocation: { lat: parseFloat(String(s.current_lat || 0)), lng: parseFloat(String(s.current_lng || 0)) },
        route: s.route_data,
        eta: s.eta,
        progress: s.progress,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch shipment' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userEmail = getUserEmail(request);
    const body = await request.json();

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        data: { id, ...body, updatedAt: new Date().toISOString() },
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

    if (body.status !== undefined) { updates.push(`status = $${paramIndex}`); values.push(body.status); paramIndex++; }
    if (body.progress !== undefined) { updates.push(`progress = $${paramIndex}`); values.push(body.progress); paramIndex++; }
    if (body.currentLat !== undefined) { updates.push(`current_lat = $${paramIndex}`); values.push(body.currentLat); paramIndex++; }
    if (body.currentLng !== undefined) { updates.push(`current_lng = $${paramIndex}`); values.push(body.currentLng); paramIndex++; }
    if (body.eta !== undefined) { updates.push(`eta = $${paramIndex}`); values.push(body.eta); paramIndex++; }

    if (updates.length === 0) {
      await pool.end();
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(userEmail, id);
    const result = await pool.query(`
      UPDATE shipments SET ${updates.join(', ')}
      WHERE user_email = $${paramIndex} AND (id::text = $${paramIndex + 1} OR order_number = $${paramIndex + 1})
      RETURNING *
    `, values);

    // Update order status if shipment delivered
    if (body.status === 'delivered' && result.rows.length > 0) {
      await pool.query(`UPDATE orders SET status = 'delivered' WHERE id = $1`, [result.rows[0].order_id]);
    } else if (body.status === 'in_transit' && result.rows.length > 0) {
      await pool.query(`UPDATE orders SET status = 'shipped' WHERE id = $1`, [result.rows[0].order_id]);
    }

    await pool.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userEmail = getUserEmail(request);

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, message: 'Shipment deleted (demo)' });
    }

    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await pool.query(`DELETE FROM shipments WHERE user_email = $1 AND id::text = $2`, [userEmail, id]);
    await pool.end();

    return NextResponse.json({ success: true, message: 'Shipment deleted' });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to delete shipment' }, { status: 500 });
  }
}
