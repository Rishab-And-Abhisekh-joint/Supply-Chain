// ============================================================================
// SUPPLY CHAIN API LAYER
// Returns data directly (not wrapped in ApiResponse) for compatibility
// ============================================================================

import type {
  User,
  UserRole,
  Location,
  LocationType,
  Product,
  CreateProductDto,
  InventoryItem,
  StockMovement,
  Shipment,
  ShipmentStatus,
  GoodsDirection,
  Order,
  OrderStatus,
  PaymentTransaction,
  PaymentStatus,
  Carrier,
  RouteOption,
  AIActivity,
  DemandForecast,
  Bid,
  Pagination,
  PaginatedRequest,
  DashboardStats,
  CompetitorInsight,
  MarketTrend,
  Coordinates,
  Delivery,
  Supplier,
  Warehouse,
} from '@/types/supply-chain-types';

// ============================================================================
// RE-EXPORT TYPES FOR CONVENIENCE
// ============================================================================

export type {
  User,
  UserRole,
  Location,
  LocationType,
  Product,
  CreateProductDto,
  InventoryItem,
  StockMovement,
  Shipment,
  ShipmentStatus,
  GoodsDirection,
  Order,
  OrderStatus,
  PaymentTransaction,
  PaymentStatus,
  Carrier,
  RouteOption,
  AIActivity,
  DemandForecast,
  Bid,
  Pagination,
  PaginatedRequest,
  DashboardStats,
  CompetitorInsight,
  MarketTrend,
  Coordinates,
  Delivery,
  Supplier,
  Warehouse,
};

// ============================================================================
// API CONFIGURATION
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// ============================================================================
// API CLIENT - Returns data directly
// ============================================================================

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An unknown error occurred');
      }

      // Return data directly - handle both {data: T} and T responses
      return (data.data !== undefined ? data.data : data) as T;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient(API_BASE_URL);

// ============================================================================
// AUTHORITY-BASED FILTERING
// ============================================================================

export function getLocationsForGoodsFlow(
  user: User,
  direction: GoodsDirection,
  allLocations: Location[]
): { origins: Location[]; destinations: Location[] } {
  if (user.role === 'owner' || user.role === 'ceo') {
    if (direction === 'incoming') {
      return {
        origins: allLocations.filter(l => l.type === 'supplier' || l.type === 'distributor'),
        destinations: allLocations.filter(l => l.type === 'warehouse'),
      };
    } else {
      return {
        origins: allLocations.filter(l => l.type === 'warehouse'),
        destinations: allLocations.filter(l => l.type === 'shop' || l.type === 'distributor'),
      };
    }
  }

  if (user.role === 'regional_manager') {
    const authorizedWarehouses = allLocations.filter(
      l => l.type === 'warehouse' && user.authorizedWarehouseIds.includes(l.id)
    );
    const authorizedShops = allLocations.filter(
      l => l.type === 'shop' && user.authorizedShopIds.includes(l.id)
    );
    
    if (direction === 'incoming') {
      return {
        origins: allLocations.filter(l => l.type === 'supplier' || l.type === 'distributor'),
        destinations: authorizedWarehouses,
      };
    } else {
      return {
        origins: authorizedWarehouses,
        destinations: authorizedShops,
      };
    }
  }

  if (user.role === 'warehouse_manager') {
    const myWarehouses = allLocations.filter(
      l => l.type === 'warehouse' && user.authorizedWarehouseIds.includes(l.id)
    );
    
    if (direction === 'incoming') {
      return {
        origins: allLocations.filter(l => l.type === 'supplier'),
        destinations: myWarehouses,
      };
    } else {
      return {
        origins: myWarehouses,
        destinations: allLocations.filter(l => l.type === 'shop'),
      };
    }
  }

  if (user.role === 'retail_seller') {
    const myShops = allLocations.filter(
      l => l.type === 'shop' && user.authorizedShopIds.includes(l.id)
    );
    
    return {
      origins: allLocations.filter(l => l.type === 'warehouse'),
      destinations: myShops,
    };
  }

  return { origins: [], destinations: [] };
}

export function filterShipmentsByAuthority(
  user: User,
  shipments: Shipment[]
): Shipment[] {
  if (user.role === 'owner' || user.role === 'ceo') {
    return shipments;
  }

  const authorizedLocationIds = [
    ...user.authorizedWarehouseIds,
    ...user.authorizedShopIds,
  ];

  return shipments.filter(
    s => authorizedLocationIds.includes(s.originId) || 
         authorizedLocationIds.includes(s.destinationId)
  );
}

export function hasPermission(
  user: User,
  action: string,
  resourceType?: string,
  resourceId?: string
): boolean {
  if (user.role === 'owner') return true;
  if (user.role === 'ceo') return action !== 'system_admin';

  if (user.role === 'regional_manager') {
    const allowedActions = ['view_assigned_locations', 'manage_inventory', 'manage_shipments', 'view_analytics'];
    if (!allowedActions.includes(action)) return false;
    if (resourceId) {
      return user.authorizedWarehouseIds.includes(resourceId) || user.authorizedShopIds.includes(resourceId);
    }
    return true;
  }

  if (user.role === 'warehouse_manager') {
    const allowedActions = ['view_assigned_locations', 'manage_inventory'];
    if (!allowedActions.includes(action)) return false;
    if (resourceId) return user.authorizedWarehouseIds.includes(resourceId);
    return true;
  }

  if (user.role === 'retail_seller') {
    const allowedActions = ['view_assigned_locations'];
    if (!allowedActions.includes(action)) return false;
    if (resourceId) return user.authorizedShopIds.includes(resourceId);
    return true;
  }

  return false;
}

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> {
    const response = await apiClient.post<{ user: User; token: string; refreshToken: string }>(
      '/auth/login',
      { email, password }
    );
    if (response.token) {
      apiClient.setAuthToken(response.token);
    }
    return response;
  },

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    countryCode: string;
    role: UserRole;
    businessName: string;
    licenseNumber: string;
  }): Promise<User> {
    return apiClient.post<User>('/auth/register', data);
  },

  async logout(): Promise<void> {
    await apiClient.post<void>('/auth/logout', {});
    apiClient.clearAuthToken();
  },

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    return apiClient.post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken });
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.patch<User>('/auth/me', data);
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return apiClient.post<void>('/auth/change-password', { oldPassword, newPassword });
  },
};

// ============================================================================
// LOCATIONS API
// ============================================================================

export const locationsApi = {
  async getAll(params?: PaginatedRequest): Promise<Location[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    return apiClient.get<Location[]>(`/locations?${queryParams}`);
  },

  async getById(id: string): Promise<Location> {
    return apiClient.get<Location>(`/locations/${id}`);
  },

  async create(data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
    return apiClient.post<Location>('/locations', data);
  },

  async update(id: string, data: Partial<Location>): Promise<Location> {
    return apiClient.patch<Location>(`/locations/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/locations/${id}`);
  },

  async getByType(type: LocationType): Promise<Location[]> {
    return apiClient.get<Location[]>(`/locations?type=${type}`);
  },

  async getByRegion(region: string): Promise<Location[]> {
    return apiClient.get<Location[]>(`/locations?region=${region}`);
  },

  async getNearby(coordinates: Coordinates, radiusKm: number): Promise<Location[]> {
    return apiClient.get<Location[]>(
      `/locations/nearby?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=${radiusKm}`
    );
  },
};

// ============================================================================
// PRODUCTS API
// ============================================================================

export const productsApi = {
  async getAll(params?: PaginatedRequest & { category?: string; search?: string }): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', Math.min(params.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE).toString());
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.category) queryParams.set('category', params.category);
    if (params?.search) queryParams.set('search', params.search);
    return apiClient.get<Product[]>(`/products?${queryParams}`);
  },

  async getById(id: string): Promise<Product> {
    return apiClient.get<Product>(`/products/${id}`);
  },

  async getBySku(sku: string): Promise<Product> {
    return apiClient.get<Product>(`/products/sku/${sku}`);
  },

  async create(data: CreateProductDto): Promise<Product> {
    return apiClient.post<Product>('/products', data);
  },

  async update(id: string, data: Partial<CreateProductDto>): Promise<Product> {
    return apiClient.patch<Product>(`/products/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/products/${id}`);
  },

  async getCategories(): Promise<string[]> {
    return apiClient.get<string[]>('/products/categories');
  },

  async bulkImport(products: CreateProductDto[]): Promise<{ imported: number; failed: number; errors: string[] }> {
    return apiClient.post<{ imported: number; failed: number; errors: string[] }>('/products/bulk-import', { products });
  },
};

// ============================================================================
// INVENTORY API - Returns Product[] for compatibility with existing code
// ============================================================================

export const inventoryApi = {
  // Returns Product[] as expected by existing code (page.tsx, forecasting-client.tsx)
  async getAll(params?: PaginatedRequest): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    return apiClient.get<Product[]>(`/inventory?${queryParams}`);
  },

  async getByLocation(locationId: string, params?: PaginatedRequest): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    queryParams.set('locationId', locationId);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    return apiClient.get<Product[]>(`/inventory?${queryParams}`);
  },

  async getByProduct(productId: string): Promise<Product[]> {
    return apiClient.get<Product[]>(`/inventory/product/${productId}`);
  },

  async getLowStock(threshold?: number): Promise<Product[]> {
    const params = threshold ? `?threshold=${threshold}` : '';
    return apiClient.get<Product[]>(`/inventory/low-stock${params}`);
  },

  async create(data: CreateProductDto): Promise<Product> {
    return apiClient.post<Product>('/inventory', data);
  },

  async update(id: string, data: Partial<Product>): Promise<Product> {
    return apiClient.patch<Product>(`/inventory/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/inventory/${id}`);
  },

  async updateStock(
    productId: string,
    locationId: string,
    data: { quantity: number; reason: string }
  ): Promise<Product> {
    return apiClient.post<Product>('/inventory/adjust', { productId, locationId, ...data });
  },

  async transferStock(data: {
    productId: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    reason?: string;
  }): Promise<void> {
    return apiClient.post<void>('/inventory/transfer', data);
  },

  async getMovementHistory(productId: string, locationId?: string): Promise<StockMovement[]> {
    const params = locationId ? `?locationId=${locationId}` : '';
    return apiClient.get<StockMovement[]>(`/inventory/movements/${productId}${params}`);
  },
};

// ============================================================================
// SUPPLIERS API
// ============================================================================

export const suppliersApi = {
  async getAll(params?: PaginatedRequest): Promise<Supplier[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    return apiClient.get<Supplier[]>(`/suppliers?${queryParams}`);
  },

  async getActive(): Promise<Supplier[]> {
    return apiClient.get<Supplier[]>('/suppliers?isActive=true');
  },

  async getById(id: string): Promise<Supplier> {
    return apiClient.get<Supplier>(`/suppliers/${id}`);
  },

  async create(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    return apiClient.post<Supplier>('/suppliers', data);
  },

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return apiClient.patch<Supplier>(`/suppliers/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/suppliers/${id}`);
  },
};

// ============================================================================
// WAREHOUSES API
// ============================================================================

export const warehouseApi = {
  async getAll(params?: PaginatedRequest): Promise<Warehouse[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    return apiClient.get<Warehouse[]>(`/warehouses?${queryParams}`);
  },

  async getActive(): Promise<Warehouse[]> {
    return apiClient.get<Warehouse[]>('/warehouses?isActive=true');
  },

  async getById(id: string): Promise<Warehouse> {
    return apiClient.get<Warehouse>(`/warehouses/${id}`);
  },

  async create(data: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Promise<Warehouse> {
    return apiClient.post<Warehouse>('/warehouses', data);
  },

  async update(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
    return apiClient.patch<Warehouse>(`/warehouses/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/warehouses/${id}`);
  },
};

// Warehouse API with fallback for error handling
export const warehouseApiWithFallback = {
  async getAll(): Promise<Warehouse[]> {
    try {
      return await apiClient.get<Warehouse[]>('/warehouses');
    } catch (error) {
      console.warn('Warehouse API failed, using fallback');
      return [];
    }
  },

  async getActive(): Promise<Warehouse[]> {
    try {
      return await apiClient.get<Warehouse[]>('/warehouses?isActive=true');
    } catch (error) {
      console.warn('Warehouse API failed, using fallback');
      return [];
    }
  },

  async getById(id: string): Promise<Warehouse> {
    return apiClient.get<Warehouse>(`/warehouses/${id}`);
  },

  async create(data: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Promise<Warehouse> {
    return apiClient.post<Warehouse>('/warehouses', data);
  },

  async update(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
    return apiClient.patch<Warehouse>(`/warehouses/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/warehouses/${id}`);
  },
};

// ============================================================================
// DELIVERY API
// ============================================================================

export const deliveryApi = {
  async getAll(params?: PaginatedRequest): Promise<Delivery[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    return apiClient.get<Delivery[]>(`/deliveries?${queryParams}`);
  },

  async getById(id: string): Promise<Delivery> {
    return apiClient.get<Delivery>(`/deliveries/${id}`);
  },

  async getActive(): Promise<Delivery[]> {
    return apiClient.get<Delivery[]>('/deliveries?status=in_transit');
  },

  async getActiveRoutes(): Promise<Delivery[]> {
    return apiClient.get<Delivery[]>('/deliveries/active-routes');
  },

  async create(data: Omit<Delivery, 'id' | 'createdAt' | 'updatedAt'>): Promise<Delivery> {
    return apiClient.post<Delivery>('/deliveries', data);
  },

  async update(id: string, data: Partial<Delivery>): Promise<Delivery> {
    return apiClient.patch<Delivery>(`/deliveries/${id}`, data);
  },

  async updateLocation(id: string, location: { lat: number; lng: number }): Promise<Delivery> {
    return apiClient.patch<Delivery>(`/deliveries/${id}/location`, {
      currentLatitude: location.lat,
      currentLongitude: location.lng,
      currentLocation: location,
    });
  },

  async updateStatus(id: string, status: string): Promise<Delivery> {
    return apiClient.patch<Delivery>(`/deliveries/${id}/status`, { status });
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/deliveries/${id}`);
  },
};

// ============================================================================
// SHIPMENTS API
// ============================================================================

export const shipmentsApi = {
  async getAll(params?: PaginatedRequest & {
    status?: ShipmentStatus;
    direction?: GoodsDirection;
    originId?: string;
    destinationId?: string;
  }): Promise<Shipment[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.direction) queryParams.set('direction', params.direction);
    if (params?.originId) queryParams.set('originId', params.originId);
    if (params?.destinationId) queryParams.set('destinationId', params.destinationId);
    return apiClient.get<Shipment[]>(`/shipments?${queryParams}`);
  },

  async getById(id: string): Promise<Shipment> {
    return apiClient.get<Shipment>(`/shipments/${id}`);
  },

  async getByTracking(trackingNumber: string): Promise<Shipment> {
    return apiClient.get<Shipment>(`/shipments/track/${trackingNumber}`);
  },

  async create(data: Omit<Shipment, 'id' | 'trackingNumber' | 'createdAt' | 'updatedAt'>): Promise<Shipment> {
    return apiClient.post<Shipment>('/shipments', data);
  },

  async updateStatus(id: string, status: ShipmentStatus, notes?: string): Promise<Shipment> {
    return apiClient.patch<Shipment>(`/shipments/${id}/status`, { status, notes });
  },

  async updateLocation(id: string, location: Coordinates): Promise<Shipment> {
    return apiClient.patch<Shipment>(`/shipments/${id}/location`, { location });
  },

  async cancel(id: string, reason: string): Promise<Shipment> {
    return apiClient.post<Shipment>(`/shipments/${id}/cancel`, { reason });
  },

  async getInTransit(): Promise<Shipment[]> {
    return apiClient.get<Shipment[]>('/shipments?status=in_transit');
  },

  async getDelayed(): Promise<Shipment[]> {
    return apiClient.get<Shipment[]>('/shipments/delayed');
  },
};

// ============================================================================
// ORDERS API
// ============================================================================

export const ordersApi = {
  async getAll(params?: PaginatedRequest & { status?: OrderStatus }): Promise<Order[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.set('status', params.status);
    return apiClient.get<Order[]>(`/orders?${queryParams}`);
  },

  async getById(id: string): Promise<Order> {
    return apiClient.get<Order>(`/orders/${id}`);
  },

  async create(data: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    return apiClient.post<Order>('/orders', data);
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return apiClient.patch<Order>(`/orders/${id}/status`, { status });
  },

  async cancel(id: string, reason: string): Promise<Order> {
    return apiClient.post<Order>(`/orders/${id}/cancel`, { reason });
  },
};

// ============================================================================
// PAYMENTS API
// ============================================================================

export const paymentsApi = {
  async create(data: {
    orderId: string;
    amount: number;
    currency: string;
    method: string;
  }): Promise<PaymentTransaction> {
    return apiClient.post<PaymentTransaction>('/payments', data);
  },

  async getById(id: string): Promise<PaymentTransaction> {
    return apiClient.get<PaymentTransaction>(`/payments/${id}`);
  },

  async getByOrder(orderId: string): Promise<PaymentTransaction[]> {
    return apiClient.get<PaymentTransaction[]>(`/payments/order/${orderId}`);
  },

  async processPayment(id: string, gatewayData: Record<string, unknown>): Promise<PaymentTransaction> {
    return apiClient.post<PaymentTransaction>(`/payments/${id}/process`, gatewayData);
  },

  async refund(id: string, amount?: number, reason?: string): Promise<PaymentTransaction> {
    return apiClient.post<PaymentTransaction>(`/payments/${id}/refund`, { amount, reason });
  },

  async syncPaymentStatus(id: string, status: PaymentStatus, consistencyToken: string): Promise<PaymentTransaction> {
    return apiClient.post<PaymentTransaction>(`/payments/${id}/sync`, { status, consistencyToken });
  },
};

// ============================================================================
// CARRIERS API
// ============================================================================

export const carriersApi = {
  async getAll(): Promise<Carrier[]> {
    return apiClient.get<Carrier[]>('/carriers');
  },

  async getById(id: string): Promise<Carrier> {
    return apiClient.get<Carrier>(`/carriers/${id}`);
  },

  async getByMode(mode: string): Promise<Carrier[]> {
    return apiClient.get<Carrier[]>(`/carriers?mode=${mode}`);
  },
};

// ============================================================================
// ROUTE OPTIMIZATION API
// ============================================================================

export const routesApi = {
  async findOptimalRoutes(data: {
    originId: string;
    destinationId: string;
    weight?: number;
    volume?: number;
    preferredModes?: string[];
    maxCost?: number;
    maxDuration?: number;
  }): Promise<RouteOption[]> {
    return apiClient.post<RouteOption[]>('/routes/optimize', data);
  },

  async calculateDistance(origin: Coordinates, destination: Coordinates): Promise<{ distance: number; duration: number }> {
    return apiClient.post<{ distance: number; duration: number }>('/routes/distance', { origin, destination });
  },
};

// ============================================================================
// AI MONITORING API
// ============================================================================

export const aiMonitoringApi = {
  async getActivities(params?: {
    severity?: string;
    status?: string;
    type?: string;
    limit?: number;
  }): Promise<AIActivity[]> {
    const queryParams = new URLSearchParams();
    if (params?.severity) queryParams.set('severity', params.severity);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.type) queryParams.set('type', params.type);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    return apiClient.get<AIActivity[]>(`/ai/activities?${queryParams}`);
  },

  async acknowledgeActivity(id: string): Promise<AIActivity> {
    return apiClient.post<AIActivity>(`/ai/activities/${id}/acknowledge`, {});
  },

  async resolveActivity(id: string, notes: string): Promise<AIActivity> {
    return apiClient.post<AIActivity>(`/ai/activities/${id}/resolve`, { notes });
  },

  async dismissActivity(id: string): Promise<AIActivity> {
    return apiClient.post<AIActivity>(`/ai/activities/${id}/dismiss`, {});
  },

  async getStats(): Promise<{
    total: number;
    critical: number;
    alert: number;
    suspicious: number;
    ok: number;
    acknowledged: number;
    resolved: number;
  }> {
    return apiClient.get('/ai/activities/stats');
  },
};

// ============================================================================
// DEMAND FORECASTING API
// ============================================================================

export const forecastingApi = {
  async getForecasts(params?: { category?: string; timeframe?: string }): Promise<DemandForecast[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.set('category', params.category);
    if (params?.timeframe) queryParams.set('timeframe', params.timeframe);
    return apiClient.get<DemandForecast[]>(`/forecasting/demand?${queryParams}`);
  },

  async getForecastByProduct(productId: string): Promise<DemandForecast> {
    return apiClient.get<DemandForecast>(`/forecasting/demand/${productId}`);
  },

  async getCompetitorInsights(category?: string): Promise<CompetitorInsight[]> {
    const params = category ? `?category=${category}` : '';
    return apiClient.get<CompetitorInsight[]>(`/forecasting/competitors${params}`);
  },

  async getMarketTrends(): Promise<MarketTrend[]> {
    return apiClient.get<MarketTrend[]>('/forecasting/trends');
  },

  async getReorderRecommendations(): Promise<DemandForecast[]> {
    return apiClient.get<DemandForecast[]>('/forecasting/reorder-recommendations');
  },
};

// ============================================================================
// BIDDING & MARKETPLACE API
// ============================================================================

export const marketplaceApi = {
  async searchWarehouses(params: {
    query?: string;
    city?: string;
    products?: string[];
    minRating?: number;
  }): Promise<Location[]> {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.set('query', params.query);
    if (params.city) queryParams.set('city', params.city);
    if (params.products) queryParams.set('products', params.products.join(','));
    if (params.minRating) queryParams.set('minRating', params.minRating.toString());
    return apiClient.get<Location[]>(`/marketplace/warehouses?${queryParams}`);
  },

  async createBid(data: {
    routeId: string;
    amount: number;
    estimatedDuration: number;
    notes?: string;
  }): Promise<Bid> {
    return apiClient.post<Bid>('/marketplace/bids', data);
  },

  async getBids(params?: { status?: string; routeId?: string }): Promise<Bid[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.routeId) queryParams.set('routeId', params.routeId);
    return apiClient.get<Bid[]>(`/marketplace/bids?${queryParams}`);
  },

  async acceptBid(id: string): Promise<Bid> {
    return apiClient.post<Bid>(`/marketplace/bids/${id}/accept`, {});
  },

  async rejectBid(id: string, reason: string): Promise<Bid> {
    return apiClient.post<Bid>(`/marketplace/bids/${id}/reject`, { reason });
  },

  async withdrawBid(id: string): Promise<Bid> {
    return apiClient.post<Bid>(`/marketplace/bids/${id}/withdraw`, {});
  },
};

// ============================================================================
// DASHBOARD & ANALYTICS API
// ============================================================================

export const analyticsApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/analytics/dashboard');
  },

  async getSalesReport(params: { startDate: string; endDate: string; groupBy?: string }): Promise<unknown> {
    const queryParams = new URLSearchParams();
    queryParams.set('startDate', params.startDate);
    queryParams.set('endDate', params.endDate);
    if (params.groupBy) queryParams.set('groupBy', params.groupBy);
    return apiClient.get(`/analytics/sales?${queryParams}`);
  },

  async getInventoryReport(locationId?: string): Promise<unknown> {
    const params = locationId ? `?locationId=${locationId}` : '';
    return apiClient.get(`/analytics/inventory${params}`);
  },

  async getShipmentReport(params: { startDate: string; endDate: string }): Promise<unknown> {
    const queryParams = new URLSearchParams();
    queryParams.set('startDate', params.startDate);
    queryParams.set('endDate', params.endDate);
    return apiClient.get(`/analytics/shipments?${queryParams}`);
  },

  async exportReport(type: string, format: 'csv' | 'xlsx' | 'pdf'): Promise<{ downloadUrl: string }> {
    return apiClient.get<{ downloadUrl: string }>(`/analytics/export/${type}?format=${format}`);
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatCurrency(value: number, currency = 'INR'): string {
  if (currency === 'INR') {
    if (value >= 1e9) return `₹${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
    if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
    if (value >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

export function formatNumber(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} mins`;
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}d ${remainingHours}h`;
}

export { apiClient };