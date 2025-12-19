// app/api/shipments/route.ts
// Shipments API with proper error handling and fallback data

import { NextRequest, NextResponse } from 'next/server';

// Demo shipments fallback
const DEMO_SHIPMENTS = [
  {
    id: 'ship-demo-1',
    orderId: 'demo-1',
    orderNumber: 'ORD-DEMO01',
    vehicleId: 'TRK-001',
    vehicleNumber: 'MH-01-AB-1234',
    driverName: 'Rajesh Kumar',
    vehicleType: 'Heavy Truck',
    status: 'in_transit',
    origin: { name: 'Mumbai Warehouse', lat: 19.0760, lng: 72.8777 },
    destination: { name: 'Delhi Hub', lat: 28.7041, lng: 77.1025 },
    currentLocation: { lat: 23.2599, lng: 77.4126 },
    route: {
      id: 1,
      from: 'Mumbai Warehouse',
      to: 'Delhi Hub',
      distance: '1400 km',
      time: '24 hours',
      savings: '15%',
      fuelCost: 15000,
      coordinates: [
        { lat: 19.0760, lng: 72.8777 },
        { lat: 21.1702, lng: 72.8311 },
        { lat: 23.2599, lng: 77.4126 },
        { lat: 26.9124, lng: 75.7873 },
        { lat: 28.7041, lng: 77.1025 }
      ]
    },
    eta: '18 hours',
    progress: 45,
    distance: '1400 km',
    savings: '15%',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ship-demo-2',
    orderId: 'demo-2',
    orderNumber: 'ORD-DEMO02',
    vehicleId: 'TRK-002',
    vehicleNumber: 'DL-02-CD-5678',
    driverName: 'Amit Singh',
    vehicleType: 'Medium Truck',
    status: 'picking_up',
    origin: { name: 'Delhi Hub', lat: 28.7041, lng: 77.1025 },
    destination: { name: 'Jaipur Center', lat: 26.9124, lng: 75.7873 },
    currentLocation: { lat: 28.7041, lng: 77.1025 },
    route: {
      id: 2,
      from: 'Delhi Hub',
      to: 'Jaipur Center',
      distance: '280 km',
      time: '5 hours',
      savings: '12%',
      fuelCost: 3500,
      coordinates: [
        { lat: 28.7041, lng: 77.1025 },
        { lat: 27.8974, lng: 76.5048 },
        { lat: 26.9124, lng: 75.7873 }
      ]
    },
    eta: '5 hours',
    progress: 10,
    distance: '280 km',
    savings: '12%',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

export async function GET(request: NextRequest) {
  const userEmail = getUserEmail(request);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const activeOnly = searchParams.get('active') === 'true';

  if (!process.env.DATABASE_URL) {
    let filtered = DEMO_SHIPMENTS;
    if (status) filtered = filtered.filter(s => s.status === status);
    if (activeOnly) filtered = filtered.filter(s => s.status !== 'delivered');
    return NextResponse.json({ success: true, data: filtered, source: 'demo' });
  }

  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    let queryText = `SELECT * FROM shipments WHERE user_email = $1`;
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

    const result = await pool.query(queryText, params);
    await pool.end();

    const shipments = result.rows.map((s: Record<string, unknown>) => ({
      id: s.id,
      orderId: s.order_id,
      orderNumber: s.order_number,
      vehicleId: s.vehicle_id,
      vehicleNumber: s.vehicle_number,
      driverName: s.driver_name,
      vehicleType: s.vehicle_type,
      status: s.status || 'picking_up',
      origin: { 
        name: s.origin_name || 'Origin', 
        lat: parseFloat(String(s.origin_lat || 0)), 
        lng: parseFloat(String(s.origin_lng || 0)) 
      },
      destination: { 
        name: s.destination_name || 'Destination', 
        lat: parseFloat(String(s.destination_lat || 0)), 
        lng: parseFloat(String(s.destination_lng || 0)) 
      },
      currentLocation: { 
        lat: parseFloat(String(s.current_lat || 0)), 
        lng: parseFloat(String(s.current_lng || 0)) 
      },
      route: s.route_data,
      eta: s.eta || 'Calculating...',
      progress: s.progress || 0,
      distance: s.distance || '',
      savings: s.savings || '',
      createdAt: s.created_at || new Date().toISOString(),
      updatedAt: s.updated_at || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, data: shipments });

  } catch (error) {
    console.error('Database error:', error);
    let filtered = DEMO_SHIPMENTS;
    if (status) filtered = filtered.filter(s => s.status === status);
    if (activeOnly) filtered = filtered.filter(s => s.status !== 'delivered');
    return NextResponse.json({ success: true, data: filtered, source: 'demo' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const body = await request.json();

    if (!body.orderId || !body.orderNumber || !body.origin || !body.destination) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const trucks = [
      { id: 'TRK-001', vehicleNumber: 'MH-01-AB-1234', driverName: 'Rajesh Kumar', vehicleType: 'Heavy Truck' },
      { id: 'TRK-002', vehicleNumber: 'DL-02-CD-5678', driverName: 'Amit Singh', vehicleType: 'Medium Truck' },
      { id: 'TRK-003', vehicleNumber: 'KA-03-EF-9012', driverName: 'Suresh Patel', vehicleType: 'Heavy Truck' },
    ];
    const truck = trucks[Math.floor(Math.random() * trucks.length)];

    if (!process.env.DATABASE_URL) {
      const newShipment = {
        id: `ship-${Date.now()}`,
        orderId: body.orderId,
        orderNumber: body.orderNumber,
        vehicleId: truck.id,
        vehicleNumber: truck.vehicleNumber,
        driverName: truck.driverName,
        vehicleType: truck.vehicleType,
        status: 'picking_up',
        origin: body.origin,
        destination: body.destination,
        currentLocation: body.origin,
        route: body.route,
        eta: body.eta || '4-6 hours',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, data: newShipment, source: 'demo' }, { status: 201 });
    }

    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const result = await pool.query(`
      INSERT INTO shipments (
        order_id, order_number, user_email, vehicle_id, vehicle_number,
        driver_name, vehicle_type, status, origin_name, origin_lat, origin_lng,
        destination_name, destination_lat, destination_lng,
        current_lat, current_lng, route_data, eta, progress
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `, [
      body.orderId, body.orderNumber, userEmail,
      truck.id, truck.vehicleNumber, truck.driverName, truck.vehicleType,
      'picking_up',
      body.origin.name, body.origin.lat, body.origin.lng,
      body.destination.name, body.destination.lat, body.destination.lng,
      body.origin.lat, body.origin.lng,
      body.route ? JSON.stringify(body.route) : null,
      body.eta || '4-6 hours',
      0
    ]);

    await pool.end();
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });

  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 });
  }
}
