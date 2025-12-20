// app/api/data/route.ts
// Unified Data API - Stores JSON data in MongoDB, links to user in PostgreSQL

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface DataCollection {
  inventory?: unknown[];
  warehouses?: unknown[];
  orders?: unknown[];
  vehicles?: unknown[];
  team?: unknown[];
  deliveries?: unknown[];
  notifications?: unknown[];
}

interface UserDataRecord {
  userEmail: string;
  mongoCollectionId: string;
  dataTypes: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// HELPERS
// ============================================================================

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

// ============================================================================
// GET - Fetch user data from MongoDB
// ============================================================================

export async function GET(request: NextRequest) {
  const userEmail = getUserEmail(request);
  const { searchParams } = new URL(request.url);
  const dataType = searchParams.get('type'); // inventory, warehouses, orders, etc.

  // Check MongoDB connection
  if (!process.env.MONGODB_URI) {
    // Fallback to PostgreSQL JSONB storage
    return await getFromPostgres(userEmail, dataType);
  }

  let mongoClient = null;

  try {
    const { MongoClient } = await import('mongodb');
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();

    const db = mongoClient.db('supply_chain');
    const collection = db.collection('user_data');

    // Find user's data
    const userData = await collection.findOne({ userEmail });

    if (!userData) {
      await mongoClient.close();
      return NextResponse.json({
        success: true,
        data: dataType ? [] : {},
        source: 'mongodb',
        message: 'No data found for user'
      });
    }

    await mongoClient.close();

    if (dataType) {
      return NextResponse.json({
        success: true,
        data: userData[dataType] || [],
        source: 'mongodb'
      });
    }

    // Return all data types
    const { _id, userEmail: email, createdAt, updatedAt, ...dataCollections } = userData;
    return NextResponse.json({
      success: true,
      data: dataCollections,
      source: 'mongodb'
    });

  } catch (error: unknown) {
    if (mongoClient) {
      try { await mongoClient.close(); } catch { /* ignore */ }
    }

    console.error('MongoDB error, falling back to PostgreSQL:', error);
    return await getFromPostgres(userEmail, dataType);
  }
}

// ============================================================================
// POST - Store data in MongoDB
// ============================================================================

export async function POST(request: NextRequest) {
  const userEmail = getUserEmail(request);

  let body: { type: string; data: unknown[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request body' 
    }, { status: 400 });
  }

  const { type, data } = body;

  if (!type || !data || !Array.isArray(data)) {
    return NextResponse.json({
      success: false,
      error: 'Missing type or data array'
    }, { status: 400 });
  }

  const validTypes = ['inventory', 'warehouses', 'orders', 'vehicles', 'team', 'deliveries', 'notifications'];
  if (!validTypes.includes(type)) {
    return NextResponse.json({
      success: false,
      error: `Invalid data type. Must be one of: ${validTypes.join(', ')}`
    }, { status: 400 });
  }

  // Try MongoDB first
  if (!process.env.MONGODB_URI) {
    return await saveToPostgres(userEmail, type, data);
  }

  let mongoClient = null;

  try {
    const { MongoClient } = await import('mongodb');
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();

    const db = mongoClient.db('supply_chain');
    const collection = db.collection('user_data');

    // Upsert user's data
    const updateResult = await collection.updateOne(
      { userEmail },
      {
        $set: {
          [type]: data,
          updatedAt: new Date()
        },
        $setOnInsert: {
          userEmail,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    // Also update PostgreSQL link
    await updatePostgresLink(userEmail, type);

    await mongoClient.close();

    return NextResponse.json({
      success: true,
      message: `Successfully stored ${data.length} ${type} records`,
      recordCount: data.length,
      source: 'mongodb'
    });

  } catch (error: unknown) {
    if (mongoClient) {
      try { await mongoClient.close(); } catch { /* ignore */ }
    }

    console.error('MongoDB error, falling back to PostgreSQL:', error);
    return await saveToPostgres(userEmail, type, data);
  }
}

// ============================================================================
// PUT - Update specific records
// ============================================================================

export async function PUT(request: NextRequest) {
  const userEmail = getUserEmail(request);

  let body: { type: string; data: unknown[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request body' 
    }, { status: 400 });
  }

  // Same as POST for now - replaces entire collection
  return POST(request);
}

// ============================================================================
// DELETE - Delete user data
// ============================================================================

export async function DELETE(request: NextRequest) {
  const userEmail = getUserEmail(request);
  const { searchParams } = new URL(request.url);
  const dataType = searchParams.get('type');

  if (!process.env.MONGODB_URI) {
    return await deleteFromPostgres(userEmail, dataType);
  }

  let mongoClient = null;

  try {
    const { MongoClient } = await import('mongodb');
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();

    const db = mongoClient.db('supply_chain');
    const collection = db.collection('user_data');

    if (dataType) {
      // Delete specific data type
      await collection.updateOne(
        { userEmail },
        { $unset: { [dataType]: '' }, $set: { updatedAt: new Date() } }
      );
    } else {
      // Delete all user data
      await collection.deleteOne({ userEmail });
    }

    await mongoClient.close();

    return NextResponse.json({
      success: true,
      message: dataType ? `Deleted ${dataType} data` : 'Deleted all user data'
    });

  } catch (error: unknown) {
    if (mongoClient) {
      try { await mongoClient.close(); } catch { /* ignore */ }
    }

    console.error('MongoDB error, falling back to PostgreSQL:', error);
    return await deleteFromPostgres(userEmail, dataType);
  }
}

// ============================================================================
// POSTGRES FALLBACK FUNCTIONS
// ============================================================================

async function getFromPostgres(userEmail: string, dataType: string | null) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: true,
      data: dataType ? [] : {},
      source: 'none',
      message: 'No database configured'
    });
  }

  let pool = null;

  try {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_json_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(255) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email, data_type)
      )
    `);

    if (dataType) {
      const result = await pool.query(
        'SELECT data FROM user_json_data WHERE user_email = $1 AND data_type = $2',
        [userEmail, dataType]
      );
      await pool.end();

      return NextResponse.json({
        success: true,
        data: result.rows.length > 0 ? result.rows[0].data : [],
        source: 'postgresql'
      });
    }

    // Get all data types
    const result = await pool.query(
      'SELECT data_type, data FROM user_json_data WHERE user_email = $1',
      [userEmail]
    );
    await pool.end();

    const allData: Record<string, unknown[]> = {};
    result.rows.forEach((row: { data_type: string; data: unknown[] }) => {
      allData[row.data_type] = row.data;
    });

    return NextResponse.json({
      success: true,
      data: allData,
      source: 'postgresql'
    });

  } catch (error: unknown) {
    if (pool) {
      try { await pool.end(); } catch { /* ignore */ }
    }

    const pgError = error as { message?: string };
    return NextResponse.json({
      success: false,
      error: pgError.message,
      data: dataType ? [] : {}
    }, { status: 500 });
  }
}

async function saveToPostgres(userEmail: string, dataType: string, data: unknown[]) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: false,
      error: 'No database configured'
    }, { status: 500 });
  }

  let pool = null;

  try {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_json_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(255) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email, data_type)
      )
    `);

    // Upsert data
    await pool.query(`
      INSERT INTO user_json_data (user_email, data_type, data)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_email, data_type)
      DO UPDATE SET data = $3, updated_at = CURRENT_TIMESTAMP
    `, [userEmail, dataType, JSON.stringify(data)]);

    await pool.end();

    return NextResponse.json({
      success: true,
      message: `Successfully stored ${data.length} ${dataType} records`,
      recordCount: data.length,
      source: 'postgresql'
    });

  } catch (error: unknown) {
    if (pool) {
      try { await pool.end(); } catch { /* ignore */ }
    }

    const pgError = error as { message?: string };
    return NextResponse.json({
      success: false,
      error: pgError.message
    }, { status: 500 });
  }
}

async function deleteFromPostgres(userEmail: string, dataType: string | null) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: true,
      message: 'No database configured'
    });
  }

  let pool = null;

  try {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    if (dataType) {
      await pool.query(
        'DELETE FROM user_json_data WHERE user_email = $1 AND data_type = $2',
        [userEmail, dataType]
      );
    } else {
      await pool.query(
        'DELETE FROM user_json_data WHERE user_email = $1',
        [userEmail]
      );
    }

    await pool.end();

    return NextResponse.json({
      success: true,
      message: dataType ? `Deleted ${dataType} data` : 'Deleted all user data'
    });

  } catch (error: unknown) {
    if (pool) {
      try { await pool.end(); } catch { /* ignore */ }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to delete data'
    }, { status: 500 });
  }
}

async function updatePostgresLink(userEmail: string, dataType: string) {
  if (!process.env.DATABASE_URL) return;

  let pool = null;

  try {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    // Create link table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_mongodb_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(255) UNIQUE NOT NULL,
        data_types TEXT[] DEFAULT '{}',
        mongodb_database VARCHAR(100) DEFAULT 'supply_chain',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Upsert link
    await pool.query(`
      INSERT INTO user_mongodb_links (user_email, data_types)
      VALUES ($1, ARRAY[$2])
      ON CONFLICT (user_email)
      DO UPDATE SET 
        data_types = CASE 
          WHEN $2 = ANY(user_mongodb_links.data_types) THEN user_mongodb_links.data_types
          ELSE array_append(user_mongodb_links.data_types, $2)
        END,
        updated_at = CURRENT_TIMESTAMP
    `, [userEmail, dataType]);

    await pool.end();

  } catch (error) {
    if (pool) {
      try { await pool.end(); } catch { /* ignore */ }
    }
    console.error('Failed to update PostgreSQL link:', error);
  }
}