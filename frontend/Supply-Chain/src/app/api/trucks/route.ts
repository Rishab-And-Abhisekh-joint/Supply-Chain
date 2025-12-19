// app/api/trucks/route.ts
// Trucks API - STANDALONE

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

const DEFAULT_TRUCKS = [
  { id: 'TRK-001', vehicleNumber: 'MH-01-AB-1234', driverName: 'Rajesh Kumar', vehicleType: 'Heavy Truck', capacityKg: 15000, status: 'available' },
  { id: 'TRK-002', vehicleNumber: 'DL-02-CD-5678', driverName: 'Amit Singh', vehicleType: 'Medium Truck', capacityKg: 8000, status: 'available' },
  { id: 'TRK-003', vehicleNumber: 'KA-03-EF-9012', driverName: 'Suresh Patel', vehicleType: 'Heavy Truck', capacityKg: 15000, status: 'available' },
  { id: 'TRK-004', vehicleNumber: 'TN-04-GH-3456', driverName: 'Vikram Rao', vehicleType: 'Delivery Van', capacityKg: 3000, status: 'available' },
  { id: 'TRK-005', vehicleNumber: 'WB-05-IJ-7890', driverName: 'Manoj Verma', vehicleType: 'Heavy Truck', capacityKg: 15000, status: 'available' },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    try {
      let queryText = `SELECT * FROM trucks`;
      const params: unknown[] = [];
      if (status) {
        queryText += ` WHERE status = $1`;
        params.push(status);
      }
      queryText += ` ORDER BY id`;

      const trucks = await query(queryText, params);

      const transformedTrucks = trucks.map((t: Record<string, unknown>) => ({
        id: t.id,
        vehicleNumber: t.vehicle_number,
        driverName: t.driver_name,
        vehicleType: t.vehicle_type,
        capacityKg: t.capacity_kg,
        status: t.status,
        currentLocation: t.current_lat ? { lat: parseFloat(String(t.current_lat)), lng: parseFloat(String(t.current_lng)) } : null
      }));

      return NextResponse.json({ success: true, data: transformedTrucks });
    } catch (dbError: unknown) {
      const pgError = dbError as { code?: string };
      if (pgError.code === '42P01') {
        // Table doesn't exist, return defaults
        const filteredTrucks = status ? DEFAULT_TRUCKS.filter(t => t.status === status) : DEFAULT_TRUCKS;
        return NextResponse.json({ success: true, data: filteredTrucks, source: 'default' });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch trucks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.vehicleNumber || !body.driverName || !body.vehicleType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO trucks (id, vehicle_number, driver_name, vehicle_type, capacity_kg, status)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [
      body.id || `TRK-${Date.now().toString().slice(-6)}`,
      body.vehicleNumber, body.driverName, body.vehicleType,
      body.capacityKg || 10000, body.status || 'available'
    ]);

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error:', error);
    const pgError = error as { code?: string };
    if (pgError.code === '23505') {
      return NextResponse.json({ error: 'Truck already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to add truck' }, { status: 500 });
  }
}
