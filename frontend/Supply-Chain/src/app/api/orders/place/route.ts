// app/api/orders/place/route.ts
// Place order + create shipment + create notification
// FIXED: Better error handling and table creation

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
  let pool = null;
  
  try {
    const userEmail = getUserEmail(request);
    const body = await request.json();

    console.log('Order place request received:', { userEmail, hasItems: !!body.items });

    // Validate and prepare items
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
      console.log('No DATABASE_URL, returning demo data');
      
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
    console.log('Connecting to database...');
    
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });

    // Test connection
    await pool.query('SELECT 1');
    console.log('Database connected successfully');

    // Ensure orders table exists with all required columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(100) UNIQUE NOT NULL,
        tracking_number VARCHAR(100) UNIQUE NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        customer_id VARCHAR(100),
        customer_name VARCHAR(255),
        items JSONB DEFAULT '[]',
        total_amount DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address TEXT,
        delivery_type VARCHAR(100),
        assigned_vehicle VARCHAR(100),
        vehicle_number VARCHAR(50),
        driver_name VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Orders table ready');

    // Ensure shipments table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        order_number VARCHAR(100),
        user_email VARCHAR(255) NOT NULL,
        vehicle_id VARCHAR(100),
        vehicle_number VARCHAR(50),
        driver_name VARCHAR(255),
        vehicle_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'picking_up',
        origin_name VARCHAR(255),
        origin_lat DECIMAL(10,6),
        origin_lng DECIMAL(10,6),
        destination_name VARCHAR(255),
        destination_lat DECIMAL(10,6),
        destination_lng DECIMAL(10,6),
        current_lat DECIMAL(10,6),
        current_lng DECIMAL(10,6),
        route_data JSONB,
        eta VARCHAR(100),
        progress INTEGER DEFAULT 0,
        distance VARCHAR(100),
        savings VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Shipments table ready');

    // Create order
    console.log('Inserting order...');
    const orderResult = await pool.query(`
      INSERT INTO orders (
        order_number, tracking_number, user_email, customer_id, customer_name,
        items, total_amount, status, shipping_address, delivery_type,
        assigned_vehicle, vehicle_number, driver_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      orderNumber, 
      trackingNumber, 
      userEmail,
      body.customerId || `CUST-${Date.now()}`,
      body.customerName || 'Self',
      JSON.stringify(items),
      totalAmount,
      'processing',
      body.shippingAddress || destination.name,
      body.deliveryType || truck.vehicleType,
      truck.id, 
      truck.vehicleNumber, 
      truck.driverName
    ]);

    const order = orderResult.rows[0];
    console.log('Order created:', order.id);

    // Create shipment
    console.log('Inserting shipment...');
    const shipmentResult = await pool.query(`
      INSERT INTO shipments (
        order_id, order_number, user_email, vehicle_id, vehicle_number,
        driver_name, vehicle_type, status, origin_name, origin_lat, origin_lng,
        destination_name, destination_lat, destination_lng,
        current_lat, current_lng, route_data, eta, progress, distance, savings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `, [
      order.id, 
      orderNumber, 
      userEmail,
      truck.id, 
      truck.vehicleNumber, 
      truck.driverName, 
      truck.vehicleType,
      'picking_up',
      origin.name, 
      origin.lat, 
      origin.lng,
      destination.name, 
      destination.lat, 
      destination.lng,
      origin.lat, 
      origin.lng,
      JSON.stringify({ ...selectedRoute, coordinates: routeCoordinates }),
      selectedRoute.time || '4-6 hours',
      15, 
      selectedRoute.distance || '24.5 km', 
      selectedRoute.savings || '15%'
    ]);
    console.log('Shipment created:', shipmentResult.rows[0].id);

    // Create notification (non-blocking)
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
      console.log('Notification created');
    } catch (notifError) {
      console.error('Error creating notification (non-fatal):', notifError);
    }

    await pool.end();
    console.log('Order placement complete');

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
    
    // Try to close pool if it exists
    if (pool) {
      try {
        await pool.end();
      } catch (e) {
        console.error('Error closing pool:', e);
      }
    }
    
    const pgError = error as { code?: string; message?: string; detail?: string };
    
    // Log detailed error info
    console.error('Error details:', {
      code: pgError.code,
      message: pgError.message,
      detail: pgError.detail
    });
    
    if (pgError.code === '23505') {
      return NextResponse.json({ 
        success: false,
        error: 'Order number already exists. Please try again.',
        code: 'DUPLICATE_ORDER'
      }, { status: 409 });
    }
    
    if (pgError.code === '42P01') {
      return NextResponse.json({ 
        success: false,
        error: 'Database table not found. Please contact support.',
        code: 'TABLE_NOT_FOUND'
      }, { status: 500 });
    }
    
    if (pgError.code === 'ECONNREFUSED' || pgError.code === 'ETIMEDOUT') {
      return NextResponse.json({ 
        success: false,
        error: 'Database connection failed. Please try again.',
        code: 'DB_CONNECTION_FAILED'
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Failed to place order. Please try again.',
      details: pgError.message || 'Unknown error',
      code: pgError.code || 'UNKNOWN'
    }, { status: 500 });
  }
}