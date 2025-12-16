// src/lib/api.ts
// FIXED: API service layer with proper error handling

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Types
// Types
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

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
  createdAt?: string;
  updatedAt?: string;
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

export interface Order {
  id: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  orderDate?: string;
  expectedDeliveryDate?: string;
  deliveryType: string;
  transitId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Delivery {
  id: string;
  orderId?: string;
  driverName?: string;
  vehicleType?: string;
  status: string;
  currentLatitude?: number;
  currentLongitude?: number;
  estimatedArrival?: string;
  route?: { lat: number; lng: number }[];
}

// interface Warehouse {

interface Warehouse {
  id: string;
  name: string;
  location?: string;
  capacity?: number;
}

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    // Import dynamically to avoid SSR issues
    const { auth } = await import('@/lib/firebase');
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Generic fetch wrapper with authentication
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] Fetching: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const status = response.status;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error ${status}: ${errorText}`);
      return {
        data: null,
        error: `HTTP ${status}: ${errorText || response.statusText}`,
        status,
      };
    }

    const data = await response.json();
    return { data, error: null, status };
  } catch (error) {
    console.error('[API] Fetch error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 0,
    };
  }
}

// Warehouse API
export const warehouseApi = {
  // Get all warehouses
  async getAll(): Promise<Warehouse[]> {
    const result = await fetchWithAuth<Warehouse[]>('/api/warehouse');
    if (result.error || !result.data) {
      console.warn('Could not fetch warehouses:', result.error);
      return [];
    }
    return result.data;
  },
  
  // Get warehouse by ID
  async getById(id: string): Promise<Warehouse | null> {
    const result = await fetchWithAuth<Warehouse>(`/api/warehouse/${id}`);
    if (result.error || !result.data) {
      console.warn(`Could not fetch warehouse ${id}:`, result.error);
      return null;
    }
    return result.data;
  },
  
  // Get warehouse name by ID (with fallback)
  async getName(id: string): Promise<string> {
    const warehouse = await this.getById(id);
    return warehouse?.name || id;
  },

  // Get receiving endpoint
  async createReceiving(data: unknown) {
    return fetchWithAuth('/api/warehouse/receiving', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get picklists
  async getPicklists() {
    return fetchWithAuth('/api/warehouse/picklists');
  },

  // Create picklist
  async createPicklist(data: unknown) {
    return fetchWithAuth('/api/warehouse/picklists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Inventory API
export const inventoryApi = {
  async getAll() {
    return fetchWithAuth('/api/inventory');
  },
  
  async getById(id: string) {
    return fetchWithAuth(`/api/inventory/${id}`);
  },
  
  async create(data: unknown) {
    return fetchWithAuth('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async update(id: string, data: unknown) {
    return fetchWithAuth(`/api/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Orders API
export const ordersApi = {
  async getAll() {
    return fetchWithAuth('/api/orders');
  },
  
  async getById(id: string) {
    return fetchWithAuth(`/api/orders/${id}`);
  },
  
  async create(data: unknown) {
    return fetchWithAuth('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async updateStatus(id: string, status: string) {
    return fetchWithAuth(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Delivery API
export const deliveryApi = {
  async getRoutes() {
    return fetchWithAuth('/api/delivery/routes');
  },
  
  async createRoute(data: unknown) {
    return fetchWithAuth('/api/delivery/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async optimizeRoutes(data: unknown) {
    return fetchWithAuth('/api/delivery/routes/optimize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async getRouteById(id: string) {
    return fetchWithAuth(`/api/delivery/routes/${id}`);
  },
  
  async updateStopStatus(stopId: string, status: string) {
    return fetchWithAuth(`/api/delivery/stops/${stopId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Forecast API
export const forecastApi = {
  async getDemandForecast(params?: Record<string, string>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return fetchWithAuth(`/api/forecast/demand${queryString}`);
  },
  
  async getInventoryForecast(params?: Record<string, string>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return fetchWithAuth(`/api/forecast/inventory${queryString}`);
  },
};

// Agentic AI API
export const agenticApi = {
  async chat(message: string, conversationId?: string) {
    return fetchWithAuth('/api/agentic/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    });
  },
  
  async getRecommendations(context?: string) {
    return fetchWithAuth('/api/agentic/recommendations', {
      method: 'POST',
      body: JSON.stringify({ context }),
    });
  },
};

// Health check
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export default {
  warehouse: warehouseApi,
  inventory: inventoryApi,
  orders: ordersApi,
  delivery: deliveryApi,
  forecast: forecastApi,
  agentic: agenticApi,
  checkHealth: checkApiHealth,
};