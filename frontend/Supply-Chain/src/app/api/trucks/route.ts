// app/api/trucks/route.ts
// Trucks API with proper error handling and fallback data

import { NextRequest, NextResponse } from 'next/server';

const DEMO_TRUCKS = [
  { id: 'TRK-001', vehicleNumber: 'MH-01-AB-1234', driverName: 'Rajesh Kumar', vehicleType: 'Heavy Truck', capacityKg: 15000, status: 'available', currentLocation: null },
  { id: 'TRK-002', vehicleNumber: 'DL-02-CD-5678', driverName: 'Amit Singh', vehicleType: 'Medium Truck', capacityKg: 8000, status: 'available', currentLocation: null },
  { id: 'TRK-003', vehicleNumber: 'KA-03-EF-9012', driverName: 'Suresh Patel', vehicleType: 'Heavy Truck', capacityKg: 15000, status: 'available', currentLocation: null },
  { id: 'TRK-004', vehicleNumber: 'TN-04-GH-3456', driverName: 'Vikram Rao', vehicleType: 'Delivery Van', capacityKg: 3000, status: 'available', currentLocation: null },
  { id: 'TRK-005', vehicleNumber: 'WB-05-IJ-7890', driverName: 'Manoj Verma', vehicleType: 'Heavy Truck', capacityKg: 15000, status: 'in_use', currentLocation: null },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  if (!process.env.DATABASE_URL) {
    let filtered = DEMO_TRUCKS;
    if (status) filtered = filtered.filter(t => t.status === status);
    return NextResponse.json({ success: true, data: filtered, source: 'demo' });
  }

  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    let queryText = `SELECT * FROM trucks`;
    const params: unknown[] = [];
    if (status) {
      queryText += ` WHERE status = $1`;
      params.push(status);
    }
    queryText += ` ORDER BY id`;

    const result = await pool.query(queryText, params);
    await pool.end();

    const trucks = result.rows.map((t: Record<string, unknown>) => ({
      id: t.id,
      vehicleNumber: t.vehicle_number,
      driverName: t.driver_name,
      vehicleType: t.vehicle_type,
      capacityKg: t.capacity_kg || 10000,
      status: t.status || 'available',
      currentLocation: t.current_lat ? { lat: parseFloat(String(t.current_lat)), lng: parseFloat(String(t.current_lng)) } : null
    }));

    return NextResponse.json({ success: true, data: trucks });

  } catch (error) {
    console.error('Database error:', error);
    let filtered = DEMO_TRUCKS;
    if (status) filtered = filtered.filter(t => t.status === status);
    return NextResponse.json({ success: true, data: filtered, source: 'demo' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.vehicleNumber || !body.driverName || !body.vehicleType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = body.id || `TRK-${Date.now().toString().slice(-6)}`;

    if (!process.env.DATABASE_URL) {
      const newTruck = {
        id,
        vehicleNumber: body.vehicleNumber,
        driverName: body.driverName,
        vehicleType: body.vehicleType,
        capacityKg: body.capacityKg || 10000,
        status: body.status || 'available',
        currentLocation: null,
      };
      return NextResponse.json({ success: true, data: newTruck, source: 'demo' }, { status: 201 });
    }

    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const result = await pool.query(`
      INSERT INTO trucks (id, vehicle_number, driver_name, vehicle_type, capacity_kg, status)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [id, body.vehicleNumber, body.driverName, body.vehicleType, body.capacityKg || 10000, body.status || 'available']);

    await pool.end();
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error:', error);
    const pgError = error as { code?: string };
    if (pgError.code === '23505') {
      return NextResponse.json({ error: 'Truck already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to add truck' }, { status: 500 });
  }
}
