// app/api/routes/route.ts
// Routes API with proper error handling and fallback data

import { NextRequest, NextResponse } from 'next/server';

// Demo routes fallback
const DEMO_ROUTES = [
  {
    id: 'route-1',
    routeName: 'Mumbai → Delhi Express',
    from: 'Mumbai Warehouse',
    to: 'Delhi Hub',
    fromCoords: { lat: 19.0760, lng: 72.8777 },
    toCoords: { lat: 28.7041, lng: 77.1025 },
    distance: '1400 km',
    time: '24 hours',
    savings: '15%',
    fuelCost: 15000,
    coordinates: [
      { lat: 19.0760, lng: 72.8777 },
      { lat: 21.1702, lng: 72.8311 },
      { lat: 23.0225, lng: 72.5714 },
      { lat: 26.9124, lng: 75.7873 },
      { lat: 28.7041, lng: 77.1025 }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'route-2',
    routeName: 'Chennai → Bangalore Fast',
    from: 'Chennai Port',
    to: 'Bangalore DC',
    fromCoords: { lat: 13.0827, lng: 80.2707 },
    toCoords: { lat: 12.9716, lng: 77.5946 },
    distance: '350 km',
    time: '6 hours',
    savings: '12%',
    fuelCost: 4500,
    coordinates: [
      { lat: 13.0827, lng: 80.2707 },
      { lat: 12.9141, lng: 79.1324 },
      { lat: 12.9716, lng: 77.5946 }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'route-3',
    routeName: 'Delhi → Jaipur Route',
    from: 'Delhi Hub',
    to: 'Jaipur Center',
    fromCoords: { lat: 28.7041, lng: 77.1025 },
    toCoords: { lat: 26.9124, lng: 75.7873 },
    distance: '280 km',
    time: '5 hours',
    savings: '10%',
    fuelCost: 3500,
    coordinates: [
      { lat: 28.7041, lng: 77.1025 },
      { lat: 27.8974, lng: 76.5048 },
      { lat: 26.9124, lng: 75.7873 }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  }
];

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

export async function GET(request: NextRequest) {
  const userEmail = getUserEmail(request);
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get('active') === 'true';

  if (!process.env.DATABASE_URL) {
    let filtered = DEMO_ROUTES;
    if (activeOnly) filtered = filtered.filter(r => r.isActive);
    return NextResponse.json({ success: true, data: filtered, source: 'demo' });
  }

  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    let queryText = `SELECT * FROM optimized_routes WHERE user_email = $1`;
    if (activeOnly) queryText += ` AND is_active = true`;
    queryText += ` ORDER BY created_at DESC`;

    const result = await pool.query(queryText, [userEmail]);
    await pool.end();

    const routes = result.rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      routeName: r.route_name || '',
      from: r.from_location || '',
      to: r.to_location || '',
      fromCoords: { lat: parseFloat(String(r.from_lat || 0)), lng: parseFloat(String(r.from_lng || 0)) },
      toCoords: { lat: parseFloat(String(r.to_lat || 0)), lng: parseFloat(String(r.to_lng || 0)) },
      distance: r.distance || '',
      time: r.time || '',
      savings: r.savings || '',
      fuelCost: parseFloat(String(r.fuel_cost || 0)),
      coordinates: r.route_coordinates || [],
      isActive: r.is_active !== false,
      createdAt: r.created_at || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, data: routes });

  } catch (error) {
    console.error('Database error:', error);
    let filtered = DEMO_ROUTES;
    if (activeOnly) filtered = filtered.filter(r => r.isActive);
    return NextResponse.json({ success: true, data: filtered, source: 'demo' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const body = await request.json();

    if (!body.from || !body.to) {
      return NextResponse.json({ error: 'From and to locations required' }, { status: 400 });
    }

    // Generate coordinates
    const fromLat = body.fromLat || 19.0760;
    const fromLng = body.fromLng || 72.8777;
    const toLat = body.toLat || 28.7041;
    const toLng = body.toLng || 77.1025;

    const coords = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      coords.push({
        lat: fromLat + (toLat - fromLat) * t + Math.sin(t * Math.PI) * 0.3,
        lng: fromLng + (toLng - fromLng) * t,
      });
    }

    if (!process.env.DATABASE_URL) {
      const newRoute = {
        id: `route-${Date.now()}`,
        routeName: body.routeName || `${body.from} → ${body.to}`,
        from: body.from,
        to: body.to,
        fromCoords: { lat: fromLat, lng: fromLng },
        toCoords: { lat: toLat, lng: toLng },
        distance: body.distance || '',
        time: body.time || '',
        savings: body.savings || '',
        fuelCost: body.fuelCost || 0,
        coordinates: body.coordinates || coords,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, data: newRoute, source: 'demo' }, { status: 201 });
    }

    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const result = await pool.query(`
      INSERT INTO optimized_routes (
        user_email, route_name, from_location, to_location,
        from_lat, from_lng, to_lat, to_lng,
        distance, time, savings, fuel_cost, route_coordinates, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
      RETURNING *
    `, [
      userEmail, body.routeName || `${body.from} → ${body.to}`,
      body.from, body.to,
      fromLat, fromLng, toLat, toLng,
      body.distance, body.time, body.savings, body.fuelCost,
      JSON.stringify(body.coordinates || coords)
    ]);

    await pool.end();
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);

    if (process.env.DATABASE_URL) {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      await pool.query(`DELETE FROM optimized_routes WHERE user_email = $1`, [userEmail]);
      await pool.end();
    }

    return NextResponse.json({ success: true, message: 'All routes deleted' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to delete routes' }, { status: 500 });
  }
}
