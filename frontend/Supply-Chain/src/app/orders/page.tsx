// app/api/orders/place/route.ts
// Place order + create shipment + create notification

import { NextRequest, NextResponse } from 'next/server';

const AVAILABLE_TRUCKS = [
  { id: 'TRK-001', vehicleNumber: 'MH-01-AB-1234', driverName: 'Rajesh Kumar', vehicleType: 'Heavy Truck' },
  { id: 'TRK-002', vehicleNumber: 'DL-02-CD-5678', driverName: 'Amit Singh', vehicleType: 'Medium Truck' },
  { id: 'TRK-003', vehicleNumber: 'KA-03-EF-9012', driverName: 'Suresh Patel', vehicleType: 'Heavy Truck' },
  { id: 'TRK-004', vehicleNumber: 'TN-04-GH-3456', driverName: 'Vikram Rao', vehicleType: 'Delivery Van' },
  { id: 'TRK-005', vehicleNumber: 'WB-05-IJ-7890', driverName: 'Manoj Verma', vehicleType: 'Heavy Truck' },
];

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

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

    // Validate items
    const items = body.items || [];
    if (items.length === 0) {
      items.push({
        productId: 'PROD-001',
        productName: body.productName || 'Product',
        quantity: body.quantity || 1,
        unitPrice: body.unitPrice || 100,
        total: body.totalAmount || 100,
      });
    }

    // Handle missing route info gracefully
    const origin = body.origin || { name: 'Mumbai Warehouse', lat: 19.0760, lng: 72.8777 };
    const destination = body.destination || { name: 'Pune Distribution', lat: 18.5204, lng: 73.8567 };
    const selectedRoute = body.selectedRoute || {
      id: 1,
      from: origin.name,
      to: destination.name,
      distance: '150 km',
      time: '3h',
      savings: '12%',
      fuelCost: 2500,
    };

    const orderNumber = generateOrderNumber();
    const trackingNumber = generateTrackingNumber();
    const truck = AVAILABLE_TRUCKS[Math.floor(Math.random() * AVAILABLE_TRUCKS.length)];
    const now = new Date().toISOString();
    const totalAmount = body.totalAmount || items.reduce((sum: number, item: { total?: number }) => sum + (item.total || 0), 0);

    const routeCoordinates = selectedRoute.coordinates || 
      generateRouteCoordinates(origin.lat, origin.lng, destination.lat, destination.lng);

    // If no DATABASE_URL, return demo data
    if (!process.env.DATABASE_URL) {
      const demoOrder = {
        id: `order-${Date.now()}`,
        orderNumber,
        trackingNumber,
        customerId: body.customerId || `CUST-${Date.now()}`,
        customerName: body.customerName || 'Self',
        items,
        totalAmount,
        status: 'processing',
        shippingAddress: body.shippingAddress || destination.name,
        deliveryType: body.deliveryType || truck.vehicleType,
        assignedVehicle: truck.id,
        vehicleNumber: truck.vehicleNumber,
        driverName: truck.driverName,
        createdAt: now,
        updatedAt: now,
      };

      const demoShipment = {
        id: `ship-${Date.now()}`,
        orderId: demoOrder.id,
        orderNumber,
        vehicleId: truck.id,
        vehicleNumber: truck.vehicleNumber,
        driverName: truck.driverName,
        vehicleType: truck.vehicleType,
        status: 'picking_up',
        origin,
        destination,
        currentLocation: origin,
        route: { ...selectedRoute, coordinates: routeCoordinates },
        eta: selectedRoute.time || '4-6 hours',
        progress: 15,
        distance: selectedRoute.distance,
        savings: selectedRoute.savings,
        createdAt: now,
        updatedAt: now,
      };

      return NextResponse.json({
        success: true,
        data: {
          order: demoOrder,
          shipment: demoShipment,
          truck,
          notification: {
            type: 'order',
            title: 'Order Placed Successfully',
            message: `Order ${orderNumber} placed. Track with ${trackingNumber}`,
          }
        },
        source: 'demo'
      }, { status: 201 });
    }

    // Database mode
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    // Create order
    const orderResult = await pool.query(`
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
      JSON.stringify(items),
      totalAmount,
      'processing',
      body.shippingAddress || destination.name,
      body.deliveryType || truck.vehicleType,
      truck.id, truck.vehicleNumber, truck.driverName
    ]);

    const order = orderResult.rows[0];

    // Create shipment
    const shipmentResult = await pool.query(`
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
      origin.name, origin.lat, origin.lng,
      destination.name, destination.lat, destination.lng,
      origin.lat, origin.lng,
      JSON.stringify({ ...selectedRoute, coordinates: routeCoordinates }),
      selectedRoute.time || '4-6 hours',
      15, selectedRoute.distance, selectedRoute.savings
    ]);

    // Create notification
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_email VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          order_id VARCHAR(255),
          order_number VARCHAR(100),
          tracking_number VARCHAR(100),
          read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        INSERT INTO notifications (user_email, type, title, message, order_id, order_number, tracking_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        userEmail,
        'order',
        'Order Placed Successfully',
        `Your order ${orderNumber} has been placed and is being processed. Track it with ${trackingNumber}`,
        order.id,
        orderNumber,
        trackingNumber
      ]);
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail the order if notification fails
    }

    await pool.end();

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
        shipment: {
          id: shipmentResult.rows[0].id,
          orderNumber: orderNumber,
          vehicleNumber: truck.vehicleNumber,
          driverName: truck.driverName,
          status: 'picking_up',
          progress: 15,
          eta: selectedRoute.time || '4-6 hours'
        },
        truck,
        notification: {
          type: 'order',
          title: 'Order Placed Successfully',
          message: `Order ${orderNumber} placed. Track with ${trackingNumber}`,
        }
      }
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error placing order:', error);
    const pgError = error as { code?: string; message?: string };
    if (pgError.code === '23505') {
      return NextResponse.json({ error: 'Order number already exists' }, { status: 409 });
    }
    return NextResponse.json({ 
      error: 'Failed to place order',
      details: pgError.message || 'Unknown error'
    }, { status: 500 });
  }
}
