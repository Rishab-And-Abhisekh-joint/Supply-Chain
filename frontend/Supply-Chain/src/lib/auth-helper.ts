// lib/auth-helper.ts
// Helper to get user from request - works with your custom AuthContext

import { cookies } from 'next/headers';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Get user from request headers or cookies
// Since your auth stores in localStorage (client-side), we need to pass user info via headers
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  try {
    // Option 1: Get from Authorization header (Bearer token approach)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Decode token if it's a JWT, or validate against your backend
      // For now, we'll extract user from a custom header
    }

    // Option 2: Get from custom header (set by frontend)
    const userHeader = request.headers.get('X-User-Email');
    if (userHeader) {
      return {
        id: request.headers.get('X-User-Id') || 'unknown',
        email: userHeader,
        firstName: request.headers.get('X-User-FirstName') || '',
        lastName: request.headers.get('X-User-LastName') || '',
        role: request.headers.get('X-User-Role') || 'user',
      };
    }

    return null;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// Simple function to get user email - returns a default for demo mode
export async function getUserEmail(request: Request): Promise<string | null> {
  const user = await getAuthUser(request);
  if (user?.email) {
    return user.email;
  }
  
  // Fallback: check for email in query params (for demo/testing)
  const url = new URL(request.url);
  const emailParam = url.searchParams.get('userEmail');
  if (emailParam) {
    return emailParam;
  }

  // Default demo user for testing
  return 'demo@example.com';
}
