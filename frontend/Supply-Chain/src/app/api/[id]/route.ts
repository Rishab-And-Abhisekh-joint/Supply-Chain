// app/api/[id]/route.ts
// Generic API route for fetching by ID - STANDALONE (Next.js 15 compatible)

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

async function queryOne<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T | null> {
  const result = await pool.query(text, params);
  return result.rows[0] as T || null;
}

// GET /api/[id] - Get a single item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userEmail = getUserEmail(request);

    // Try to find in orders first
    let result = await queryOne(`
      SELECT * FROM orders 
      WHERE user_email = $1 AND (id::text = $2 OR order_number = $2 OR tracking_number = $2)
    `, [userEmail, id]);

    if (result) {
      return NextResponse.json({ success: true, type: 'order', data: result });
    }

    // Try shipments
    result = await queryOne(`
      SELECT * FROM shipments 
      WHERE user_email = $1 AND (id::text = $2 OR order_number = $2)
    `, [userEmail, id]);

    if (result) {
      return NextResponse.json({ success: true, type: 'shipment', data: result });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// PUT /api/[id] - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userEmail = getUserEmail(request);
    const body = await request.json();

    // Try to update order
    const result = await queryOne(`
      UPDATE orders 
      SET status = COALESCE($3, status),
          notes = COALESCE($4, notes)
      WHERE user_email = $1 AND (id::text = $2 OR order_number = $2)
      RETURNING *
    `, [userEmail, id, body.status, body.notes]);

    if (result) {
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE /api/[id] - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userEmail = getUserEmail(request);

    const result = await queryOne(`
      DELETE FROM orders 
      WHERE user_email = $1 AND (id::text = $2 OR order_number = $2)
      RETURNING id
    `, [userEmail, id]);

    if (result) {
      return NextResponse.json({ success: true, message: 'Deleted' });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}