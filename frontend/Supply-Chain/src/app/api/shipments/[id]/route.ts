// app/api/shipments/[id]/route.ts
// Individual shipment operations - STANDALONE

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

async function query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

async function queryOne<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userEmail = getUserEmail(request);
    const shipment = await queryOne(`
      SELECT * FROM shipments WHERE user_email = $1 AND (id::text = $2 OR order_number = $2)
    `, [userEmail, params.id]);

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: shipment });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch shipment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userEmail = getUserEmail(request);
    const body = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.status !== undefined) { updates.push(`status = $${paramIndex}`); values.push(body.status); paramIndex++; }
    if (body.progress !== undefined) { updates.push(`progress = $${paramIndex}`); values.push(body.progress); paramIndex++; }
    if (body.currentLat !== undefined) { updates.push(`current_lat = $${paramIndex}`); values.push(body.currentLat); paramIndex++; }
    if (body.currentLng !== undefined) { updates.push(`current_lng = $${paramIndex}`); values.push(body.currentLng); paramIndex++; }
    if (body.eta !== undefined) { updates.push(`eta = $${paramIndex}`); values.push(body.eta); paramIndex++; }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(userEmail, params.id);

    const result = await queryOne<Record<string, unknown>>(`
      UPDATE shipments SET ${updates.join(', ')}
      WHERE user_email = $${paramIndex} AND (id::text = $${paramIndex + 1} OR order_number = $${paramIndex + 1})
      RETURNING *
    `, values);

    if (!result) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Update order status if shipment status changes
    if (body.status === 'delivered') {
      await query(`UPDATE orders SET status = 'delivered' WHERE id = $1`, [result.order_id]);
    } else if (body.status === 'in_transit') {
      await query(`UPDATE orders SET status = 'shipped' WHERE id = $1`, [result.order_id]);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userEmail = getUserEmail(request);
    const result = await queryOne(`
      DELETE FROM shipments WHERE user_email = $1 AND id::text = $2 RETURNING id
    `, [userEmail, params.id]);

    if (!result) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to delete shipment' }, { status: 500 });
  }
}
