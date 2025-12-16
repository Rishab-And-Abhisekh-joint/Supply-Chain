// src/lib/api.ts
// FIXED: API service layer with proper error handling
// UPDATED: Added suppliersApi for logistics optimization dropdowns

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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

export interface Warehouse {
  id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  currentOccupancy?: number;
  isActive?: boolean;
}

// NEW: Supplier interface for logistics optimization
export interface Supplier {
  id: string;
  name: string;
  code: string;
  type: 'supplier' | 'distributor' | 'manufacturer';
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: 'active' | 'inactive';
}

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  try {
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

// ============== MOCK DATA FOR FALLBACK ==============

// Mock suppliers data (used when backend /api/suppliers doesn't exist)
function getMockSuppliers(): Supplier[] {
  return [
    {
      id: 'sup-001',
      name: 'Global Distribution Inc.',
      code: 'GDI',
      type: 'distributor',
      address: '500 Industrial Blvd',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      latitude: 41.8781,
      longitude: -87.6298,
      contactName: 'John Smith',
      contactEmail: 'john@globaldist.com',
      contactPhone: '+1-312-555-0100',
      status: 'active',
    },
    {
      id: 'sup-002',
      name: 'Pacific Suppliers Co.',
      code: 'PSC',
      type: 'supplier',
      address: '1200 Harbor Way',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      latitude: 34.0522,
      longitude: -118.2437,
      contactName: 'Maria Garcia',
      contactEmail: 'maria@pacificsuppliers.com',
      contactPhone: '+1-213-555-0200',
      status: 'active',
    },
    {
      id: 'sup-003',
      name: 'Eastern Manufacturing Ltd.',
      code: 'EML',
      type: 'manufacturer',
      address: '800 Factory Row',
      city: 'Philadelphia',
      state: 'PA',
      country: 'USA',
      latitude: 39.9526,
      longitude: -75.1652,
      contactName: 'Robert Chen',
      contactEmail: 'robert@easternmfg.com',
      contactPhone: '+1-215-555-0300',
      status: 'active',
    },
    {
      id: 'sup-004',
      name: 'Midwest Logistics Hub',
      code: 'MLH',
      type: 'distributor',
      address: '2500 Gateway Dr',
      city: 'St. Louis',
      state: 'MO',
      country: 'USA',
      latitude: 38.6270,
      longitude: -90.1994,
      contactName: 'Sarah Johnson',
      contactEmail: 'sarah@midwestlogistics.com',
      contactPhone: '+1-314-555-0400',
      status: 'active',
    },
    {
      id: 'sup-005',
      name: 'Southern Suppliers Network',
      code: 'SSN',
      type: 'supplier',
      address: '1500 Commerce Park',
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      latitude: 33.7490,
      longitude: -84.3880,
      contactName: 'Michael Brown',
      contactEmail: 'michael@southernsuppliers.com',
      contactPhone: '+1-404-555-0500',
      status: 'active',
    },
    {
      id: 'sup-006',
      name: 'Texas Distribution Center',
      code: 'TDC',
      type: 'distributor',
      address: '3200 Logistics Way',
      city: 'Dallas',
      state: 'TX',
      country: 'USA',
      latitude: 32.7767,
      longitude: -96.7970,
      contactName: 'Emily Davis',
      contactEmail: 'emily@texasdist.com',
      contactPhone: '+1-214-555-0600',
      status: 'active',
    },
  ];
}

// Mock warehouses data (used when backend /api/warehouse returns empty or fails)
function getMockWarehouses(): Warehouse[] {
  return [
    {
      id: 'wh-001',
      name: 'Central Distribution Center',
      code: 'CDC',
      address: '1000 Warehouse Blvd',
      city: 'Indianapolis',
      state: 'IN',
      country: 'USA',
      latitude: 39.7684,
      longitude: -86.1581,
      capacity: 50000,
      currentOccupancy: 35000,
      isActive: true,
    },
    {
      id: 'wh-002',
      name: 'West Coast Fulfillment',
      code: 'WCF',
      address: '2500 Port Ave',
      city: 'Long Beach',
      state: 'CA',
      country: 'USA',
      latitude: 33.7701,
      longitude: -118.1937,
      capacity: 75000,
      currentOccupancy: 52000,
      isActive: true,
    },
    {
      id: 'wh-003',
      name: 'Northeast Regional Hub',
      code: 'NRH',
      address: '500 Distribution Dr',
      city: 'Newark',
      state: 'NJ',
      country: 'USA',
      latitude: 40.7357,
      longitude: -74.1724,
      capacity: 60000,
      currentOccupancy: 41000,
      isActive: true,
    },
    {
      id: 'wh-004',
      name: 'Southeast Distribution',
      code: 'SED',
      address: '800 Logistics Pkwy',
      city: 'Jacksonville',
      state: 'FL',
      country: 'USA',
      latitude: 30.3322,
      longitude: -81.6557,
      capacity: 45000,
      currentOccupancy: 28000,
      isActive: true,
    },
    {
      id: 'wh-005',
      name: 'Mountain States Warehouse',
      code: 'MSW',
      address: '1200 Rocky Rd',
      city: 'Denver',
      state: 'CO',
      country: 'USA',
      latitude: 39.7392,
      longitude: -104.9903,
      capacity: 35000,
      currentOccupancy: 22000,
      isActive: true,
    },
  ];
}

// ============== SUPPLIERS API (NEW) ==============

export const suppliersApi = {
  // Get all suppliers
  async getAll(): Promise<Supplier[]> {
    const result = await fetchWithAuth<Supplier[]>('/api/suppliers');
    if (result.error || !result.data || result.data.length === 0) {
      console.warn('Using mock suppliers data (backend unavailable or empty)');
      return getMockSuppliers();
    }
    return result.data;
  },
  
  // Get supplier by ID
  async getById(id: string): Promise<Supplier | null> {
    const result = await fetchWithAuth<Supplier>(`/api/suppliers/${id}`);
    if (result.error || !result.data) {
      // Try to find in mock data
      const mockSuppliers = getMockSuppliers();
      return mockSuppliers.find(s => s.id === id) || null;
    }
    return result.data;
  },
  
  // Get active suppliers only
  async getActive(): Promise<Supplier[]> {
    const result = await fetchWithAuth<Supplier[]>('/api/suppliers?status=active');
    if (result.error || !result.data || result.data.length === 0) {
      console.warn('Using mock suppliers data (backend unavailable or empty)');
      return getMockSuppliers().filter(s => s.status === 'active');
    }
    return result.data.filter(s => s.status === 'active');
  },
};

// ============== WAREHOUSE API (with fallback) ==============

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

// Warehouse API with fallback to mock data (for logistics dropdowns)
export const warehouseApiWithFallback = {
  async getAll(): Promise<Warehouse[]> {
    const result = await fetchWithAuth<Warehouse[]>('/api/warehouse');
    if (result.error || !result.data || result.data.length === 0) {
      console.warn('Using mock warehouses data (backend unavailable or empty)');
      return getMockWarehouses();
    }
    return result.data;
  },
  
  async getActive(): Promise<Warehouse[]> {
    const warehouses = await this.getAll();
    return warehouses.filter(w => w.isActive !== false);
  },
};

// ============== INVENTORY API ==============

export const inventoryApi = {
  async getAll(): Promise<Product[]> {
    const result = await fetchWithAuth<Product[]>('/api/inventory');
    if (result.error || !result.data) {
      console.warn('Could not fetch inventory:', result.error);
      return [];
    }
    return result.data;
  },
  
  async getById(id: string): Promise<Product | null> {
    const result = await fetchWithAuth<Product>(`/api/inventory/${id}`);
    if (result.error || !result.data) {
      return null;
    }
    return result.data;
  },
  
  async create(data: CreateProductDto): Promise<Product> {
    const result = await fetchWithAuth<Product>('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result.error || !result.data) {
      throw new Error(result.error || 'Failed to create product');
    }
    return result.data;
  },
  
  async update(id: string, data: Partial<CreateProductDto>): Promise<Product> {
    const result = await fetchWithAuth<Product>(`/api/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (result.error || !result.data) {
      throw new Error(result.error || 'Failed to update product');
    }
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const result = await fetchWithAuth<void>(`/api/inventory/${id}`, {
      method: 'DELETE',
    });
    if (result.error) {
      throw new Error(result.error || 'Failed to delete product');
    }
  },
};

// ============== ORDERS API ==============

export const ordersApi = {
  async getAll(): Promise<Order[]> {
    const result = await fetchWithAuth<Order[]>('/api/orders');
    if (result.error || !result.data) {
      console.warn('Could not fetch orders:', result.error);
      return [];
    }
    return result.data;
  },
  
  async getById(id: string): Promise<Order | null> {
    const result = await fetchWithAuth<Order>(`/api/orders/${id}`);
    return result.data;
  },
  
  async create(data: unknown): Promise<Order> {
    const result = await fetchWithAuth<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result.error || !result.data) {
      throw new Error(result.error || 'Failed to create order');
    }
    return result.data;
  },
  
  async updateStatus(id: string, status: string): Promise<Order> {
    const result = await fetchWithAuth<Order>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (result.error || !result.data) {
      throw new Error(result.error || 'Failed to update order status');
    }
    return result.data;
  },

  async processPayment(id: string, amount: number): Promise<Order> {
    const result = await fetchWithAuth<Order>(`/api/orders/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    if (result.error || !result.data) {
      throw new Error(result.error || 'Failed to process payment');
    }
    return result.data;
  },
};

// ============== DELIVERY API ==============

export const deliveryApi = {
  async getActiveRoutes(): Promise<Delivery[]> {
    const result = await fetchWithAuth<Delivery[]>('/api/delivery/routes/active');
    if (result.error || !result.data) {
      return [];
    }
    return result.data;
  },
  
  async getRoutes(): Promise<Delivery[]> {
    const result = await fetchWithAuth<Delivery[]>('/api/delivery/routes');
    if (result.error || !result.data) {
      return [];
    }
    return result.data;
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

// ============== FORECAST API ==============

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

// ============== AGENTIC AI API ==============

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
  
  // Route optimization for logistics
  async optimizeRoute(originId: string, destinationId: string) {
    return fetchWithAuth('/api/agentic/optimize-route', {
      method: 'POST',
      body: JSON.stringify({ originId, destinationId }),
    });
  },
  
  // Delivery planning
  async planDelivery(data: { originId: string; destinationId: string; items?: unknown[] }) {
    return fetchWithAuth('/api/agentic/plan-delivery', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============== HEALTH CHECK ==============

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export default {
  suppliers: suppliersApi,
  warehouse: warehouseApi,
  warehouseWithFallback: warehouseApiWithFallback,
  inventory: inventoryApi,
  orders: ordersApi,
  delivery: deliveryApi,
  forecast: forecastApi,
  agentic: agenticApi,
  checkHealth: checkApiHealth,
};