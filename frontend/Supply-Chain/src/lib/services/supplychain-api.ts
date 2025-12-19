// lib/services/supplychain-api.ts
// Supply Chain API Service - works with your custom AuthContext

const API_BASE = '/api';

// Helper to get auth headers from localStorage
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('supplychain_user') || localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        headers['X-User-Email'] = userData.email || '';
        headers['X-User-Id'] = userData.id || '';
      } catch (e) { /* ignore */ }
    }
  }
  return headers;
}

// Generic fetch wrapper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { headers: getAuthHeaders(), ...options });
    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error || 'Request failed' };
    return { success: true, data: result.data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Network error';
    return { success: false, error: msg };
  }
}

// ============================================
// TYPES
// ============================================

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
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress: string;
  deliveryType: string;
  assignedVehicle?: string;
  vehicleNumber?: string;
  driverName?: string;
  createdAt: string;
  updatedAt?: string;
}

// FIXED: Added 'delivered' to status type
export interface Shipment {
  id: string;
  orderId: string;
  orderNumber: string;
  vehicleId: string;
  vehicleNumber: string;
  driverName: string;
  vehicleType: string;
  status: 'picking_up' | 'in_transit' | 'delivering' | 'delivered';
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  currentLocation: { lat: number; lng: number };
  route?: {
    id: number;
    from: string;
    to: string;
    distance: string;
    time: string;
    savings: string;
    fuelCost: number;
    coordinates: Array<{ lat: number; lng: number }>;
  };
  eta: string;
  progress: number;
  distance?: string;
  savings?: string;
  createdAt: string;
  updatedAt?: string;
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
  coordinates: Array<{ lat: number; lng: number }>;
  isActive: boolean;
  createdAt: string;
}

export interface Truck {
  id: string;
  vehicleNumber: string;
  driverName: string;
  vehicleType: string;
  capacityKg: number;
  status: 'available' | 'in_use' | 'maintenance';
  currentLocation?: { lat: number; lng: number };
}

export interface PlaceOrderData {
  customerId?: string;
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

export interface PlaceOrderResult {
  order: Order;
  shipment: Shipment;
  truck: Truck;
}

// ============================================
// ORDERS API
// ============================================

export const ordersApi = {
  async getAll(params?: { status?: string; search?: string }): Promise<{ success: boolean; data?: Order[]; error?: string }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return apiFetch<Order[]>(`/orders${query ? `?${query}` : ''}`);
  },
  async getById(id: string) { return apiFetch<Order>(`/orders/${id}`); },
  async create(data: Partial<Order>) { return apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }); },
  async update(id: string, data: Partial<Order>) { return apiFetch<Order>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async delete(id: string) { return apiFetch<void>(`/orders/${id}`, { method: 'DELETE' }); },
};

// ============================================
// SHIPMENTS API
// ============================================

export const shipmentsApi = {
  async getAll(params?: { status?: string; active?: boolean }): Promise<{ success: boolean; data?: Shipment[]; error?: string }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.active) searchParams.set('active', 'true');
    const query = searchParams.toString();
    return apiFetch<Shipment[]>(`/shipments${query ? `?${query}` : ''}`);
  },
  async getById(id: string) { return apiFetch<Shipment>(`/shipments/${id}`); },
  async create(data: { orderId: string; orderNumber: string; origin: { name: string; lat: number; lng: number }; destination: { name: string; lat: number; lng: number }; route?: Shipment['route'] }) {
    return apiFetch<Shipment>('/shipments', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: { status?: string; progress?: number; currentLat?: number; currentLng?: number; eta?: string }) {
    return apiFetch<Shipment>(`/shipments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async delete(id: string) { return apiFetch<void>(`/shipments/${id}`, { method: 'DELETE' }); },
};

// ============================================
// ROUTES API
// ============================================

export const routesApi = {
  async getAll(activeOnly?: boolean): Promise<{ success: boolean; data?: OptimizedRoute[]; error?: string }> {
    return apiFetch<OptimizedRoute[]>(`/routes${activeOnly ? '?active=true' : ''}`);
  },
  async create(data: { from: string; to: string; fromLat?: number; fromLng?: number; toLat?: number; toLng?: number; distance: string; time: string; savings: string; fuelCost: number }) {
    return apiFetch<OptimizedRoute>('/routes', { method: 'POST', body: JSON.stringify(data) });
  },
  async deleteAll() { return apiFetch<void>('/routes', { method: 'DELETE' }); },
};

// ============================================
// TRUCKS API
// ============================================

export const trucksApi = {
  async getAll(status?: string): Promise<{ success: boolean; data?: Truck[]; error?: string }> {
    return apiFetch<Truck[]>(`/trucks${status ? `?status=${status}` : ''}`);
  },
};

// ============================================
// PLACE ORDER
// ============================================

export async function placeOrder(data: PlaceOrderData): Promise<{ success: boolean; data?: PlaceOrderResult; error?: string }> {
  return apiFetch<PlaceOrderResult>('/orders/place', { method: 'POST', body: JSON.stringify(data) });
}

// Default export
export default { orders: ordersApi, shipments: shipmentsApi, routes: routesApi, trucks: trucksApi, placeOrder };
