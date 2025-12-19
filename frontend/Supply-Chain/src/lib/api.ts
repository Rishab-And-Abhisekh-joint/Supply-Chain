/**
 * Supply Chain API Service Layer
 * Connects to backend: https://api-gateway-o537.onrender.com
 * 
 * This file provides a complete API layer for all backend operations.
 * Replace your existing lib/api.ts with this file.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-gateway-o537.onrender.com';

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  createdAt?: string;
  updatedAt?: string;
}

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
  orderNumber: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress?: string;
  deliveryType?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export interface CreateOrderDto {
  customerId: string;
  customerName: string;
  items: OrderItem[];
  shippingAddress?: string;
  deliveryType?: string;
}

export interface Warehouse {
  id: string;
  code?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  currentUtilization: number;
  manager?: string;
  phone?: string;
  status: 'operational' | 'maintenance' | 'closed';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWarehouseDto {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  manager?: string;
  phone?: string;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  type: 'truck' | 'van' | 'bike';
  model?: string;
  driver: string;
  driverPhone?: string;
  status: 'moving' | 'delivering' | 'idle' | 'maintenance';
  currentLocation?: {
    lat: number;
    lng: number;
  };
  destination?: string;
  capacity: number;
  currentLoad: number;
  eta?: string;
  lastUpdated?: string;
}

export interface CreateVehicleDto {
  vehicleNumber: string;
  type: 'truck' | 'van' | 'bike';
  model?: string;
  driver: string;
  driverPhone?: string;
  capacity: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: string;
  avatar?: string;
}

export interface CreateTeamMemberDto {
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
}

export interface Notification {
  id: string;
  type: 'order' | 'delivery' | 'alert' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ForecastResult {
  productId: string;
  productName: string;
  predictions: {
    period: string;
    predictedDemand: number;
    confidenceLow: number;
    confidenceHigh: number;
  }[];
  accuracy: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: boolean;
  insights: string[];
}

export interface RouteOptimization {
  origin: string;
  destination: string;
  optimalRoute: string;
  estimatedTime: string;
  estimatedDistance: string;
  fuelCost?: number;
  alternativeRoutes?: {
    route: string;
    time: string;
    distance: string;
  }[];
}

export interface Supplier {
  id: string;
  name: string;
  type: 'manufacturer' | 'distributor' | 'wholesaler' | 'retailer';
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'inactive';
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Delivery {
  id: string;
  orderId?: string;
  vehicleId?: string;
  vehicleType?: string;
  driverName?: string;
  driverPhone?: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  origin: string;
  destination: string;
  currentLatitude?: number;
  currentLongitude?: number;
  estimatedArrival?: string;
  actualArrival?: string;
  route?: { lat: number; lng: number }[];
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Restore token from localStorage on init
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw { ...error, statusCode: response.status };
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw { ...error, statusCode: response.status };
    }

    return response.json();
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw { ...error, statusCode: response.status };
    }

    return response.json();
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw { ...error, statusCode: response.status };
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw { ...error, statusCode: response.status };
    }

    return response.json();
  }
}

const apiClient = new ApiClient(API_BASE_URL);

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const result = await apiClient.post<{ user: User; token: string }>('/api/auth/login', { email, password });
      apiClient.setToken(result.token);
      return result;
    } catch (error: any) {
      // Fallback for demo mode
      if (email === 'demo@example.com' && password === 'demo123') {
        const demoUser: User = {
          id: 'demo-user-1',
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User',
          role: 'admin',
        };
        const demoToken = 'demo-token-' + Date.now();
        apiClient.setToken(demoToken);
        return { user: demoUser, token: demoToken };
      }
      throw error;
    }
  },

  async signup(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
    company?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }): Promise<{ user: User; token: string }> {
    const result = await apiClient.post<{ user: User; token: string }>('/api/auth/signup', userData);
    apiClient.setToken(result.token);
    return result;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Ignore logout errors
    }
    apiClient.setToken(null);
  },

  async getMe(): Promise<{ user: User }> {
    return apiClient.get<{ user: User }>('/api/auth/me');
  },

  async updateProfile(userData: Partial<User>): Promise<{ user: User }> {
    return apiClient.put<{ user: User }>('/api/auth/update', userData);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.post('/api/auth/change-password', { currentPassword, newPassword });
  },

  setToken(token: string | null) {
    apiClient.setToken(token);
  },

  getToken(): string | null {
    return apiClient.getToken();
  },
};

// ============================================================================
// Inventory API
// ============================================================================

export const inventoryApi = {
  async getAll(): Promise<Product[]> {
    try {
      return await apiClient.get<Product[]>('/api/products');
    } catch (error) {
      console.warn('Failed to fetch products from API, using fallback');
      return getDemoInventory();
    }
  },

  async getById(id: string): Promise<Product> {
    return apiClient.get<Product>(`/api/products/${id}`);
  },

  async create(data: CreateProductDto): Promise<Product> {
    return apiClient.post<Product>('/api/products', data);
  },

  async update(id: string, data: Partial<CreateProductDto>): Promise<Product> {
    return apiClient.patch<Product>(`/api/products/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/products/${id}`);
  },

  async getLowStock(): Promise<Product[]> {
    try {
      return await apiClient.get<Product[]>('/api/products/low-stock');
    } catch {
      const products = await this.getAll();
      return products.filter(p => p.quantityInStock <= p.reorderLevel);
    }
  },

  async updateStock(id: string, quantity: number): Promise<Product> {
    return apiClient.patch<Product>(`/api/products/${id}/stock`, { quantity });
  },
};

// ============================================================================
// Orders API
// ============================================================================

export const ordersApi = {
  async getAll(): Promise<Order[]> {
    try {
      return await apiClient.get<Order[]>('/api/orders');
    } catch (error) {
      console.warn('Failed to fetch orders from API, using fallback');
      return getDemoOrders();
    }
  },

  async getById(id: string): Promise<Order> {
    return apiClient.get<Order>(`/api/orders/${id}`);
  },

  async create(data: CreateOrderDto): Promise<Order> {
    return apiClient.post<Order>('/api/orders', data);
  },

  async update(id: string, data: Partial<Order>): Promise<Order> {
    return apiClient.patch<Order>(`/api/orders/${id}`, data);
  },

  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    return apiClient.patch<Order>(`/api/orders/${id}/status`, { status });
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/orders/${id}`);
  },

  async getByStatus(status: Order['status']): Promise<Order[]> {
    try {
      return await apiClient.get<Order[]>(`/api/orders?status=${status}`);
    } catch {
      const orders = await this.getAll();
      return orders.filter(o => o.status === status);
    }
  },
};

// ============================================================================
// Warehouse API
// ============================================================================

export const warehouseApi = {
  async getAll(): Promise<Warehouse[]> {
    try {
      return await apiClient.get<Warehouse[]>('/api/warehouse');
    } catch (error) {
      console.warn('Failed to fetch warehouses from API, using fallback');
      return getDemoWarehouses();
    }
  },

  async getById(id: string): Promise<Warehouse> {
    return apiClient.get<Warehouse>(`/api/warehouse/${id}`);
  },

  async create(data: CreateWarehouseDto): Promise<Warehouse> {
    return apiClient.post<Warehouse>('/api/warehouse', data);
  },

  async update(id: string, data: Partial<CreateWarehouseDto>): Promise<Warehouse> {
    return apiClient.patch<Warehouse>(`/api/warehouse/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/warehouse/${id}`);
  },

  async getInventory(id: string): Promise<Product[]> {
    return apiClient.get<Product[]>(`/api/warehouse/${id}/inventory`);
  },
};

// ============================================================================
// Vehicles/Fleet API
// ============================================================================

export const vehiclesApi = {
  async getAll(): Promise<Vehicle[]> {
    try {
      return await apiClient.get<Vehicle[]>('/api/vehicles');
    } catch (error) {
      console.warn('Failed to fetch vehicles from API, using fallback');
      return getDemoVehicles();
    }
  },

  async getById(id: string): Promise<Vehicle> {
    return apiClient.get<Vehicle>(`/api/vehicles/${id}`);
  },

  async create(data: CreateVehicleDto): Promise<Vehicle> {
    return apiClient.post<Vehicle>('/api/vehicles', data);
  },

  async update(id: string, data: Partial<CreateVehicleDto>): Promise<Vehicle> {
    return apiClient.patch<Vehicle>(`/api/vehicles/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/vehicles/${id}`);
  },

  async updateLocation(id: string, location: { lat: number; lng: number }): Promise<Vehicle> {
    return apiClient.patch<Vehicle>(`/api/vehicles/${id}/location`, location);
  },

  async updateStatus(id: string, status: Vehicle['status']): Promise<Vehicle> {
    return apiClient.patch<Vehicle>(`/api/vehicles/${id}/status`, { status });
  },

  async getByStatus(status: Vehicle['status']): Promise<Vehicle[]> {
    try {
      return await apiClient.get<Vehicle[]>(`/api/vehicles?status=${status}`);
    } catch {
      const vehicles = await this.getAll();
      return vehicles.filter(v => v.status === status);
    }
  },
};

// ============================================================================
// Team API
// ============================================================================

export const teamApi = {
  async getAll(): Promise<TeamMember[]> {
    try {
      return await apiClient.get<TeamMember[]>('/api/team');
    } catch (error) {
      console.warn('Failed to fetch team from API, using fallback');
      return getDemoTeam();
    }
  },

  async getById(id: string): Promise<TeamMember> {
    return apiClient.get<TeamMember>(`/api/team/${id}`);
  },

  async create(data: CreateTeamMemberDto): Promise<TeamMember> {
    return apiClient.post<TeamMember>('/api/team', data);
  },

  async update(id: string, data: Partial<CreateTeamMemberDto>): Promise<TeamMember> {
    return apiClient.patch<TeamMember>(`/api/team/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/team/${id}`);
  },

  async updateStatus(id: string, status: TeamMember['status']): Promise<TeamMember> {
    return apiClient.patch<TeamMember>(`/api/team/${id}/status`, { status });
  },
};

// ============================================================================
// Notifications API
// ============================================================================

export const notificationsApi = {
  async getAll(): Promise<Notification[]> {
    try {
      return await apiClient.get<Notification[]>('/api/notifications');
    } catch (error) {
      console.warn('Failed to fetch notifications from API, using fallback');
      return getDemoNotifications();
    }
  },

  async markAsRead(id: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/api/notifications/${id}/read`, {});
  },

  async markAllAsRead(): Promise<void> {
    return apiClient.post('/api/notifications/mark-all-read');
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/notifications/${id}`);
  },

  async getUnreadCount(): Promise<number> {
    try {
      const result = await apiClient.get<{ count: number }>('/api/notifications/unread-count');
      return result.count;
    } catch {
      const notifications = await this.getAll();
      return notifications.filter(n => !n.read).length;
    }
  },
};

// ============================================================================
// Forecasting API
// ============================================================================

export const forecastApi = {
  async predict(data: {
    productId?: string;
    productName: string;
    historicalMonths: number;
    forecastHorizon: number;
  }): Promise<ForecastResult> {
    try {
      return await apiClient.post<ForecastResult>('/api/forecast/predict', data);
    } catch (error) {
      console.warn('Failed to get forecast from API, using fallback');
      return generateDemoForecast(data.productName, data.forecastHorizon);
    }
  },

  async getHistoricalData(productId: string): Promise<{ month: string; demand: number }[]> {
    try {
      return await apiClient.get(`/api/forecast/historical/${productId}`);
    } catch {
      return generateMockHistoricalData(12);
    }
  },
};

// ============================================================================
// Logistics Optimization API
// ============================================================================

export const logisticsApi = {
  async optimizeRoute(data: {
    origin: string;
    destination: string;
    vehicleType?: string;
  }): Promise<RouteOptimization> {
    try {
      return await apiClient.post<RouteOptimization>('/api/logistics/optimize', data);
    } catch (error) {
      console.warn('Failed to optimize route from API, using fallback');
      return generateDemoRoute(data.origin, data.destination);
    }
  },

  async getShipments(): Promise<any[]> {
    return apiClient.get('/api/shipments');
  },

  async createShipment(data: any): Promise<any> {
    return apiClient.post('/api/shipments', data);
  },

  async trackShipment(trackingNumber: string): Promise<any> {
    return apiClient.get(`/api/shipments/track/${trackingNumber}`);
  },
};

// ============================================================================
// Analytics API
// ============================================================================

export const analyticsApi = {
  async getDashboardStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    lowStockCount: number;
    warehouseUtilization: number;
    activeDeliveries: number;
  }> {
    try {
      return await apiClient.get('/api/analytics/dashboard');
    } catch {
      // Calculate from other APIs
      const [products, orders, warehouses, vehicles] = await Promise.allSettled([
        inventoryApi.getAll(),
        ordersApi.getAll(),
        warehouseApi.getAll(),
        vehiclesApi.getAll(),
      ]);

      const productsList = products.status === 'fulfilled' ? products.value : [];
      const ordersList = orders.status === 'fulfilled' ? orders.value : [];
      const warehousesList = warehouses.status === 'fulfilled' ? warehouses.value : [];
      const vehiclesList = vehicles.status === 'fulfilled' ? vehicles.value : [];

      return {
        totalRevenue: ordersList
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        totalOrders: ordersList.length,
        totalProducts: productsList.length,
        lowStockCount: productsList.filter(p => p.quantityInStock <= p.reorderLevel).length,
        warehouseUtilization: warehousesList.length > 0
          ? warehousesList.reduce((sum, w) => sum + w.currentUtilization, 0) / warehousesList.length
          : 0,
        activeDeliveries: vehiclesList.filter(v => v.status === 'delivering' || v.status === 'moving').length,
      };
    }
  },

  async getRevenueByMonth(): Promise<{ month: string; revenue: number }[]> {
    try {
      return await apiClient.get('/api/analytics/revenue-by-month');
    } catch {
      return [
        { month: 'Jul', revenue: 1850000 },
        { month: 'Aug', revenue: 2120000 },
        { month: 'Sep', revenue: 1980000 },
        { month: 'Oct', revenue: 2410000 },
        { month: 'Nov', revenue: 2250000 },
        { month: 'Dec', revenue: 2450000 },
      ];
    }
  },

  async getOrdersByStatus(): Promise<{ status: string; count: number }[]> {
    try {
      return await apiClient.get('/api/analytics/orders-by-status');
    } catch {
      const orders = await ordersApi.getAll();
      const statusMap = new Map<string, number>();
      orders.forEach(o => {
        statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);
      });
      return Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));
    }
  },

  async getCategoryDistribution(): Promise<{ category: string; value: number; percentage: number }[]> {
    try {
      return await apiClient.get('/api/analytics/category-distribution');
    } catch {
      const products = await inventoryApi.getAll();
      const categoryMap = new Map<string, number>();
      products.forEach(p => {
        const value = p.quantityInStock * p.unitPrice;
        categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + value);
      });
      const total = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
      return Array.from(categoryMap.entries()).map(([category, value]) => ({
        category,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }));
    }
  },

  async getTopProducts(): Promise<{ name: string; quantity: number; revenue: number }[]> {
    try {
      return await apiClient.get('/api/analytics/top-products');
    } catch {
      const products = await inventoryApi.getAll();
      return products
        .map(p => ({
          name: p.name,
          quantity: p.quantityInStock,
          revenue: p.quantityInStock * p.unitPrice,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    }
  },
};

// ============================================================================
// Suppliers API
// ============================================================================

export const suppliersApi = {
  async getAll(): Promise<Supplier[]> {
    try {
      return await apiClient.get('/api/suppliers');
    } catch {
      return getDemoSuppliers();
    }
  },

  async getActive(): Promise<Supplier[]> {
    try {
      const suppliers = await apiClient.get<Supplier[]>('/api/suppliers');
      return suppliers.filter((s: Supplier) => s.status === 'active');
    } catch {
      return getDemoSuppliers().filter(s => s.status === 'active');
    }
  },

  async getById(id: string): Promise<Supplier | null> {
    try {
      return await apiClient.get(`/api/suppliers/${id}`);
    } catch {
      return getDemoSuppliers().find(s => s.id === id) || null;
    }
  },

  async create(data: Partial<Supplier>): Promise<Supplier> {
    return await apiClient.post('/api/suppliers', data);
  },

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return await apiClient.patch(`/api/suppliers/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return await apiClient.delete(`/api/suppliers/${id}`);
  },
};

// ============================================================================
// Delivery API
// ============================================================================

export const deliveryApi = {
  async getAll(): Promise<Delivery[]> {
    try {
      return await apiClient.get('/api/deliveries');
    } catch {
      return getDemoDeliveries();
    }
  },

  async getActiveRoutes(): Promise<Delivery[]> {
    try {
      const deliveries = await apiClient.get<Delivery[]>('/api/deliveries/active');
      return deliveries;
    } catch {
      return getDemoDeliveries().filter(d => d.status === 'in_transit');
    }
  },

  async getById(id: string): Promise<Delivery | null> {
    try {
      return await apiClient.get(`/api/deliveries/${id}`);
    } catch {
      return getDemoDeliveries().find(d => d.id === id) || null;
    }
  },

  async updateStatus(id: string, status: Delivery['status']): Promise<Delivery> {
    return await apiClient.patch(`/api/deliveries/${id}/status`, { status });
  },

  async updateLocation(id: string, lat: number, lng: number): Promise<Delivery> {
    return await apiClient.patch(`/api/deliveries/${id}/location`, { 
      currentLatitude: lat, 
      currentLongitude: lng 
    });
  },
};

// ============================================================================
// Warehouse API with Fallback (for logistics)
// ============================================================================

export const warehouseApiWithFallback = {
  async getAll(): Promise<Warehouse[]> {
    try {
      return await apiClient.get('/api/warehouse');
    } catch {
      return getDemoWarehouses();
    }
  },

  async getActive(): Promise<Warehouse[]> {
    try {
      const warehouses = await apiClient.get<Warehouse[]>('/api/warehouse');
      return warehouses.filter((w: Warehouse) => w.status === 'operational');
    } catch {
      return getDemoWarehouses().filter(w => w.status === 'operational');
    }
  },

  async getById(id: string): Promise<Warehouse | null> {
    try {
      return await apiClient.get(`/api/warehouse/${id}`);
    } catch {
      return getDemoWarehouses().find(w => w.id === id) || null;
    }
  },
};

// ============================================================================
// Demo/Fallback Data
// ============================================================================

function getDemoInventory(): Product[] {
  return [
    { id: '1', sku: 'SKU001', name: 'Organic Wheat Flour', category: 'Grains', quantityInStock: 2500, reorderLevel: 500, unitPrice: 45, warehouseId: 'WH-001' },
    { id: '2', sku: 'SKU002', name: 'Basmati Rice Premium', category: 'Grains', quantityInStock: 1800, reorderLevel: 400, unitPrice: 85, warehouseId: 'WH-001' },
    { id: '3', sku: 'SKU003', name: 'Refined Sunflower Oil', category: 'Oils', quantityInStock: 320, reorderLevel: 300, unitPrice: 180, warehouseId: 'WH-002' },
    { id: '4', sku: 'SKU004', name: 'Toor Dal', category: 'Pulses', quantityInStock: 950, reorderLevel: 200, unitPrice: 120, warehouseId: 'WH-001' },
    { id: '5', sku: 'SKU005', name: 'Sugar (White)', category: 'Sweeteners', quantityInStock: 0, reorderLevel: 500, unitPrice: 42, warehouseId: 'WH-003' },
    { id: '6', sku: 'SKU006', name: 'Masoor Dal', category: 'Pulses', quantityInStock: 1200, reorderLevel: 300, unitPrice: 95, warehouseId: 'WH-002' },
    { id: '7', sku: 'SKU007', name: 'Mustard Oil', category: 'Oils', quantityInStock: 450, reorderLevel: 200, unitPrice: 165, warehouseId: 'WH-001' },
    { id: '8', sku: 'SKU008', name: 'Chickpeas (Kabuli)', category: 'Pulses', quantityInStock: 180, reorderLevel: 200, unitPrice: 110, warehouseId: 'WH-003' },
  ];
}

function getDemoOrders(): Order[] {
  return [
    { id: '1', orderNumber: 'ORD-2024-001', customerId: 'C001', customerName: 'Reliance Fresh', items: [{ productId: 'SKU001', productName: 'Organic Wheat Flour', quantity: 100, unitPrice: 45 }], totalAmount: 4500, status: 'delivered', createdAt: '2024-12-15' },
    { id: '2', orderNumber: 'ORD-2024-002', customerId: 'C002', customerName: 'BigBasket', items: [{ productId: 'SKU002', productName: 'Basmati Rice Premium', quantity: 200, unitPrice: 85 }], totalAmount: 17000, status: 'shipped', createdAt: '2024-12-16' },
    { id: '3', orderNumber: 'ORD-2024-003', customerId: 'C003', customerName: 'DMart', items: [{ productId: 'SKU003', productName: 'Refined Sunflower Oil', quantity: 50, unitPrice: 180 }], totalAmount: 18600, status: 'processing', createdAt: '2024-12-17' },
    { id: '4', orderNumber: 'ORD-2024-004', customerId: 'C004', customerName: "Spencer's", items: [{ productId: 'SKU006', productName: 'Masoor Dal', quantity: 150, unitPrice: 95 }], totalAmount: 14250, status: 'pending', createdAt: '2024-12-18' },
    { id: '5', orderNumber: 'ORD-2024-005', customerId: 'C005', customerName: 'More Supermarket', items: [{ productId: 'SKU007', productName: 'Mustard Oil', quantity: 75, unitPrice: 165 }], totalAmount: 12375, status: 'processing', createdAt: '2024-12-18' },
  ];
}

function getDemoWarehouses(): Warehouse[] {
  return [
    { id: 'WH-001', code: 'WH-001', name: 'Mumbai Central Hub', address: 'Andheri East', city: 'Mumbai', state: 'Maharashtra', latitude: 19.1136, longitude: 72.8697, capacity: 100000, currentUtilization: 85, manager: 'Rahul Mehta', status: 'operational' },
    { id: 'WH-002', code: 'WH-002', name: 'Delhi Distribution Center', address: 'Okhla Industrial', city: 'Delhi', state: 'Delhi', latitude: 28.5355, longitude: 77.2674, capacity: 80000, currentUtilization: 72, manager: 'Priya Sharma', status: 'operational' },
    { id: 'WH-003', code: 'WH-003', name: 'Chennai Port Warehouse', address: 'Ennore Port', city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707, capacity: 120000, currentUtilization: 91, manager: 'Karthik Rajan', status: 'operational' },
    { id: 'WH-004', code: 'WH-004', name: 'Kolkata Regional Hub', address: 'Salt Lake', city: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639, capacity: 60000, currentUtilization: 45, manager: 'Amit Das', status: 'maintenance' },
    { id: 'WH-005', code: 'WH-005', name: 'Bangalore Tech Park DC', address: 'Electronic City', city: 'Bangalore', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946, capacity: 75000, currentUtilization: 68, manager: 'Sneha Patil', status: 'operational' },
  ];
}

function getDemoSuppliers(): Supplier[] {
  return [
    { id: 'SUP-001', name: 'DTDC Hub', type: 'distributor', email: 'contact@dtdc.com', phone: '+91 98765 11111', address: 'Industrial Area', city: 'New York', state: 'NY', latitude: 40.7128, longitude: -74.0060, status: 'active', rating: 4.5 },
    { id: 'SUP-002', name: 'Blue Dart Warehouse', type: 'wholesaler', email: 'info@bluedart.com', phone: '+91 98765 22222', address: 'Logistics Park', city: 'Chicago', state: 'IL', latitude: 41.8781, longitude: -87.6298, status: 'active', rating: 4.3 },
    { id: 'SUP-003', name: 'FedEx Distribution', type: 'distributor', email: 'support@fedex.com', phone: '+91 98765 33333', address: 'Airport Road', city: 'Los Angeles', state: 'CA', latitude: 34.0522, longitude: -118.2437, status: 'active', rating: 4.7 },
    { id: 'SUP-004', name: 'DHL Express', type: 'manufacturer', email: 'help@dhl.com', phone: '+91 98765 44444', address: 'Central Business District', city: 'Houston', state: 'TX', latitude: 29.7604, longitude: -95.3698, status: 'active', rating: 4.4 },
    { id: 'SUP-005', name: 'UPS Logistics', type: 'retailer', email: 'customer@ups.com', phone: '+91 98765 55555', address: 'Shipping Center', city: 'Phoenix', state: 'AZ', latitude: 33.4484, longitude: -112.0740, status: 'inactive', rating: 4.1 },
  ];
}

function getDemoDeliveries(): Delivery[] {
  return [
    { 
      id: 'DEL-001', 
      orderId: 'ORD-2024-001', 
      vehicleType: 'truck',
      driverName: 'Rajesh Kumar',
      driverPhone: '+91 98765 12345',
      status: 'in_transit', 
      origin: 'Mumbai Central Hub', 
      destination: 'Delhi Distribution Center',
      currentLatitude: 28.6139,
      currentLongitude: 77.2090,
      estimatedArrival: '2024-12-20T18:30:00Z',
      route: [
        { lat: 19.1136, lng: 72.8697 },
        { lat: 23.0225, lng: 72.5714 },
        { lat: 26.9124, lng: 75.7873 },
        { lat: 28.5355, lng: 77.2674 }
      ]
    },
    { 
      id: 'DEL-002', 
      orderId: 'ORD-2024-002', 
      vehicleType: 'van',
      driverName: 'Amit Singh',
      driverPhone: '+91 98765 23456',
      status: 'in_transit', 
      origin: 'Delhi Distribution Center', 
      destination: 'Noida Warehouse',
      currentLatitude: 28.5355,
      currentLongitude: 77.3910,
      estimatedArrival: '2024-12-19T14:15:00Z',
      route: [
        { lat: 28.5355, lng: 77.2674 },
        { lat: 28.5355, lng: 77.3910 }
      ]
    },
    { 
      id: 'DEL-003', 
      orderId: 'ORD-2024-003', 
      vehicleType: 'truck',
      driverName: 'Suresh Yadav',
      driverPhone: '+91 98765 34567',
      status: 'delivered', 
      origin: 'Chennai Port Warehouse', 
      destination: 'Bangalore Tech Park DC',
      currentLatitude: 12.9716,
      currentLongitude: 77.5946,
      estimatedArrival: '2024-12-18T16:00:00Z',
      actualArrival: '2024-12-18T15:45:00Z',
      route: [
        { lat: 13.0827, lng: 80.2707 },
        { lat: 12.9716, lng: 77.5946 }
      ]
    },
  ];
}

function getDemoVehicles(): Vehicle[] {
  return [
    { id: '1', vehicleNumber: 'DL01AB1234', type: 'truck', driver: 'Rajesh Kumar', status: 'moving', currentLocation: { lat: 28.6139, lng: 77.2090 }, destination: 'Mumbai', capacity: 10000, currentLoad: 7500, eta: '18:30' },
    { id: '2', vehicleNumber: 'DL02CD5678', type: 'truck', driver: 'Amit Singh', status: 'delivering', currentLocation: { lat: 28.5355, lng: 77.3910 }, destination: 'Noida', capacity: 8000, currentLoad: 6000, eta: '14:15' },
    { id: '3', vehicleNumber: 'HR03EF9012', type: 'van', driver: 'Suresh Yadav', status: 'idle', currentLocation: { lat: 28.4595, lng: 77.0266 }, capacity: 3000, currentLoad: 0 },
    { id: '4', vehicleNumber: 'DL04GH3456', type: 'truck', driver: 'Vikram Sharma', status: 'moving', currentLocation: { lat: 28.7041, lng: 77.1025 }, destination: 'Gurgaon', capacity: 10000, currentLoad: 8500, eta: '15:45' },
    { id: '5', vehicleNumber: 'UP05IJ7890', type: 'van', driver: 'Prakash Verma', status: 'maintenance', currentLocation: { lat: 28.6692, lng: 77.4538 }, capacity: 3000, currentLoad: 0 },
  ];
}

function getDemoTeam(): TeamMember[] {
  return [
    { id: '1', name: 'Arun Mehta', email: 'arun.mehta@company.com', phone: '+91 98765 43210', role: 'Warehouse Manager', department: 'Operations', status: 'active', joinDate: '2022-03-15' },
    { id: '2', name: 'Priya Sharma', email: 'priya.sharma@company.com', phone: '+91 98765 43211', role: 'Logistics Coordinator', department: 'Logistics', status: 'active', joinDate: '2021-07-20' },
    { id: '3', name: 'Rahul Gupta', email: 'rahul.gupta@company.com', phone: '+91 98765 43212', role: 'Inventory Analyst', department: 'Operations', status: 'active', joinDate: '2023-01-10' },
    { id: '4', name: 'Sneha Patel', email: 'sneha.patel@company.com', phone: '+91 98765 43213', role: 'Supply Chain Manager', department: 'Management', status: 'active', joinDate: '2020-05-01' },
    { id: '5', name: 'Vikram Singh', email: 'vikram.singh@company.com', phone: '+91 98765 43214', role: 'Fleet Manager', department: 'Logistics', status: 'on-leave', joinDate: '2022-09-12' },
  ];
}

function getDemoNotifications(): Notification[] {
  return [
    { id: '1', type: 'order', title: 'New Order Received', message: 'Order #ORD-2847 from Fresh Mart has been placed', read: false, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: '2', type: 'delivery', title: 'Delivery Completed', message: 'Order #ORD-2845 has been delivered to Green Grocers', read: false, createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: '3', type: 'alert', title: 'Low Stock Alert', message: 'Basmati Rice Premium is running low (23 units remaining)', read: false, createdAt: new Date(Date.now() - 60 * 60000).toISOString() },
    { id: '4', type: 'system', title: 'System Update', message: 'Route optimization algorithm has been updated', read: true, createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString() },
  ];
}

function generateDemoForecast(productName: string, horizon: number): ForecastResult {
  const predictions = [];
  const baseDemand = 100 + Math.random() * 100;
  
  for (let i = 0; i < horizon; i++) {
    const demand = Math.round(baseDemand * (1 + Math.sin(i / 3) * 0.2 + Math.random() * 0.1));
    predictions.push({
      period: `Month ${i + 1}`,
      predictedDemand: demand,
      confidenceLow: Math.round(demand * 0.85),
      confidenceHigh: Math.round(demand * 1.15),
    });
  }

  return {
    productId: 'demo',
    productName,
    predictions,
    accuracy: 85 + Math.random() * 10,
    trend: 'increasing',
    seasonality: true,
    insights: [
      `Average monthly demand forecast: ${Math.round(baseDemand)} units`,
      'Demand shows an upward trend. Consider increasing inventory levels.',
      'Seasonal patterns detected - plan for Q4 peak demand.',
    ],
  };
}

function generateMockHistoricalData(months: number): { month: string; demand: number }[] {
  const data = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    data.push({
      month: monthStr,
      demand: Math.round(100 + Math.sin(i / 6 * Math.PI) * 20 + Math.random() * 15),
    });
  }
  
  return data;
}

function generateDemoRoute(origin: string, destination: string): RouteOptimization {
  const distance = 100 + Math.random() * 500;
  const hours = distance / 60;
  
  return {
    origin,
    destination,
    optimalRoute: `Take NH48 from ${origin} to ${destination} via expressway`,
    estimatedTime: `${Math.round(hours)} hours ${Math.round((hours % 1) * 60)} mins`,
    estimatedDistance: `${Math.round(distance)} km`,
    fuelCost: Math.round(distance * 8),
    alternativeRoutes: [
      {
        route: 'Via State Highway',
        time: `${Math.round(hours * 1.2)} hours`,
        distance: `${Math.round(distance * 1.1)} km`,
      },
    ],
  };
}

// ============================================================================
// Export API Client for direct use
// ============================================================================

export { apiClient, API_BASE_URL };