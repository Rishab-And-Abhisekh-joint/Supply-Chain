// lib/services/supplychain-api.ts
// Supply Chain API service with notifications and pending orders support

const API_BASE = '/api';

// Get user email from localStorage or return demo email
function getUserEmail(): string {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.email || 'demo@example.com';
      } catch {
        return 'demo@example.com';
      }
    }
  }
  return 'demo@example.com';
}

// API request helper
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; source?: string }> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-User-Email': getUserEmail(),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || `Request failed with status ${response.status}`,
      };
    }

    return { success: true, data: data.data || data, source: data.source };
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    return { success: false, error: error.message || 'Network error' };
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  customerId?: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress?: string;
  deliveryType?: string;
  assignedVehicle?: string;
  vehicleNumber?: string;
  driverName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  orderId?: string;
  orderNumber: string;
  vehicleId?: string;
  vehicleNumber: string;
  driverName: string;
  vehicleType: string;
  status: string;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  currentLocation: { lat: number; lng: number };
  route?: {
    id?: number;
    from?: string;
    to?: string;
    distance?: string;
    time?: string;
    savings?: string;
    fuelCost?: number;
    coordinates?: Array<{ lat: number; lng: number }>;
  };
  eta: string;
  progress: number;
  distance?: string;
  savings?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OptimizedRoute {
  id: string;
  routeName: string;
  from: string;
  to: string;
  fromCoords: { lat: number; lng: number };
  toCoords: { lat: number; lng: number };
  distance: string;
  time: string;
  savings: string;
  fuelCost: number;
  coordinates?: Array<{ lat: number; lng: number }>;
  isActive: boolean;
  createdAt: string;
}

export interface Truck {
  id: string;
  vehicleNumber: string;
  driverName: string;
  vehicleType: string;
  capacityKg?: number;
  status: string;
  currentLocation?: { lat: number; lng: number } | null;
}

export interface Notification {
  id: string;
  type: 'order' | 'delivery' | 'alert' | 'system';
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  trackingNumber?: string;
  timestamp: string;
  read: boolean;
}

export interface PendingOrder {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  recommendation?: string;
  source: string;
  status: string;
  createdAt: string;
}

export interface PlaceOrderData {
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress?: string;
  deliveryType?: string;
  selectedRoute: {
    id: number;
    from: string;
    to: string;
    distance: string;
    time: string;
    savings: string;
    fuelCost: number;
    coordinates?: Array<{ lat: number; lng: number }>;
  };
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
}

// ============================================================================
// ORDERS API
// ============================================================================

export const ordersApi = {
  getAll: (status?: string) => 
    apiRequest<Order[]>(`/orders${status ? `?status=${status}` : ''}`),
  
  getById: (id: string) => 
    apiRequest<Order>(`/orders/${id}`),
  
  create: (data: Partial<Order>) => 
    apiRequest<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (id: string, data: Partial<Order>) => 
    apiRequest<Order>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: (id: string) => 
    apiRequest<{ message: string }>(`/orders/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// SHIPMENTS API
// ============================================================================

export const shipmentsApi = {
  getAll: (filters?: { status?: string; active?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.active) params.set('active', 'true');
    const query = params.toString();
    return apiRequest<Shipment[]>(`/shipments${query ? `?${query}` : ''}`);
  },
  
  getById: (id: string) => 
    apiRequest<Shipment>(`/shipments/${id}`),
  
  create: (data: Partial<Shipment>) => 
    apiRequest<Shipment>('/shipments', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (id: string, data: Partial<Shipment & { currentLat?: number; currentLng?: number }>) => 
    apiRequest<Shipment>(`/shipments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: (id: string) => 
    apiRequest<{ message: string }>(`/shipments/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// ROUTES API
// ============================================================================

export const routesApi = {
  getAll: (activeOnly?: boolean) => 
    apiRequest<OptimizedRoute[]>(`/routes${activeOnly ? '?active=true' : ''}`),
  
  create: (data: Partial<OptimizedRoute>) => 
    apiRequest<OptimizedRoute>('/routes', { method: 'POST', body: JSON.stringify(data) }),
  
  deleteAll: () => 
    apiRequest<{ message: string }>('/routes', { method: 'DELETE' }),
};

// ============================================================================
// TRUCKS API
// ============================================================================

export const trucksApi = {
  getAll: (status?: string) => 
    apiRequest<Truck[]>(`/trucks${status ? `?status=${status}` : ''}`),
  
  create: (data: Partial<Truck>) => 
    apiRequest<Truck>('/trucks', { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

export const notificationsApi = {
  getAll: (unreadOnly?: boolean) => 
    apiRequest<Notification[]>(`/notifications${unreadOnly ? '?unread=true' : ''}`),
  
  create: (data: { type: string; title: string; message: string; orderId?: string; orderNumber?: string; trackingNumber?: string }) => 
    apiRequest<Notification>('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  
  markAsRead: (notificationIds: string[]) => 
    apiRequest<{ success: boolean }>('/notifications', { 
      method: 'PUT', 
      body: JSON.stringify({ notificationIds }) 
    }),
  
  markAllAsRead: () => 
    apiRequest<{ success: boolean }>('/notifications', { 
      method: 'PUT', 
      body: JSON.stringify({ markAllRead: true }) 
    }),
  
  delete: (id: string) => 
    apiRequest<{ success: boolean }>(`/notifications?id=${id}`, { method: 'DELETE' }),
};

// ============================================================================
// PENDING ORDERS API
// ============================================================================

export const pendingOrdersApi = {
  getAll: (status?: string) => 
    apiRequest<PendingOrder[]>(`/pending-orders${status ? `?status=${status}` : ''}`),
  
  create: (data: { 
    productId?: string; 
    productName: string; 
    quantity: number; 
    unitPrice: number; 
    total?: number;
    recommendation?: string;
    source?: string;
  }) => 
    apiRequest<PendingOrder>('/pending-orders', { method: 'POST', body: JSON.stringify(data) }),
  
  updateStatus: (orderId: string, status: string) => 
    apiRequest<PendingOrder>('/pending-orders', { 
      method: 'PUT', 
      body: JSON.stringify({ orderId, status }) 
    }),
  
  delete: (id: string) => 
    apiRequest<{ success: boolean }>(`/pending-orders?id=${id}`, { method: 'DELETE' }),
};

// ============================================================================
// PLACE ORDER (Combined order + shipment creation)
// ============================================================================

export async function placeOrder(data: PlaceOrderData): Promise<{
  success: boolean;
  data?: {
    order: Order;
    shipment: Shipment;
    truck: Truck;
    notification?: { type: string; title: string; message: string };
  };
  error?: string;
}> {
  return apiRequest('/orders/place', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Store pending order in sessionStorage (for page navigation)
export function storePendingOrderInSession(order: {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  recommendation?: string;
}) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('pendingOrder', JSON.stringify(order));
  }
}

// Get pending order from sessionStorage
export function getPendingOrderFromSession(): {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  recommendation?: string;
} | null {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('pendingOrder');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Clear pending order from sessionStorage
export function clearPendingOrderFromSession() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('pendingOrder');
  }
}
