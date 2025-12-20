// ============================================================================
// PAYMENT API - /api/payments/route.ts
// Handles Razorpay payment creation and verification
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

interface PaymentRecord {
  id: string;
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: string | number;
  currency: string;
  status: string;
  payment_method: string;
  description: string;
  created_at: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://supplychainuser:vQKnELrP9zskcONMdFq2OK3vahcy1Rt0@dpg-d4vpefumcj7s73drp540-a.oregon-postgres.render.com/supplychaindb_wpdq';

let pool: any = null;

async function getPool() {
  if (!pool) {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

// ============================================================================
// RAZORPAY CONFIG
// ============================================================================

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

// ============================================================================
// ENSURE TABLES EXIST
// ============================================================================

async function ensureTablesExist(client: any) {
  // Payment methods table
  await client.query(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email VARCHAR(255) NOT NULL,
      method_type VARCHAR(50) NOT NULL,
      is_default BOOLEAN DEFAULT false,
      card_last_four VARCHAR(4),
      card_brand VARCHAR(50),
      card_expiry VARCHAR(7),
      upi_id VARCHAR(255),
      bank_name VARCHAR(255),
      account_holder VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bank account details (for receiving payments)
  await client.query(`
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email VARCHAR(255) UNIQUE NOT NULL,
      account_holder_name VARCHAR(255) NOT NULL,
      account_number VARCHAR(50) NOT NULL,
      ifsc_code VARCHAR(20) NOT NULL,
      bank_name VARCHAR(255) NOT NULL,
      branch_name VARCHAR(255),
      account_type VARCHAR(50) DEFAULT 'savings',
      is_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Payments/transactions table
  await client.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email VARCHAR(255) NOT NULL,
      order_id VARCHAR(255),
      razorpay_order_id VARCHAR(255),
      razorpay_payment_id VARCHAR(255),
      razorpay_signature VARCHAR(255),
      amount DECIMAL(12,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      status VARCHAR(50) DEFAULT 'pending',
      payment_method VARCHAR(50),
      description TEXT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments (user_email)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods (user_email)`);
}

// ============================================================================
// CREATE RAZORPAY ORDER
// ============================================================================

async function createRazorpayOrder(amount: number, currency: string, receipt: string, notes: Record<string, string>) {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    // Demo mode - return mock order
    return {
      id: `order_demo_${Date.now()}`,
      amount: amount * 100, // Razorpay uses paise
      currency,
      receipt,
      status: 'created',
      notes,
    };
  }

  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt,
      notes,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Razorpay error: ${error}`);
  }

  return response.json();
}

// ============================================================================
// VERIFY RAZORPAY PAYMENT
// ============================================================================

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!RAZORPAY_KEY_SECRET) {
    // Demo mode - always verify
    return true;
  }

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  
  return expectedSignature === signature;
}

// ============================================================================
// POST - Create Payment Order / Verify Payment
// ============================================================================

export async function POST(request: NextRequest) {
  const userEmail = getUserEmail(request);
  let client = null;

  try {
    const body = await request.json();
    const { action } = body;

    const dbPool = await getPool();
    client = await dbPool.connect();
    await ensureTablesExist(client);

    // Create a new payment order
    if (action === 'create_order') {
      const { amount, orderId, description, items } = body as {
        amount: number;
        orderId: string;
        description: string;
        items: OrderItem[];
      };

      if (!amount || amount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid amount' },
          { status: 400 }
        );
      }

      // Create Razorpay order
      const razorpayOrder = await createRazorpayOrder(
        amount,
        'INR',
        `receipt_${Date.now()}`,
        {
          user_email: userEmail,
          order_id: orderId || '',
          description: description || 'Supply Chain Payment',
        }
      );

      // Store payment record
      const result = await client.query(`
        INSERT INTO payments (user_email, order_id, razorpay_order_id, amount, description, metadata, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *
      `, [
        userEmail,
        orderId,
        razorpayOrder.id,
        amount,
        description || 'Order Payment',
        JSON.stringify({ items }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          paymentId: result.rows[0].id,
          razorpayOrderId: razorpayOrder.id,
          amount: amount,
          currency: 'INR',
          keyId: RAZORPAY_KEY_ID || 'rzp_test_demo', // For frontend
          prefill: {
            email: userEmail,
          },
        },
      });
    }

    // Verify payment after completion
    if (action === 'verify_payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body as {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      };

      if (!razorpay_order_id || !razorpay_payment_id) {
        return NextResponse.json(
          { success: false, error: 'Missing payment details' },
          { status: 400 }
        );
      }

      // Verify signature
      const isValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature || ''
      );

      if (!isValid && RAZORPAY_KEY_SECRET) {
        return NextResponse.json(
          { success: false, error: 'Invalid payment signature' },
          { status: 400 }
        );
      }

      // Update payment record
      const result = await client.query(`
        UPDATE payments 
        SET razorpay_payment_id = $1, razorpay_signature = $2, status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE razorpay_order_id = $3 AND user_email = $4
        RETURNING *
      `, [razorpay_payment_id, razorpay_signature, razorpay_order_id, userEmail]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Payment record not found' },
          { status: 404 }
        );
      }

      // Update order payment status if order_id exists
      const payment = result.rows[0];
      if (payment.order_id) {
        await client.query(`
          UPDATE orders SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
          WHERE (id::text = $1 OR order_number = $1) AND user_email = $2
        `, [payment.order_id, userEmail]);
      }

      // Also update any orders in user_json_data
      try {
        const jsonDataResult = await client.query(
          'SELECT data FROM user_json_data WHERE user_email = $1 AND data_type = $2',
          [userEmail, 'orders']
        );
        
        if (jsonDataResult.rows.length > 0) {
          let orders = jsonDataResult.rows[0].data;
          if (Array.isArray(orders)) {
            orders = orders.map((order: { id?: string; orderNumber?: string; paymentStatus?: string; status?: string }) => {
              if (order.id === payment.order_id || order.orderNumber === payment.order_id) {
                return { ...order, paymentStatus: 'paid', status: 'confirmed' };
              }
              return order;
            });
            
            await client.query(`
              UPDATE user_json_data SET data = $1, updated_at = CURRENT_TIMESTAMP
              WHERE user_email = $2 AND data_type = 'orders'
            `, [JSON.stringify(orders), userEmail]);
          }
        }
      } catch (e) {
        console.error('Error updating JSON orders:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          paymentId: payment.id,
          status: 'completed',
          amount: payment.amount,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment failed' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

// ============================================================================
// GET - Fetch Payment History
// ============================================================================

export async function GET(request: NextRequest) {
  const userEmail = getUserEmail(request);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  let client = null;

  try {
    const dbPool = await getPool();
    client = await dbPool.connect();
    await ensureTablesExist(client);

    let query = `SELECT * FROM payments WHERE user_email = $1`;
    const params: string[] = [userEmail];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await client.query(query, params);

    return NextResponse.json({
      success: true,
      data: result.rows.map((p: PaymentRecord) => ({
        id: p.id,
        orderId: p.order_id,
        razorpayOrderId: p.razorpay_order_id,
        razorpayPaymentId: p.razorpay_payment_id,
        amount: parseFloat(String(p.amount)),
        currency: p.currency,
        status: p.status,
        paymentMethod: p.payment_method,
        description: p.description,
        createdAt: p.created_at,
      })),
    });

  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}