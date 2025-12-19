// app/api/notifications/route.ts
// Notifications API with database support - FIXED duplicate id issue

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for notifications (acts as cache between DB calls)
let notificationsCache: Notification[] = [];

interface Notification {
  id: string;
  type: 'order' | 'delivery' | 'alert' | 'system';
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  trackingNumber?: string;
  timestamp: string;
  read: boolean;
  userEmail: string;
}

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

// GET /api/notifications - Get all notifications
export async function GET(request: NextRequest) {
  const userEmail = getUserEmail(request);
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';

  // Try database first
  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

      // Create notifications table if not exists
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

      let query = `SELECT * FROM notifications WHERE user_email = $1`;
      const params: string[] = [userEmail];

      if (unreadOnly) {
        query += ` AND read = false`;
      }
      query += ` ORDER BY created_at DESC LIMIT 50`;

      const result = await pool.query(query, params);
      await pool.end();

      const notifications = result.rows.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        orderId: n.order_id,
        orderNumber: n.order_number,
        trackingNumber: n.tracking_number,
        timestamp: n.created_at,
        read: n.read,
      }));

      return NextResponse.json({ success: true, data: notifications });
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  // Fallback to cache
  let filtered = notificationsCache.filter(n => n.userEmail === userEmail);
  if (unreadOnly) {
    filtered = filtered.filter(n => !n.read);
  }

  return NextResponse.json({ 
    success: true, 
    data: filtered.slice(0, 50),
    source: 'cache'
  });
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const body = await request.json();

    // Try database first
    if (process.env.DATABASE_URL) {
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });

        const result = await pool.query(`
          INSERT INTO notifications (user_email, type, title, message, order_id, order_number, tracking_number)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          userEmail, 
          body.type || 'system', 
          body.title, 
          body.message, 
          body.orderId || null, 
          body.orderNumber || null, 
          body.trackingNumber || null
        ]);

        await pool.end();

        // FIXED: Build response object without spread to avoid duplicate 'id'
        const row = result.rows[0];
        return NextResponse.json({ 
          success: true, 
          data: {
            id: row.id,
            type: row.type,
            title: row.title,
            message: row.message,
            orderId: row.order_id,
            orderNumber: row.order_number,
            trackingNumber: row.tracking_number,
            timestamp: row.created_at,
            read: row.read,
          }
        }, { status: 201 });
      } catch (error) {
        console.error('Database error:', error);
      }
    }

    // Fallback to cache
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type: body.type || 'system',
      title: body.title,
      message: body.message,
      orderId: body.orderId,
      orderNumber: body.orderNumber,
      trackingNumber: body.trackingNumber,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail,
    };

    notificationsCache.unshift(notification);
    if (notificationsCache.length > 100) {
      notificationsCache = notificationsCache.slice(0, 100);
    }

    return NextResponse.json({ success: true, data: notification, source: 'cache' }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (process.env.DATABASE_URL) {
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });

        if (markAllRead) {
          await pool.query(`UPDATE notifications SET read = true WHERE user_email = $1`, [userEmail]);
        } else if (notificationIds && notificationIds.length > 0) {
          await pool.query(`UPDATE notifications SET read = true WHERE id = ANY($1) AND user_email = $2`, 
            [notificationIds, userEmail]);
        }

        await pool.end();
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Database error:', error);
      }
    }

    // Fallback to cache
    if (markAllRead) {
      notificationsCache = notificationsCache.map(n => 
        n.userEmail === userEmail ? { ...n, read: true } : n
      );
    } else if (notificationIds) {
      notificationsCache = notificationsCache.map(n => 
        notificationIds.includes(n.id) ? { ...n, read: true } : n
      );
    }

    return NextResponse.json({ success: true, source: 'cache' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

// DELETE /api/notifications - Delete a notification
export async function DELETE(request: NextRequest) {
  try {
    const userEmail = getUserEmail(request);
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });

        await pool.query(`DELETE FROM notifications WHERE id = $1 AND user_email = $2`, 
          [notificationId, userEmail]);

        await pool.end();
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Database error:', error);
      }
    }

    // Fallback to cache
    notificationsCache = notificationsCache.filter(n => n.id !== notificationId);
    return NextResponse.json({ success: true, source: 'cache' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}