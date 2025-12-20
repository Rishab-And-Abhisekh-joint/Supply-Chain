// app/api/orders/place/route.ts
// Place order + create shipment + create notification
// FIXED: Proper TypeScript types

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface LocationCoords {
  name: string;
  lat: number;
  lng: number;
}

interface RouteInfo {
  id: number;
  from: string;
  to: string;
  distance: string;
  time: string;
  savings: string;
  fuelCost: number;
  coordinates?: Array<{ lat: number; lng: number }>;
}

interface OrderRequestBody {
  items?: OrderItem[];
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  customerId?: string;
  customerName?: string;
  shippingAddress?: string;
  deliveryType?: string;
  origin?: LocationCoords;
  destination?: LocationCoords;
  selectedRoute?: RouteInfo;
}

interface TruckInfo {
  id: string;
  vehicleNumber: string;
  driverName: string;
  vehicleType: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AVAILABLE_TRUCKS: TruckInfo[] = [
  { id: 'TRK-001', vehicleNumber: 'MH-01-AB-1234', driverName: 'Rajesh Kumar', vehicleType: 'Heavy Truck' },
  { id: 'TRK-002', vehicleNumber: 'DL-02-CD-5678', driverName: 'Amit Singh', vehicleType: 'Medium Truck' },
  { id: 'TRK-003', vehicleNumber: 'KA-03-EF-9012', driverName: 'Suresh Patel', vehicleType: 'Heavy Truck' },
  { id: 'TRK-004', vehicleNumber: 'TN-04-GH-3456', driverName: 'Vikram Rao', vehicleType: 'Delivery Van' },
  { id: 'TRK-005', vehicleNumber: 'WB-05-IJ-7890', driverName: 'Manoj Verma', vehicleType: 'Heavy Truck' },
];

// ============================================================================
// HELPERS
// ============================================================================

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD-${timestamp}${random}`;
}

function generateTrackingNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRK-${timestamp}${random}`;
}

function generateRouteCoordinates(
  fromLat: number, 
  fromLng: number, 
  toLat: number, 
  toLng: number
): Array<{ lat: number; lng: number }> {
  const coordinates: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    coordinates.push({
      lat: fromLat + (toLat - fromLat) * t + Math.sin(t * Math.PI) * 0.3,
      lng: fromLng + (toLng - fromLng) * t,
    });
  }
  return coordinates;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const debugInfo: string[] = [];
  let pool = null;
  
  try {
    debugInfo.push('1. Starting order placement');
    
    const userEmail = getUserEmail(request);
    debugInfo.push(`2. User email: ${userEmail}`);
    
    // Parse and type the request body
    const body: OrderRequestBody = await request.json();
    debugInfo.push('3. Body received');

    // Validate and prepare items
    const items: OrderItem[] = [];
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      items.push(...body.items);
    } else {
      items.push({
        productId: 'PROD-001',
        productName: body.productName || 'Product',
        quantity: body.quantity || 1,
        unitPrice: body.unitPrice || 100,
        total: body.totalAmount || 100,
      });
    }
    debugInfo.push(`4. Items prepared: ${items.length} items`);

    // Handle missing route info gracefully
    const origin: LocationCoords = body.origin || { 
      name: 'Mumbai Warehouse', 
      lat: 19.0760, 
      lng: 72.8777 
    };
    const destination: LocationCoords = body.destination || { 
      name: 'Pune Distribution', 
      lat: 18.5204, 
      lng: 73.8567 
    };
    const selectedRoute: RouteInfo = body.selectedRoute || {
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
    const totalAmount = body.totalAmount || items.reduce((sum, item) => sum + (item.total || 0), 0);

    debugInfo.push(`5. Order number: ${orderNumber}, Tracking: ${trackingNumber}`);

    const routeCoordinates = selectedRoute.coordinates || 
      generateRouteCoordinates(origin.lat, origin.lng, destination.lat, destination.lng);

    // Check DATABASE_URL
    const hasDbUrl = !!process.env.DATABASE_URL;
    debugInfo.push(`6. DATABASE_URL set: ${hasDbUrl}`);

    // If no DATABASE_URL, return demo data
    if (!process.env.DATABASE_URL) {
      debugInfo.push('7. No DATABASE_URL - returning demo data');
      
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
        source: 'demo',
        debug: debugInfo
      }, { status: 201 });
    }

    // Database mode
    debugInfo.push('7. Attempting database connection...');
    
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });

    // Test connection
    debugInfo.push('8. Testing connection...');
    const testResult = await pool.query('SELECT NOW() as time');
    debugInfo.push(`9. Connection successful - Server time: ${testResult.rows[0].time}`);

    // Create orders table if not exists
    debugInfo.push('10. Ensuring orders table exists...');
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
    debugInfo.push('11. Orders table ready');

    // Create shipments table if not exists
    debugInfo.push('12. Ensuring shipments table exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID,
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
    debugInfo.push('13. Shipments table ready');

    // Create order
    debugInfo.push('14. Inserting order...');
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
    debugInfo.push(`15. Order created: ${order.id}`);

    // Create shipment
    debugInfo.push('16. Inserting shipment...');
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
    debugInfo.push(`17. Shipment created: ${shipmentResult.rows[0].id}`);

    // Create notification (non-blocking)
    try {
      debugInfo.push('18. Creating notification...');
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
      debugInfo.push('19. Notification created');
    } catch (notifError) {
      debugInfo.push(`19. Notification error (non-fatal): ${notifError}`);
    }

    await pool.end();
    debugInfo.push('20. Order placement complete!');

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
      },
      debug: debugInfo
    }, { status: 201 });

  } catch (error: unknown) {
    // Try to close pool if it exists
    if (pool) {
      try {
        await pool.end();
      } catch (e) {
        debugInfo.push(`Pool close error: ${e}`);
      }
    }
    
    const pgError = error as { code?: string; message?: string; detail?: string };
    
    debugInfo.push(`ERROR: ${pgError.message}`);
    debugInfo.push(`ERROR CODE: ${pgError.code}`);
    debugInfo.push(`ERROR DETAIL: ${pgError.detail}`);
    
    // Return detailed error for debugging
    return NextResponse.json({ 
      success: false,
      error: pgError.message || 'Unknown error',
      errorCode: pgError.code || 'UNKNOWN',
      errorDetail: pgError.detail,
      debug: debugInfo,
    }, { status: 500 });
  }
}