/**
 * API Service Layer
 * Handles all communication with the backend API Gateway
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper to get auth token from Firebase
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  const { auth } = await import('./firebase');
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
}

// Generic fetch wrapper with auth
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// ============== INVENTORY API ==============
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unitPrice: number;
  quantityInStock: number;
  reorderLevel: number;
  warehouseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  category: string;
  unitPrice: number;
  quantityInStock: number;
  reorderLevel: number;
  warehouseId: string;
}

export const inventoryApi = {
  getAll: () => fetchWithAuth<Product[]>('/api/inventory/products'),
  getById: (id: string) => fetchWithAuth<Product>(`/api/inventory/products/${id}`),
  create: (data: CreateProductDto) => 
    fetchWithAuth<Product>('/api/inventory/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<CreateProductDto>) =>
    fetchWithAuth<Product>(`/api/inventory/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  adjustStock: (id: string, adjustment: { quantityChange: number; reason?: string }) =>
    fetchWithAuth<Product>(`/api/inventory/products/stock/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(adjustment),
    }),
  delete: (id: string) =>
    fetchWithAuth<void>(`/api/inventory/products/${id}`, { method: 'DELETE' }),
};

// ============== ORDERS API ==============
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  totalAmount: number;
  amountPaid: number;
  orderDate: string;
  expectedDeliveryDate: string;
  deliveryType: 'Truck' | 'Train' | 'Flight' | 'Ship';
  transitId?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderDto {
  customerId: string;
  customerName: string;
  items: { productId: string; quantity: number }[];
  deliveryType: 'Truck' | 'Train' | 'Flight' | 'Ship';
}

export const ordersApi = {
  getAll: () => fetchWithAuth<Order[]>('/api/orders'),
  getById: (id: string) => fetchWithAuth<Order>(`/api/orders/${id}`),
  create: (data: CreateOrderDto) =>
    fetchWithAuth<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: string, status: Order['status']) =>
    fetchWithAuth<Order>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  processPayment: (id: string, amount: number) =>
    fetchWithAuth<Order>(`/api/orders/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  cancel: (id: string) =>
    fetchWithAuth<Order>(`/api/orders/${id}/cancel`, { method: 'POST' }),
};

// ============== WAREHOUSE API ==============
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentOccupancy: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const warehouseApi = {
  getAll: () => fetchWithAuth<Warehouse[]>('/api/warehouse'),
  getById: (id: string) => fetchWithAuth<Warehouse>(`/api/warehouse/${id}`),
  getInventory: (id: string) => fetchWithAuth<Product[]>(`/api/warehouse/${id}/inventory`),
};

// ============== DELIVERY API ==============
export interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  driverName: string;
  vehicleType: 'Truck' | 'Van' | 'Bike';
  vehicleId: string;
  status: 'Assigned' | 'PickedUp' | 'InTransit' | 'Delivered' | 'Failed';
  currentLatitude: number;
  currentLongitude: number;
  estimatedArrival: string;
  actualArrival?: string;
  route: { lat: number; lng: number }[];
  createdAt: string;
  updatedAt: string;
}

export const deliveryApi = {
  getAll: () => fetchWithAuth<Delivery[]>('/api/delivery'),
  getById: (id: string) => fetchWithAuth<Delivery>(`/api/delivery/${id}`),
  getByOrder: (orderId: string) => fetchWithAuth<Delivery>(`/api/delivery/order/${orderId}`),
  getActiveRoutes: () => fetchWithAuth<Delivery[]>('/api/delivery/routes/active'),
  updateLocation: (id: string, lat: number, lng: number) =>
    fetchWithAuth<Delivery>(`/api/delivery/${id}/location`, {
      method: 'PATCH',
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    }),
};

// ============== FORECASTING API ==============
export interface ForecastRequest {
  productId: string;
  historicalMonths: number;
  forecastHorizon: number;
}

export interface ForecastResult {
  productId: string;
  productName: string;
  predictions: { month: string; predictedDemand: number; confidence: number }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: boolean;
  insights: string[];
}

export const forecastApi = {
  predict: (data: ForecastRequest) =>
    fetchWithAuth<ForecastResult>('/api/forecast/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getHistorical: (productId: string) =>
    fetchWithAuth<{ month: string; demand: number }[]>(`/api/forecast/historical/${productId}`),
};

// ============== AGENTIC AI API ==============
export interface AgentQuery {
  query: string;
  context?: Record<string, unknown>;
}

export interface AgentResponse {
  response: string;
  actions: { type: string; description: string; status: string }[];
  sources: string[];
}

export const agenticApi = {
  query: (data: AgentQuery) =>
    fetchWithAuth<AgentResponse>('/api/agentic/query', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getStatus: () => fetchWithAuth<{ status: string; activeAgents: number }>('/api/agentic/status'),
};

// ============== NOTIFICATIONS API ==============
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getAll: () => fetchWithAuth<Notification[]>('/api/notifications'),
  markAsRead: (id: string) =>
    fetchWithAuth<Notification>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () =>
    fetchWithAuth<void>('/api/notifications/read-all', { method: 'POST' }),
};

// ============== HEALTH CHECK ==============
export const healthApi = {
  check: () => fetch(`${API_BASE_URL}/health`).then(r => r.json()),
};

export default {
  inventory: inventoryApi,
  orders: ordersApi,
  warehouse: warehouseApi,
  delivery: deliveryApi,
  forecast: forecastApi,
  agentic: agenticApi,
  notifications: notificationsApi,
  health: healthApi,
};