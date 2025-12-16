// ============================================================================
// SUPPLY CHAIN TYPES - Comprehensive Type Definitions
// Updated to match existing project requirements
// ============================================================================

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export type UserRole = 
  | 'owner' 
  | 'ceo' 
  | 'regional_manager' 
  | 'warehouse_manager' 
  | 'retail_seller';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string;
  countryCode: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isVerified: boolean;
  region?: string;
  authorizedWarehouseIds: string[];
  authorizedShopIds: string[];
  profilePhoto?: string;
  lastLoginAt?: Date;
}

export interface AuthSession {
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  permissions: Permission[];
}

export type Permission = 
  | 'view_all_locations'
  | 'view_assigned_locations'
  | 'manage_inventory'
  | 'manage_shipments'
  | 'approve_orders'
  | 'view_analytics'
  | 'manage_users'
  | 'system_admin';

// ============================================================================
// LOCATION TYPES
// ============================================================================

export type LocationType = 'warehouse' | 'shop' | 'supplier' | 'distributor';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  coordinates: Coordinates;
  region: string;
  capacity?: number;
  currentStock?: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: OperatingHours;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatingHours {
  monday: TimeRange | null;
  tuesday: TimeRange | null;
  wednesday: TimeRange | null;
  thursday: TimeRange | null;
  friday: TimeRange | null;
  saturday: TimeRange | null;
  sunday: TimeRange | null;
}

export interface TimeRange {
  open: string;
  close: string;
}

// ============================================================================
// WAREHOUSE TYPE
// ============================================================================

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  country?: string;
  capacity: number;
  currentStock: number;
  coordinates?: Coordinates;
  latitude: number;
  longitude: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// SUPPLIER TYPE
// ============================================================================

export interface Supplier {
  id: string;
  name: string;
  code?: string;
  type: 'manufacturer' | 'distributor' | 'wholesaler' | 'retailer';
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  country?: string;
  latitude: number;
  longitude: number;
  coordinates?: Coordinates;
  rating: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// PRODUCT TYPE
// ============================================================================

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  brand?: string;
  unitPrice: number;
  costPrice?: number;
  currency?: string;
  unit?: string;
  weight?: number;
  dimensions?: Dimensions;
  images?: string[];
  tags?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // Inventory-related fields - required for page.tsx compatibility
  warehouseId: string;
  locationId?: string;
  quantity: number;
  previousQuantity: number;
  quantityInStock: number;
  reorderLevel: number;
  reorderQuantity?: number;
  availableQuantity?: number;
  reservedQuantity?: number;
  lastCountDate?: Date;
  lastUpdated?: Date;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  unitPrice: number;
  costPrice?: number;
  currency?: string;
  unit?: string;
  weight?: number;
  // Inventory fields
  warehouseId: string;
  locationId?: string;
  quantity?: number;
  quantityInStock: number;
  reorderLevel: number;
  reorderQuantity?: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  previousQuantity?: number;
  isActive?: boolean;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in' | 'm';
}

// ============================================================================
// INVENTORY ITEM TYPE
// This combines Product + Inventory fields as your existing code expects
// ============================================================================

export interface InventoryItem {
  // Core identification
  id: string;
  productId?: string;
  locationId?: string;
  warehouseId: string;
  
  // Product fields (included for compatibility with existing code)
  sku: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  unitPrice: number;
  costPrice?: number;
  currency?: string;
  unit?: string;
  weight?: number;
  dimensions?: Dimensions;
  images?: string[];
  tags?: string[];
  isActive?: boolean;
  
  // Inventory/quantity fields - required for compatibility
  quantity: number;
  previousQuantity: number;
  quantityInStock: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  reorderLevel: number;
  reorderQuantity?: number;
  
  // Batch and tracking
  batchNumber?: string;
  expiryDate?: Date;
  lastCountDate?: Date;
  lastUpdated?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Optional nested objects
  product?: Product;
  location?: Location;
}

export interface StockMovement {
  id: string;
  productId: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  quantity: number;
  movementType: StockMovementType;
  reason: string;
  performedBy: string;
  timestamp: Date;
  reference?: string;
}

export type StockMovementType = 
  | 'inbound'
  | 'outbound'
  | 'transfer'
  | 'adjustment'
  | 'return'
  | 'damaged'
  | 'expired';

// ============================================================================
// SHIPMENT & LOGISTICS TYPES
// ============================================================================

export type TransportMode = 'truck' | 'flight' | 'train' | 'ship';
export type VehicleType = 'truck' | 'van' | 'bike' | 'car' | 'flight' | 'train' | 'ship';
export type ShipmentStatus = 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'delayed' | 'cancelled' | 'returned';
export type GoodsDirection = 'incoming' | 'outgoing';

export interface Shipment {
  id: string;
  trackingNumber: string;
  originId: string;
  originName: string;
  destinationId: string;
  destinationName: string;
  status: ShipmentStatus;
  direction: GoodsDirection;
  transportMode: TransportMode;
  carrierId: string;
  carrierName: string;
  vehicleId?: string;
  driverName?: string;
  driverPhone?: string;
  items: ShipmentItem[];
  totalWeight: number;
  totalVolume: number;
  totalValue: number;
  shippingCost: number;
  insuranceValue?: number;
  departureTime: Date;
  estimatedArrival: Date;
  actualArrival?: Date;
  currentLocation?: Coordinates;
  route: RoutePoint[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShipmentItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
}

export interface RoutePoint {
  location: Coordinates;
  timestamp: Date;
  status: string;
  notes?: string;
}

// ============================================================================
// DELIVERY TYPE
// ============================================================================

export interface Delivery {
  id: string;
  shipmentId: string;
  orderId?: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
  driverName: string;
  driverPhone: string;
  driverId?: string;
  vehicleId: string;
  vehicleType: VehicleType;
  currentLocation?: Coordinates;
  currentLatitude: number;
  currentLongitude: number;
  originAddress?: string;
  originLatitude?: number;
  originLongitude?: number;
  destinationAddress?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  route: Coordinates[];
  routePolyline?: string;
  estimatedArrival: Date;
  actualArrival?: Date;
  departureTime?: Date;
  distance?: number;
  duration?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Carrier {
  id: string;
  name: string;
  code: string;
  supportedModes: TransportMode[];
  rating: number;
  totalDeliveries: number;
  onTimeRate: number;
  pricePerKm: number;
  insuranceIncluded: boolean;
  gpsTracking: boolean;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  logo?: string;
  isActive: boolean;
}

// ============================================================================
// ROUTE OPTIMIZATION TYPES
// ============================================================================

export interface RouteOption {
  id: string;
  legs: RouteLeg[];
  totalDistance: number;
  totalDuration: number;
  totalCost: number;
  aiScore: number;
  carbonFootprint: number;
  reliability: number;
  isRecommended: boolean;
}

export interface RouteLeg {
  from: string;
  fromCoords: Coordinates;
  to: string;
  toCoords: Coordinates;
  mode: TransportMode;
  distance: number;
  duration: number;
  cost: number;
  carrierId?: string;
  carrierName?: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export type OrderStatus = 
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  shipmentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  totalPrice: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'gpay' | 'phonepe' | 'paytm' | 'card' | 'upi' | 'netbanking' | 'cod';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  consistencyToken: string;
  syncedToNodes: string[];
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

// ============================================================================
// AI & MONITORING TYPES
// ============================================================================

export type SeverityLevel = 'ok' | 'suspicious' | 'alert' | 'critical';
export type ActivityStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export type ActivityType = 
  | 'inventory_movement'
  | 'stock_level_change'
  | 'unusual_order_pattern'
  | 'delivery_delay'
  | 'gps_deviation'
  | 'unauthorized_access'
  | 'price_anomaly'
  | 'supplier_issue'
  | 'system_alert';

export interface AIActivity {
  id: string;
  timestamp: Date;
  type: ActivityType;
  severity: SeverityLevel;
  status: ActivityStatus;
  title: string;
  description: string;
  location?: string;
  entityId?: string;
  entityType?: 'warehouse' | 'shipment' | 'order' | 'product' | 'user';
  metrics?: ActivityMetric[];
  suggestedAction?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

export interface ActivityMetric {
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
}

// ============================================================================
// DEMAND FORECASTING TYPES
// ============================================================================

export interface DemandForecast {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  historicalAvgDaily: number;
  forecastedDemand: {
    next7Days: number;
    next30Days: number;
    next90Days: number;
  };
  demandRange: {
    min: number;
    max: number;
  };
  confidenceScore: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  seasonalFactor: number;
  reorderRecommendation: ReorderRecommendation;
  factors: string[];
}

export interface ReorderRecommendation {
  shouldReorder: boolean;
  recommendedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedStockoutDate?: Date;
}

export interface CompetitorInsight {
  competitorId: string;
  competitorName: string;
  productCategory: string;
  avgPrice: number;
  priceChange: number;
  estimatedSales: number;
  marketShare: number;
  lastUpdated: Date;
}

export interface MarketTrend {
  category: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  insight: string;
}

// ============================================================================
// BIDDING & MARKETPLACE TYPES
// ============================================================================

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';

export interface Bid {
  id: string;
  carrierId: string;
  carrierName: string;
  routeId: string;
  shipmentId?: string;
  amount: number;
  currency: string;
  estimatedDuration: number;
  status: BidStatus;
  submittedAt: Date;
  validUntil: Date;
  notes?: string;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface MarketplaceWarehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  coordinates: Coordinates;
  products: MarketplaceProduct[];
  rating: number;
  responseTime: string;
  fulfillmentRate: number;
  isVerified: boolean;
}

export interface MarketplaceProduct {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  minOrderQuantity?: number;
}

// ============================================================================
// REPORTING & ANALYTICS TYPES
// ============================================================================

export interface DashboardStats {
  totalProducts: number;
  totalInventoryValue: number;
  itemsInTransit: number;
  transitValue: number;
  delayedShipments: number;
  lowStockItems: number;
  ordersToday: number;
  revenueToday: number;
}

export interface SalesReport {
  period: string;
  startDate: Date;
  endDate: Date;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: TopProduct[];
  salesByRegion: RegionSales[];
  salesByCategory: CategorySales[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface RegionSales {
  region: string;
  sales: number;
  orders: number;
}

export interface CategorySales {
  category: string;
  sales: number;
  percentage: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: Pagination;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string | number | boolean>;
}

// ============================================================================
// REGISTRATION TYPES
// ============================================================================

export type DataUploadMethod = 'json' | 's3' | 'manual' | 'skip';

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  licensePhoto?: string;
  role: UserRole;
  businessName: string;
  businessRegistration?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: Coordinates;
  paymentMethods: PaymentMethod[];
  upiId?: string;
  dataUploadMethod: DataUploadMethod;
  s3Config?: S3Config;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
}

export interface S3Config {
  bucket: string;
  accessKey: string;
  secretKey: string;
  region?: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

export type WithId<T> = T & {
  id: string;
};