// app/api/routes/route.ts
// Routes API - STANDALONE

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

export async function GET(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let queryText = `SELECT * FROM optimized_routes WHERE user_email = $1`;
    if (activeOnly) queryText += ` AND is_active = true`;
    queryText += ` ORDER BY created_at DESC`;

    const routes = await query(queryText, [userEmail]);

    const transformedRoutes = routes.map((r: Record<string, unknown>) => ({
      id: r.id,
      routeName: r.route_name,
      from: r.from_location,
      to: r.to_location,
      fromCoords: { lat: parseFloat(String(r.from_lat)), lng: parseFloat(String(r.from_lng)) },
      toCoords: { lat: parseFloat(String(r.to_lat)), lng: parseFloat(String(r.to_lng)) },
      distance: r.distance,
      time: r.time,
      savings: r.savings,
      fuelCost: parseFloat(String(r.fuel_cost || 0)),
      coordinates: r.route_coordinates,
      isActive: r.is_active,
      createdAt: r.created_at
    }));

    return NextResponse.json({ success: true, data: transformedRoutes });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const body = await request.json();

    if (!body.from || !body.to) {
      return NextResponse.json({ error: 'From and to locations required' }, { status: 400 });
    }

    // Generate coordinates if not provided
    const coords = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      coords.push({
        lat: body.fromLat + (body.toLat - body.fromLat) * t + Math.sin(t * Math.PI) * 0.3,
        lng: body.fromLng + (body.toLng - body.fromLng) * t,
      });
    }

    const result = await queryOne(`
      INSERT INTO optimized_routes (
        user_email, route_name, from_location, to_location,
        from_lat, from_lng, to_lat, to_lng,
        distance, time, savings, fuel_cost, route_coordinates, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
      RETURNING *
    `, [
      userEmail, body.routeName || `${body.from} → ${body.to}`,
      body.from, body.to,
      body.fromLat, body.fromLng, body.toLat, body.toLng,
      body.distance, body.time, body.savings, body.fuelCost,
      JSON.stringify(body.coordinates || coords)
    ]);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    await query(`DELETE FROM optimized_routes WHERE user_email = $1`, [userEmail]);
    return NextResponse.json({ success: true, message: 'All routes deleted' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to delete routes' }, { status: 500 });
  }
}
