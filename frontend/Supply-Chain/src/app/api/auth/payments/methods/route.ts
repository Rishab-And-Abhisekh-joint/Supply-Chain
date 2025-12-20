// ============================================================================
// PAYMENT METHODS API - /api/payments/methods/route.ts
// Manages saved payment methods and bank accounts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface PaymentMethodRecord {
  id: string;
  method_type: string;
  is_default: boolean;
  card_last_four: string | null;
  card_brand: string | null;
  card_expiry: string | null;
  card_holder_name: string | null;
  upi_id: string | null;
  bank_name: string | null;
  account_holder: string | null;
  nickname: string | null;
  created_at: string;
}

interface BankAccountRecord {
  id: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch_name: string | null;
  account_type: string;
  is_verified: boolean;
  is_primary: boolean;
  created_at: string;
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
      card_holder_name VARCHAR(255),
      upi_id VARCHAR(255),
      bank_name VARCHAR(255),
      account_holder VARCHAR(255),
      nickname VARCHAR(100),
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
      confirm_account_number VARCHAR(50),
      ifsc_code VARCHAR(20) NOT NULL,
      bank_name VARCHAR(255) NOT NULL,
      branch_name VARCHAR(255),
      account_type VARCHAR(50) DEFAULT 'savings',
      is_verified BOOLEAN DEFAULT false,
      is_primary BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods (user_email)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts (user_email)`);
}

// ============================================================================
// GET - Fetch Payment Methods & Bank Account
// ============================================================================

export async function GET(request: NextRequest) {
  const userEmail = getUserEmail(request);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'methods' or 'bank' or 'all'
  
  let client = null;

  try {
    const dbPool = await getPool();
    client = await dbPool.connect();
    await ensureTablesExist(client);

    const response: { 
      success: boolean; 
      paymentMethods?: Array<{
        id: string;
        methodType: string;
        isDefault: boolean;
        cardLastFour: string | null;
        cardBrand: string | null;
        cardExpiry: string | null;
        cardHolderName: string | null;
        upiId: string | null;
        bankName: string | null;
        accountHolder: string | null;
        nickname: string | null;
        createdAt: string;
      }>;
      bankAccount?: {
        id: string;
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        branchName: string | null;
        accountType: string;
        isVerified: boolean;
        isPrimary: boolean;
        createdAt: string;
      } | null;
    } = { success: true };

    // Get payment methods
    if (!type || type === 'methods' || type === 'all') {
      const methodsResult = await client.query(
        `SELECT * FROM payment_methods WHERE user_email = $1 ORDER BY is_default DESC, created_at DESC`,
        [userEmail]
      );

      response.paymentMethods = methodsResult.rows.map((m: PaymentMethodRecord) => ({
        id: m.id,
        methodType: m.method_type,
        isDefault: m.is_default,
        cardLastFour: m.card_last_four,
        cardBrand: m.card_brand,
        cardExpiry: m.card_expiry,
        cardHolderName: m.card_holder_name,
        upiId: m.upi_id,
        bankName: m.bank_name,
        accountHolder: m.account_holder,
        nickname: m.nickname,
        createdAt: m.created_at,
      }));
    }

    // Get bank account for receiving payments
    if (!type || type === 'bank' || type === 'all') {
      const bankResult = await client.query(
        `SELECT * FROM bank_accounts WHERE user_email = $1`,
        [userEmail]
      );

      if (bankResult.rows.length > 0) {
        const b: BankAccountRecord = bankResult.rows[0];
        response.bankAccount = {
          id: b.id,
          accountHolderName: b.account_holder_name,
          accountNumber: b.account_number,
          ifscCode: b.ifsc_code,
          bankName: b.bank_name,
          branchName: b.branch_name,
          accountType: b.account_type,
          isVerified: b.is_verified,
          isPrimary: b.is_primary,
          createdAt: b.created_at,
        };
      } else {
        response.bankAccount = null;
      }
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

// ============================================================================
// POST - Add Payment Method or Bank Account
// ============================================================================

export async function POST(request: NextRequest) {
  const userEmail = getUserEmail(request);
  let client = null;

  try {
    const body = await request.json();
    const { type } = body;

    const dbPool = await getPool();
    client = await dbPool.connect();
    await ensureTablesExist(client);

    // Add payment method
    if (type === 'payment_method') {
      const { 
        methodType, 
        cardLastFour, 
        cardBrand, 
        cardExpiry, 
        cardHolderName,
        upiId, 
        bankName, 
        accountHolder,
        nickname,
        isDefault 
      } = body;

      if (!methodType) {
        return NextResponse.json(
          { success: false, error: 'Method type is required' },
          { status: 400 }
        );
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await client.query(
          `UPDATE payment_methods SET is_default = false WHERE user_email = $1`,
          [userEmail]
        );
      }

      const result = await client.query(`
        INSERT INTO payment_methods (
          user_email, method_type, card_last_four, card_brand, card_expiry, 
          card_holder_name, upi_id, bank_name, account_holder, nickname, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        userEmail,
        methodType,
        cardLastFour || null,
        cardBrand || null,
        cardExpiry || null,
        cardHolderName || null,
        upiId || null,
        bankName || null,
        accountHolder || null,
        nickname || null,
        isDefault || false,
      ]);

      return NextResponse.json({
        success: true,
        message: 'Payment method added successfully',
        data: {
          id: result.rows[0].id,
          methodType: result.rows[0].method_type,
          isDefault: result.rows[0].is_default,
        },
      }, { status: 201 });
    }

    // Add/Update bank account for receiving payments
    if (type === 'bank_account') {
      const {
        accountHolderName,
        accountNumber,
        confirmAccountNumber,
        ifscCode,
        bankName,
        branchName,
        accountType,
      } = body;

      // Validation
      if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
        return NextResponse.json(
          { success: false, error: 'Account holder name, account number, IFSC code, and bank name are required' },
          { status: 400 }
        );
      }

      if (confirmAccountNumber && accountNumber !== confirmAccountNumber) {
        return NextResponse.json(
          { success: false, error: 'Account numbers do not match' },
          { status: 400 }
        );
      }

      // Validate IFSC format (11 characters: 4 letters + 0 + 6 alphanumeric)
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
        return NextResponse.json(
          { success: false, error: 'Invalid IFSC code format' },
          { status: 400 }
        );
      }

      // Upsert bank account
      const result = await client.query(`
        INSERT INTO bank_accounts (
          user_email, account_holder_name, account_number, confirm_account_number,
          ifsc_code, bank_name, branch_name, account_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_email) 
        DO UPDATE SET 
          account_holder_name = $2,
          account_number = $3,
          confirm_account_number = $4,
          ifsc_code = $5,
          bank_name = $6,
          branch_name = $7,
          account_type = $8,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        userEmail,
        accountHolderName,
        accountNumber,
        confirmAccountNumber || accountNumber,
        ifscCode.toUpperCase(),
        bankName,
        branchName || null,
        accountType || 'savings',
      ]);

      return NextResponse.json({
        success: true,
        message: 'Bank account saved successfully',
        data: {
          id: result.rows[0].id,
          accountHolderName: result.rows[0].account_holder_name,
          accountNumber: result.rows[0].account_number,
          ifscCode: result.rows[0].ifsc_code,
          bankName: result.rows[0].bank_name,
        },
      }, { status: 201 });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type. Use "payment_method" or "bank_account"' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error adding payment method:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add payment method' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

// ============================================================================
// PUT - Update Payment Method or Bank Account
// ============================================================================

export async function PUT(request: NextRequest) {
  const userEmail = getUserEmail(request);
  let client = null;

  try {
    const body = await request.json();
    const { id, type } = body;

    const dbPool = await getPool();
    client = await dbPool.connect();

    // Set payment method as default
    if (type === 'set_default' && id) {
      await client.query(
        `UPDATE payment_methods SET is_default = false WHERE user_email = $1`,
        [userEmail]
      );

      await client.query(
        `UPDATE payment_methods SET is_default = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_email = $2`,
        [id, userEmail]
      );

      return NextResponse.json({
        success: true,
        message: 'Default payment method updated',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid update operation' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment method' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

// ============================================================================
// DELETE - Remove Payment Method
// ============================================================================

export async function DELETE(request: NextRequest) {
  const userEmail = getUserEmail(request);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type'); // 'method' or 'bank'
  
  let client = null;

  try {
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const dbPool = await getPool();
    client = await dbPool.connect();

    if (type === 'bank') {
      await client.query(
        `DELETE FROM bank_accounts WHERE id = $1 AND user_email = $2`,
        [id, userEmail]
      );
    } else {
      await client.query(
        `DELETE FROM payment_methods WHERE id = $1 AND user_email = $2`,
        [id, userEmail]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}