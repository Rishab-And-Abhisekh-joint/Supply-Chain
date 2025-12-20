// app/api/settings/route.ts
// User settings API - stores in PostgreSQL

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
    phone?: string;
    company?: string;
  };
  notifications: {
    lowStockAlerts: boolean;
    orderUpdates: boolean;
    deliveryAlerts: boolean;
    systemNotifications: boolean;
    emailDigest: boolean;
    pushNotifications: boolean;
    smsAlerts: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    sidebarStyle: 'expanded' | 'collapsed';
    compactMode: boolean;
    animationsEnabled: boolean;
  };
  regional: {
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    numberFormat: string;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginNotifications: boolean;
  };
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const defaultSettings: UserSettings = {
  profile: {
    firstName: '',
    lastName: '',
    email: '',
    role: 'User',
    phone: '',
    company: '',
  },
  notifications: {
    lowStockAlerts: true,
    orderUpdates: true,
    deliveryAlerts: true,
    systemNotifications: true,
    emailDigest: false,
    pushNotifications: true,
    smsAlerts: false,
  },
  appearance: {
    theme: 'light',
    sidebarStyle: 'expanded',
    compactMode: false,
    animationsEnabled: true,
  },
  regional: {
    language: 'en-US',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-IN',
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginNotifications: true,
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function getUserEmail(request: NextRequest): string {
  return request.headers.get('X-User-Email') || 'demo@example.com';
}

// ============================================================================
// GET - Fetch user settings
// ============================================================================

export async function GET(request: NextRequest) {
  const userEmail = getUserEmail(request);

  // If no database, return defaults with user email
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: true,
      data: {
        ...defaultSettings,
        profile: {
          ...defaultSettings.profile,
          email: userEmail,
          firstName: userEmail.split('@')[0].split('.')[0] || 'User',
          lastName: userEmail.split('@')[0].split('.')[1] || '',
        }
      },
      source: 'default'
    });
  }

  let pool = null;

  try {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(255) UNIQUE NOT NULL,
        settings JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Fetch user settings
    const result = await pool.query(
      'SELECT settings FROM user_settings WHERE user_email = $1',
      [userEmail]
    );

    await pool.end();

    if (result.rows.length === 0) {
      // Return defaults for new user
      return NextResponse.json({
        success: true,
        data: {
          ...defaultSettings,
          profile: {
            ...defaultSettings.profile,
            email: userEmail,
            firstName: userEmail.split('@')[0].split('.')[0] || 'User',
            lastName: userEmail.split('@')[0].split('.')[1] || '',
          }
        },
        source: 'default'
      });
    }

    // Merge stored settings with defaults (in case new fields were added)
    const stored = result.rows[0].settings as UserSettings;
    const merged: UserSettings = {
      profile: { ...defaultSettings.profile, ...stored.profile, email: userEmail },
      notifications: { ...defaultSettings.notifications, ...stored.notifications },
      appearance: { ...defaultSettings.appearance, ...stored.appearance },
      regional: { ...defaultSettings.regional, ...stored.regional },
      security: { ...defaultSettings.security, ...stored.security },
    };

    return NextResponse.json({
      success: true,
      data: merged,
      source: 'database'
    });

  } catch (error: unknown) {
    if (pool) {
      try { await pool.end(); } catch { /* ignore */ }
    }
    
    const pgError = error as { message?: string };
    console.error('Settings fetch error:', pgError.message);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch settings',
      data: defaultSettings
    }, { status: 500 });
  }
}

// ============================================================================
// PUT - Update user settings
// ============================================================================

export async function PUT(request: NextRequest) {
  const userEmail = getUserEmail(request);

  let body: Partial<UserSettings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request body' 
    }, { status: 400 });
  }

  // If no database, just return success (settings stored in localStorage on client)
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: true,
      message: 'Settings saved (localStorage only - no database configured)',
      source: 'localStorage'
    });
  }

  let pool = null;

  try {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(255) UNIQUE NOT NULL,
        settings JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get existing settings
    const existing = await pool.query(
      'SELECT settings FROM user_settings WHERE user_email = $1',
      [userEmail]
    );

    let mergedSettings: UserSettings;

    if (existing.rows.length === 0) {
      // Create new record
      mergedSettings = {
        profile: { ...defaultSettings.profile, ...body.profile, email: userEmail },
        notifications: { ...defaultSettings.notifications, ...body.notifications },
        appearance: { ...defaultSettings.appearance, ...body.appearance },
        regional: { ...defaultSettings.regional, ...body.regional },
        security: { ...defaultSettings.security, ...body.security },
      };

      await pool.query(
        'INSERT INTO user_settings (user_email, settings) VALUES ($1, $2)',
        [userEmail, JSON.stringify(mergedSettings)]
      );
    } else {
      // Update existing
      const currentSettings = existing.rows[0].settings as UserSettings;
      
      mergedSettings = {
        profile: { ...currentSettings.profile, ...body.profile, email: userEmail },
        notifications: { ...currentSettings.notifications, ...body.notifications },
        appearance: { ...currentSettings.appearance, ...body.appearance },
        regional: { ...currentSettings.regional, ...body.regional },
        security: { ...currentSettings.security, ...body.security },
      };

      await pool.query(
        'UPDATE user_settings SET settings = $1, updated_at = CURRENT_TIMESTAMP WHERE user_email = $2',
        [JSON.stringify(mergedSettings), userEmail]
      );
    }

    await pool.end();

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      data: mergedSettings,
      source: 'database'
    });

  } catch (error: unknown) {
    if (pool) {
      try { await pool.end(); } catch { /* ignore */ }
    }
    
    const pgError = error as { message?: string };
    console.error('Settings save error:', pgError.message);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to save settings',
      details: pgError.message
    }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Reset user settings to defaults
// ============================================================================

export async function DELETE(request: NextRequest) {
  const userEmail = getUserEmail(request);

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: true,
      message: 'Settings reset (localStorage only)',
      data: defaultSettings
    });
  }

  let pool = null;

  try {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await pool.query(
      'DELETE FROM user_settings WHERE user_email = $1',
      [userEmail]
    );

    await pool.end();

    return NextResponse.json({
      success: true,
      message: 'Settings reset to defaults',
      data: {
        ...defaultSettings,
        profile: { ...defaultSettings.profile, email: userEmail }
      }
    });

  } catch (error: unknown) {
    if (pool) {
      try { await pool.end(); } catch { /* ignore */ }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to reset settings'
    }, { status: 500 });
  }
}