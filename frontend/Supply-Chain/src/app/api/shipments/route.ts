// app/api/shipments/route.ts
// Shipments API - STANDALONE

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

const AVAILABLE_TRUCKS = [
  { id: 'TRK-001', vehicleNumber: 'MH-01-AB-1234', driverName: 'Rajesh Kumar', vehicleType: 'Heavy Truck' },
  { id: 'TRK-002', vehicleNumber: 'DL-02-CD-5678', driverName: 'Amit Singh', vehicleType: 'Medium Truck' },
  { id: 'TRK-003', vehicleNumber: 'KA-03-EF-9012', driverName: 'Suresh Patel', vehicleType: 'Heavy Truck' },
  { id: 'TRK-004', vehicleNumber: 'TN-04-GH-3456', driverName: 'Vikram Rao', vehicleType: 'Delivery Van' },
  { id: 'TRK-005', vehicleNumber: 'WB-05-IJ-7890', driverName: 'Manoj Verma', vehicleType: 'Heavy Truck' },
];

export async function GET(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const activeOnly = searchParams.get('active') === 'true';

    let queryText = `
      SELECT * FROM shipments WHERE user_email = $1
    `;
    const params: unknown[] = [userEmail];
    let paramIndex = 2;

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (activeOnly) {
      queryText += ` AND status != 'delivered'`;
    }

    queryText += ` ORDER BY created_at DESC`;

    const shipments = await query(queryText, params);

    const transformedShipments = shipments.map((s: Record<string, unknown>) => ({
      id: s.id,
      orderId: s.order_id,
      orderNumber: s.order_number,
      vehicleId: s.vehicle_id,
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
      distance: s.distance,
      savings: s.savings,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    }));

    return NextResponse.json({ success: true, data: transformedShipments });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const body = await request.json();

    if (!body.orderId || !body.orderNumber || !body.origin || !body.destination) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const truck = AVAILABLE_TRUCKS[Math.floor(Math.random() * AVAILABLE_TRUCKS.length)];

    const result = await queryOne<Record<string, unknown>>(`
      INSERT INTO shipments (
        order_id, order_number, user_email, vehicle_id, vehicle_number,
        driver_name, vehicle_type, status, origin_name, origin_lat, origin_lng,
        destination_name, destination_lat, destination_lng,
        current_lat, current_lng, route_data, eta, progress, distance, savings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `, [
      body.orderId, body.orderNumber, userEmail,
      body.vehicleId || truck.id,
      body.vehicleNumber || truck.vehicleNumber,
      body.driverName || truck.driverName,
      body.vehicleType || truck.vehicleType,
      body.status || 'picking_up',
      body.origin.name, body.origin.lat, body.origin.lng,
      body.destination.name, body.destination.lat, body.destination.lng,
      body.origin.lat, body.origin.lng,
      body.route ? JSON.stringify(body.route) : null,
      body.eta || body.route?.time || '4-6 hours',
      body.progress || 0,
      body.route?.distance || null,
      body.route?.savings || null
    ]);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 });
  }
}
