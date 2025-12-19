// app/api/orders/place/route.ts
// Place order + create shipment - STANDALONE

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

function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ORD-';
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function generateTrackingNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TRK-';
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function generateRouteCoordinates(fromLat: number, fromLng: number, toLat: number, toLng: number): Array<{ lat: number; lng: number }> {
  const coordinates = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    coordinates.push({
      lat: fromLat + (toLat - fromLat) * t + Math.sin(t * Math.PI) * 0.3,
      lng: fromLng + (toLng - fromLng) * t,
    });
  }
  return coordinates;
}

export async function POST(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const body = await request.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Order must have at least one item' }, { status: 400 });
    }

    if (!body.selectedRoute || !body.origin || !body.destination) {
      return NextResponse.json({ error: 'Route information is required' }, { status: 400 });
    }

    const orderNumber = generateOrderNumber();
    const trackingNumber = generateTrackingNumber();
    const truck = AVAILABLE_TRUCKS[Math.floor(Math.random() * AVAILABLE_TRUCKS.length)];

    const routeCoordinates = body.selectedRoute.coordinates || 
      generateRouteCoordinates(body.origin.lat, body.origin.lng, body.destination.lat, body.destination.lng);

    // Create order
    const order = await queryOne<Record<string, unknown>>(`
      INSERT INTO orders (
        order_number, tracking_number, user_email, customer_id, customer_name,
        items, total_amount, status, shipping_address, delivery_type,
        assigned_vehicle, vehicle_number, driver_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      orderNumber, trackingNumber, userEmail,
      body.customerId || `CUST-${Date.now()}`,
      body.customerName || 'Self',
      JSON.stringify(body.items),
      body.totalAmount,
      'processing',
      body.shippingAddress || body.destination.name,
      body.deliveryType || truck.vehicleType,
      truck.id, truck.vehicleNumber, truck.driverName
    ]);

    if (!order) throw new Error('Failed to create order');

    // Create shipment
    const shipment = await queryOne<Record<string, unknown>>(`
      INSERT INTO shipments (
        order_id, order_number, user_email, vehicle_id, vehicle_number,
        driver_name, vehicle_type, status, origin_name, origin_lat, origin_lng,
        destination_name, destination_lat, destination_lng,
        current_lat, current_lng, route_data, eta, progress, distance, savings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `, [
      order.id, orderNumber, userEmail,
      truck.id, truck.vehicleNumber, truck.driverName, truck.vehicleType,
      'picking_up',
      body.origin.name, body.origin.lat, body.origin.lng,
      body.destination.name, body.destination.lat, body.destination.lng,
      body.origin.lat, body.origin.lng,
      JSON.stringify({ ...body.selectedRoute, coordinates: routeCoordinates }),
      body.selectedRoute.time || '4-6 hours',
      15, body.selectedRoute.distance, body.selectedRoute.savings
    ]);

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.order_number,
          trackingNumber: order.tracking_number,
          status: order.status,
          totalAmount: parseFloat(String(order.total_amount || 0)),
          vehicleNumber: order.vehicle_number,
          driverName: order.driver_name,
          createdAt: order.created_at
        },
        shipment: shipment ? {
          id: shipment.id,
          orderNumber: shipment.order_number,
          vehicleNumber: shipment.vehicle_number,
          driverName: shipment.driver_name,
          status: shipment.status,
          progress: shipment.progress,
          eta: shipment.eta
        } : null,
        truck: { id: truck.id, vehicleNumber: truck.vehicleNumber, driverName: truck.driverName, vehicleType: truck.vehicleType }
      }
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error placing order:', error);
    const pgError = error as { code?: string };
    if (pgError.code === '23505') {
      return NextResponse.json({ error: 'Order number already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
