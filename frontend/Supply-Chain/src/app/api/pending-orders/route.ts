// app/api/pending-orders/route.ts
// API for managing pending orders from demand forecasting

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for pending orders
let pendingOrdersCache: PendingOrder[] = [];

interface PendingOrder {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  recommendation?: string;
  source: string;
  userEmail: string;
  createdAt: string;
  status: 'pending' | 'ready_for_shipment' | 'processing' | 'completed';
}

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

// GET /api/pending-orders
export async function GET(request: NextRequest) {
  const userEmail = getUserEmail(request);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

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

      let query = `SELECT * FROM pending_orders WHERE user_email = $1`;
      const params: string[] = [userEmail];

      if (status) {
        query += ` AND status = $2`;
        params.push(status);
      }
      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, params);
      await pool.end();

      const orders = result.rows.map(o => ({
        id: o.id,
        productId: o.product_id || `PROD-${o.id}`,
        productName: o.product_name,
        quantity: o.quantity,
        unitPrice: parseFloat(o.unit_price),
        total: parseFloat(o.total),
        recommendation: o.recommendation,
        source: o.source,
        status: o.status,
        createdAt: o.created_at,
      }));

      return NextResponse.json({ success: true, data: orders });
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  // Fallback to cache
  let filtered = pendingOrdersCache.filter(o => o.userEmail === userEmail);
  if (status) {
    filtered = filtered.filter(o => o.status === status);
  }

  return NextResponse.json({ success: true, data: filtered, source: 'cache' });
}

// POST /api/pending-orders
export async function POST(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const body = await request.json();

    const pendingOrderId = `pending-${Date.now()}`;
    const productId = body.productId || `PROD-${Date.now()}`;

    if (process.env.DATABASE_URL) {
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });

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

        const result = await pool.query(`
          INSERT INTO pending_orders (user_email, product_id, product_name, quantity, unit_price, total, recommendation, source, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `, [
          userEmail,
          productId,
          body.productName || 'Product',
          body.quantity || 1,
          body.unitPrice || 0,
          body.total || (body.quantity || 1) * (body.unitPrice || 0),
          body.recommendation || 'From Demand Forecast',
          body.source || 'demand_forecasting',
          'pending'
        ]);

        await pool.end();

        const row = result.rows[0];
        return NextResponse.json({ 
          success: true, 
          data: {
            id: row.id,
            productId: row.product_id,
            productName: row.product_name,
            quantity: row.quantity,
            unitPrice: parseFloat(row.unit_price),
            total: parseFloat(row.total),
            recommendation: row.recommendation,
            source: row.source,
            status: row.status,
            createdAt: row.created_at,
          }
        }, { status: 201 });
      } catch (error) {
        console.error('Database error:', error);
      }
    }

    // Fallback to cache
    const pendingOrder: PendingOrder = {
      id: pendingOrderId,
      productId: productId,
      productName: body.productName || 'Product',
      quantity: body.quantity || 1,
      unitPrice: body.unitPrice || 0,
      total: body.total || (body.quantity || 1) * (body.unitPrice || 0),
      recommendation: body.recommendation || 'From Demand Forecast',
      source: body.source || 'demand_forecasting',
      userEmail,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    pendingOrdersCache.unshift(pendingOrder);
    if (pendingOrdersCache.length > 50) {
      pendingOrdersCache = pendingOrdersCache.slice(0, 50);
    }

    return NextResponse.json({ success: true, data: pendingOrder, source: 'cache' }, { status: 201 });
  } catch (error) {
    console.error('Error creating pending order:', error);
    return NextResponse.json({ error: 'Failed to create pending order' }, { status: 500 });
  }
}

// PUT /api/pending-orders
export async function PUT(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });

        const result = await pool.query(`
          UPDATE pending_orders 
          SET status = $1 
          WHERE id = $2 AND user_email = $3
          RETURNING *
        `, [status, orderId, userEmail]);

        await pool.end();

        if (result.rows.length === 0) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result.rows[0] });
      } catch (error) {
        console.error('Database error:', error);
      }
    }

    // Fallback to cache
    const orderIndex = pendingOrdersCache.findIndex(o => o.id === orderId && o.userEmail === userEmail);
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    pendingOrdersCache[orderIndex].status = status;
    return NextResponse.json({ success: true, data: pendingOrdersCache[orderIndex], source: 'cache' });
  } catch (error) {
    console.error('Error updating pending order:', error);
    return NextResponse.json({ error: 'Failed to update pending order' }, { status: 500 });
  }
}

// DELETE /api/pending-orders
export async function DELETE(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });

        await pool.query(`DELETE FROM pending_orders WHERE id = $1 AND user_email = $2`, [orderId, userEmail]);
        await pool.end();

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Database error:', error);
      }
    }

    // Fallback to cache
    pendingOrdersCache = pendingOrdersCache.filter(o => o.id !== orderId);
    return NextResponse.json({ success: true, source: 'cache' });
  } catch (error) {
    console.error('Error deleting pending order:', error);
    return NextResponse.json({ error: 'Failed to delete pending order' }, { status: 500 });
  }
}
