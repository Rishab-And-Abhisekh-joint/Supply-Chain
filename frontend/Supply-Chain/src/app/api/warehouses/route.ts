// app/api/warehouses/route.ts
// Warehouses API - Fetches from MongoDB/PostgreSQL user data or uses demo data

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentUtilization: number;
  status: 'operational' | 'maintenance' | 'closed';
  manager?: string;
  phone?: string;
}

// ============================================================================
// DEMO DATA
// ============================================================================

const DEMO_WAREHOUSES: Warehouse[] = [
  {
    id: 'WH-001',
    name: 'Mumbai Central Hub',
    address: 'Plot 45, MIDC Industrial Area',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    latitude: 19.0760,
    longitude: 72.8777,
    capacity: 100000,
    currentUtilization: 72,
    status: 'operational',
    manager: 'Rahul Mehta',
    phone: '+91 98765 43210'
  },
  {
    id: 'WH-002',
    name: 'Delhi Distribution Center',
    address: 'Sector 62, Noida',
    city: 'Delhi NCR',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.7041,
    longitude: 77.1025,
    capacity: 85000,
    currentUtilization: 65,
    status: 'operational',
    manager: 'Priya Sharma',
    phone: '+91 98765 43211'
  },
  {
    id: 'WH-003',
    name: 'Chennai Port Warehouse',
    address: 'Chennai Port Trust Area',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    latitude: 13.0827,
    longitude: 80.2707,
    capacity: 120000,
    currentUtilization: 88,
    status: 'operational',
    manager: 'Karthik Rajan',
    phone: '+91 98765 43212'
  },
  {
    id: 'WH-004',
    name: 'Bangalore Tech Park DC',
    address: 'Electronic City Phase 1',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560100',
    latitude: 12.9716,
    longitude: 77.5946,
    capacity: 75000,
    currentUtilization: 55,
    status: 'operational',
    manager: 'Sneha Patil',
    phone: '+91 98765 43213'
  },
  {
    id: 'WH-005',
    name: 'Kolkata Regional Hub',
    address: 'Salt Lake Sector V',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700091',
    latitude: 22.5726,
    longitude: 88.3639,
    capacity: 60000,
    currentUtilization: 45,
    status: 'maintenance',
    manager: 'Amit Das',
    phone: '+91 98765 43214'
  },
  {
    id: 'WH-006',
    name: 'Pune Distribution Center',
    address: 'Hinjewadi IT Park',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411057',
    latitude: 18.5204,
    longitude: 73.8567,
    capacity: 70000,
    currentUtilization: 62,
    status: 'operational',
    manager: 'Vikram Joshi',
    phone: '+91 98765 43215'
  },
  {
    id: 'WH-007',
    name: 'Hyderabad Logistics Center',
    address: 'HITEC City',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    latitude: 17.3850,
    longitude: 78.4867,
    capacity: 90000,
    currentUtilization: 78,
    status: 'operational',
    manager: 'Venkat Reddy',
    phone: '+91 98765 43216'
  },
  {
    id: 'WH-008',
    name: 'Jaipur Central Warehouse',
    address: 'Sitapura Industrial Area',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302022',
    latitude: 26.9124,
    longitude: 75.7873,
    capacity: 50000,
    currentUtilization: 40,
    status: 'operational',
    manager: 'Rajesh Kumar',
    phone: '+91 98765 43217'
  }
];

// ============================================================================
// HELPERS
// ============================================================================

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

async function getUserWarehouses(userEmail: string): Promise<Warehouse[] | null> {
  // Try MongoDB first
  if (process.env.MONGODB_URI) {
    try {
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();

      const db = client.db('supply_chain');
      const collection = db.collection('user_data');
      const userData = await collection.findOne({ userEmail });

      await client.close();

      if (userData?.warehouses && Array.isArray(userData.warehouses) && userData.warehouses.length > 0) {
        return userData.warehouses.map((w: any, index: number) => ({
          id: w.id || `WH-${String(index + 1).padStart(3, '0')}`,
          name: w.name || 'Unnamed Warehouse',
          address: w.address || '',
          city: w.city || '',
          state: w.state || '',
          pincode: w.pincode || '',
          latitude: parseFloat(w.latitude) || 0,
          longitude: parseFloat(w.longitude) || 0,
          capacity: parseInt(w.capacity) || 50000,
          currentUtilization: parseInt(w.currentUtilization) || Math.floor(Math.random() * 50 + 30),
          status: w.status || 'operational',
          manager: w.manager || '',
          phone: w.phone || ''
        }));
      }
    } catch (error) {
      console.error('MongoDB error:', error);
    }
  }

  // Try PostgreSQL
  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });

      const result = await pool.query(
        'SELECT data FROM user_json_data WHERE user_email = $1 AND data_type = $2',
        [userEmail, 'warehouses']
      );

      await pool.end();

      if (result.rows.length > 0 && Array.isArray(result.rows[0].data) && result.rows[0].data.length > 0) {
        return result.rows[0].data;
      }
    } catch (error) {
      console.error('PostgreSQL error:', error);
    }
  }

  return null;
}

// ============================================================================
// GET - Fetch warehouses
// ============================================================================

export async function GET(request: NextRequest) {
  const userEmail = getUserEmail(request);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const forSelection = searchParams.get('forSelection') === 'true'; // For dropdowns

  // Try to get user's custom warehouses
  const userWarehouses = await getUserWarehouses(userEmail);

  let warehouses = userWarehouses || DEMO_WAREHOUSES;

  // Filter by status if provided
  if (status && status !== 'all') {
    warehouses = warehouses.filter(w => w.status === status);
  }

  // For selection dropdowns, return simplified data
  if (forSelection) {
    return NextResponse.json({
      success: true,
      data: warehouses.map(w => ({
        id: w.id,
        name: w.name,
        city: w.city,
        state: w.state,
        latitude: w.latitude,
        longitude: w.longitude,
        status: w.status
      })),
      source: userWarehouses ? 'user_data' : 'demo'
    });
  }

  return NextResponse.json({
    success: true,
    data: warehouses,
    source: userWarehouses ? 'user_data' : 'demo'
  });
}

// ============================================================================
// POST - Add warehouse
// ============================================================================

export async function POST(request: NextRequest) {
  const userEmail = getUserEmail(request);

  let body: Partial<Warehouse>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request body' 
    }, { status: 400 });
  }

  if (!body.name || !body.city || !body.state) {
    return NextResponse.json({
      success: false,
      error: 'Name, city, and state are required'
    }, { status: 400 });
  }

  const newWarehouse: Warehouse = {
    id: body.id || `WH-${Date.now().toString(36).toUpperCase()}`,
    name: body.name,
    address: body.address || '',
    city: body.city,
    state: body.state,
    pincode: body.pincode || '',
    latitude: body.latitude || 0,
    longitude: body.longitude || 0,
    capacity: body.capacity || 50000,
    currentUtilization: body.currentUtilization || 0,
    status: body.status || 'operational',
    manager: body.manager || '',
    phone: body.phone || ''
  };

  // Get existing warehouses
  const existingWarehouses = await getUserWarehouses(userEmail) || [];
  const updatedWarehouses = [...existingWarehouses, newWarehouse];

  // Save to database
  if (process.env.MONGODB_URI) {
    try {
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();

      const db = client.db('supply_chain');
      const collection = db.collection('user_data');

      await collection.updateOne(
        { userEmail },
        {
          $set: { warehouses: updatedWarehouses, updatedAt: new Date() },
          $setOnInsert: { userEmail, createdAt: new Date() }
        },
        { upsert: true }
      );

      await client.close();
    } catch (error) {
      console.error('MongoDB error:', error);
    }
  } else if (process.env.DATABASE_URL) {
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });

      await pool.query(`
        INSERT INTO user_json_data (user_email, data_type, data)
        VALUES ($1, 'warehouses', $2)
        ON CONFLICT (user_email, data_type)
        DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP
      `, [userEmail, JSON.stringify(updatedWarehouses)]);

      await pool.end();
    } catch (error) {
      console.error('PostgreSQL error:', error);
    }
  }

  return NextResponse.json({
    success: true,
    data: newWarehouse
  }, { status: 201 });
}

// ============================================================================
// PUT - Update warehouse
// ============================================================================

export async function PUT(request: NextRequest) {
  const userEmail = getUserEmail(request);
  const { searchParams } = new URL(request.url);
  const warehouseId = searchParams.get('id');

  if (!warehouseId) {
    return NextResponse.json({
      success: false,
      error: 'Warehouse ID required'
    }, { status: 400 });
  }

  let body: Partial<Warehouse>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request body' 
    }, { status: 400 });
  }

  // Get existing warehouses
  const existingWarehouses = await getUserWarehouses(userEmail) || DEMO_WAREHOUSES;
  const warehouseIndex = existingWarehouses.findIndex(w => w.id === warehouseId);

  if (warehouseIndex === -1) {
    return NextResponse.json({
      success: false,
      error: 'Warehouse not found'
    }, { status: 404 });
  }

  const updatedWarehouse = { ...existingWarehouses[warehouseIndex], ...body };
  const updatedWarehouses = [...existingWarehouses];
  updatedWarehouses[warehouseIndex] = updatedWarehouse;

  // Save to database (same logic as POST)
  if (process.env.MONGODB_URI) {
    try {
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();

      const db = client.db('supply_chain');
      await db.collection('user_data').updateOne(
        { userEmail },
        { $set: { warehouses: updatedWarehouses, updatedAt: new Date() } }
      );

      await client.close();
    } catch (error) {
      console.error('MongoDB error:', error);
    }
  }

  return NextResponse.json({
    success: true,
    data: updatedWarehouse
  });
}

// ============================================================================
// DELETE - Delete warehouse
// ============================================================================

export async function DELETE(request: NextRequest) {
  const userEmail = getUserEmail(request);
  const { searchParams } = new URL(request.url);
  const warehouseId = searchParams.get('id');

  if (!warehouseId) {
    return NextResponse.json({
      success: false,
      error: 'Warehouse ID required'
    }, { status: 400 });
  }

  // Get existing warehouses
  const existingWarehouses = await getUserWarehouses(userEmail) || [];
  const updatedWarehouses = existingWarehouses.filter(w => w.id !== warehouseId);

  // Save to database
  if (process.env.MONGODB_URI) {
    try {
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();

      const db = client.db('supply_chain');
      await db.collection('user_data').updateOne(
        { userEmail },
        { $set: { warehouses: updatedWarehouses, updatedAt: new Date() } }
      );

      await client.close();
    } catch (error) {
      console.error('MongoDB error:', error);
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Warehouse deleted'
  });
}