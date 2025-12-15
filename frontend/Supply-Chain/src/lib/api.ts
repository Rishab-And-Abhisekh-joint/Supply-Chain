// src/lib/api.ts
// Complete API layer for backend integration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ============================================================================
// Types
// ============================================================================

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
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

export interface Order {
  id: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  status: string;
  totalAmount: number;
  amountPaid: number;
  deliveryType: string;
  origin?: string;
  destination?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  transitId?: string;
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
  items: OrderItem[];
  deliveryType: string;
  origin?: string;
  destination?: string;
  totalAmount: number;
  amountPaid: number;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  driverName?: string;
  vehicleType?: string;
  status: string;
  currentLatitude?: number;
  currentLongitude?: number;
  estimatedArrival?: string;
  route?: { lat: number; lng: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface ForecastPrediction {
  month: string;
  predictedDemand: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastResult {
  productId: string;
  predictions: ForecastPrediction[];
  accuracy: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: boolean;
  insights: string[];
}

// ============================================================================
// API Error Handler
// ============================================================================

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text();
    let message = `API Error: ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      message = parsed.message || parsed.error || message;
    } catch {
      message = errorBody || message;
    }
    throw new ApiError(response.status, message);
  }
  
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}

// ============================================================================
// Inventory API
// ============================================================================

export const inventoryApi = {
  async getAll(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/api/inventory/products`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Product[]>(response);
  },

  async getById(id: string): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/api/inventory/products/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Product>(response);
  },

  async getBySku(sku: string): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/api/inventory/products/sku/${sku}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Product>(response);
  },

  async getByWarehouse(warehouseId: string): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/api/inventory/products/warehouse/${warehouseId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Product[]>(response);
  },

  async getLowStock(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/api/inventory/products/low-stock`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Product[]>(response);
  },

  async create(product: CreateProductDto): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/api/inventory/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return handleResponse<Product>(response);
  },

  async update(id: string, product: Partial<CreateProductDto>): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/api/inventory/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return handleResponse<Product>(response);
  },

  async updateStock(id: string, quantity: number): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/api/inventory/products/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    return handleResponse<Product>(response);
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/inventory/products/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    await handleResponse<void>(response);
  },
};

// ============================================================================
// Orders API
// ============================================================================

export const ordersApi = {
  async getAll(): Promise<Order[]> {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Order[]>(response);
  },

  async getById(id: string): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Order>(response);
  },

  async getByCustomer(customerId: string): Promise<Order[]> {
    const response = await fetch(`${API_BASE_URL}/api/orders/customer/${customerId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Order[]>(response);
  },

  async getByStatus(status: string): Promise<Order[]> {
    const response = await fetch(`${API_BASE_URL}/api/orders/status/${status}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Order[]>(response);
  },

  async create(order: CreateOrderDto): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return handleResponse<Order>(response);
  },

  async updateStatus(id: string, status: string): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Order>(response);
  },

  async processPayment(id: string, amount: number): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    return handleResponse<Order>(response);
  },

  async cancel(id: string): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Order>(response);
  },
};

// ============================================================================
// Warehouse API
// ============================================================================

export const warehouseApi = {
  async getAll(): Promise<Warehouse[]> {
    const response = await fetch(`${API_BASE_URL}/api/warehouse`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Warehouse[]>(response);
  },

  async getById(id: string): Promise<Warehouse> {
    const response = await fetch(`${API_BASE_URL}/api/warehouse/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Warehouse>(response);
  },

  async create(warehouse: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Promise<Warehouse> {
    const response = await fetch(`${API_BASE_URL}/api/warehouse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(warehouse),
    });
    return handleResponse<Warehouse>(response);
  },

  async update(id: string, warehouse: Partial<Warehouse>): Promise<Warehouse> {
    const response = await fetch(`${API_BASE_URL}/api/warehouse/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(warehouse),
    });
    return handleResponse<Warehouse>(response);
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/warehouse/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    await handleResponse<void>(response);
  },
};

// ============================================================================
// Delivery API
// ============================================================================

export const deliveryApi = {
  async getAll(): Promise<Delivery[]> {
    const response = await fetch(`${API_BASE_URL}/api/delivery`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Delivery[]>(response);
  },

  async getById(id: string): Promise<Delivery> {
    const response = await fetch(`${API_BASE_URL}/api/delivery/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Delivery>(response);
  },

  async getByOrder(orderId: string): Promise<Delivery> {
    const response = await fetch(`${API_BASE_URL}/api/delivery/order/${orderId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Delivery>(response);
  },

  async getActiveRoutes(): Promise<Delivery[]> {
    const response = await fetch(`${API_BASE_URL}/api/delivery/active`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Delivery[]>(response);
  },

  async updateLocation(id: string, lat: number, lng: number): Promise<Delivery> {
    const response = await fetch(`${API_BASE_URL}/api/delivery/${id}/location`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    });
    return handleResponse<Delivery>(response);
  },

  async updateStatus(id: string, status: string): Promise<Delivery> {
    const response = await fetch(`${API_BASE_URL}/api/delivery/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Delivery>(response);
  },

  async create(delivery: Partial<Delivery>): Promise<Delivery> {
    const response = await fetch(`${API_BASE_URL}/api/delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(delivery),
    });
    return handleResponse<Delivery>(response);
  },
};

// ============================================================================
// Forecast API
// ============================================================================

export const forecastApi = {
  async predict(params: {
    productId: string;
    productName: string;
    historicalMonths: number;
    forecastHorizon: number;
  }): Promise<ForecastResult> {
    const response = await fetch(`${API_BASE_URL}/api/forecast/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse<ForecastResult>(response);
  },

  async getHistorical(productId: string): Promise<{ month: string; demand: number }[]> {
    const response = await fetch(`${API_BASE_URL}/api/forecast/historical/${productId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<{ month: string; demand: number }[]>(response);
  },
};

// ============================================================================
// Logistics API
// ============================================================================

export const logisticsApi = {
  async optimizeRoute(origin: string, destination: string): Promise<{
    optimalRouteSummary: string;
    estimatedTime: string;
    estimatedDistance: string;
    reasoning: string;
    routeCoordinates?: { lat: number; lng: number }[];
  }> {
    const response = await fetch(`${API_BASE_URL}/api/logistics/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination }),
    });
    return handleResponse(response);
  },

  async getLocations(): Promise<{ name: string; address: string; coordinates?: { lat: number; lng: number } }[]> {
    const response = await fetch(`${API_BASE_URL}/api/logistics/locations`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },
};

// ============================================================================
// Events/Notifications API
// ============================================================================

export const eventsApi = {
  async getStream(): Promise<{ id: string; type: string; message: string; timestamp: string }[]> {
    const response = await fetch(`${API_BASE_URL}/api/events/stream`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  async analyzeAnomalies(eventStream: string): Promise<{
    anomalies: {
      summary: string;
      suggestedAction: string;
      severity?: 'low' | 'medium' | 'high';
      category?: string;
    }[];
  }> {
    const response = await fetch(`${API_BASE_URL}/api/agentic/analyze-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventStream }),
    });
    return handleResponse(response);
  },
};

// ============================================================================
// Notifications API
// ============================================================================

export const notificationsApi = {
  async send(params: {
    to: string;
    subject: string;
    body: string;
    type: 'email' | 'sms';
  }): Promise<{ success: boolean; messageId?: string }> {
    const response = await fetch(`${API_BASE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(response);
  },

  async getHistory(): Promise<{
    id: string;
    type: string;
    recipient: string;
    subject: string;
    sentAt: string;
    status: string;
  }[]> {
    const response = await fetch(`${API_BASE_URL}/api/notifications/history`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },
};

// ============================================================================
// Health Check
// ============================================================================

export const healthApi = {
  async check(): Promise<{ status: string; services: Record<string, string> }> {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },
};

// Export all APIs as default
export default {
  inventory: inventoryApi,
  orders: ordersApi,
  warehouse: warehouseApi,
  delivery: deliveryApi,
  forecast: forecastApi,
  logistics: logisticsApi,
  events: eventsApi,
  notifications: notificationsApi,
  health: healthApi,
};