// Frontend API Client for Order Service
// Location: frontend/src/lib/api/order-client.ts

import axios, { AxiosInstance, AxiosError } from 'axios';

// Types matching the backend DTOs
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  ON_HOLD = 'ON_HOLD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export enum DeliveryType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  SAME_DAY = 'SAME_DAY',
  PICKUP = 'PICKUP',
}

export interface OrderItem {
  id: string;
  productId: string;
  productSku?: string;
  productName: string;
  quantity: number;
  quantityFulfilled: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  status: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderDate: string;
  updatedAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  shippingAddress: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
  shippingZipCode?: string;
  deliveryType: DeliveryType;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  transitId?: string;
  trackingNumber?: string;
  notes?: string;
  isPriority: boolean;
  isGift: boolean;
  giftMessage?: string;
  items: OrderItem[];
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  unitPrice?: number;
  productName?: string;
  productSku?: string;
  discount?: number;
  notes?: string;
}

export interface CreateOrderDto {
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
  shippingZipCode?: string;
  billingAddress?: string;
  deliveryType?: DeliveryType;
  notes?: string;
  isPriority?: boolean;
  isGift?: boolean;
  giftMessage?: string;
  paymentMethod?: string;
  items: CreateOrderItemDto[];
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
  shippingZipCode?: string;
  notes?: string;
  internalNotes?: string;
  isPriority?: boolean;
  expectedDeliveryDate?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  reason?: string;
  internalNotes?: string;
}

export interface CancelOrderDto {
  reason: string;
  refund?: boolean;
  restockItems?: boolean;
}

export interface ProcessPaymentDto {
  amount: number;
  paymentMethod: string;
  paymentReference?: string;
}

export interface OrderFilterDto {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedOrders {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
}

// API Client Class
class OrderApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3002') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const message = (error.response?.data as any)?.message || error.message;
        console.error('Order API Error:', message);
        throw new Error(message);
      }
    );
  }

  // Set auth token for authenticated requests
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Create a new order
  async createOrder(data: CreateOrderDto): Promise<Order> {
    const response = await this.client.post<Order>('/orders', data);
    return response.data;
  }

  // Get all orders with filters
  async getOrders(filters?: OrderFilterDto): Promise<PaginatedOrders> {
    const response = await this.client.get<PaginatedOrders>('/orders', { params: filters });
    return response.data;
  }

  // Get recent orders
  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    const response = await this.client.get<Order[]>('/orders/recent', { params: { limit } });
    return response.data;
  }

  // Get order statistics
  async getOrderStats(): Promise<OrderStats> {
    const response = await this.client.get<OrderStats>('/orders/stats');
    return response.data;
  }

  // Get single order by ID
  async getOrder(id: string): Promise<Order> {
    const response = await this.client.get<Order>(`/orders/${id}`);
    return response.data;
  }

  // Get order by order number
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const response = await this.client.get<Order>(`/orders/number/${orderNumber}`);
    return response.data;
  }

  // Get orders by customer
  async getCustomerOrders(customerId: string): Promise<Order[]> {
    const response = await this.client.get<Order[]>(`/orders/customer/${customerId}`);
    return response.data;
  }

  // Update order
  async updateOrder(id: string, data: UpdateOrderDto): Promise<Order> {
    const response = await this.client.patch<Order>(`/orders/${id}`, data);
    return response.data;
  }

  // Update order status
  async updateOrderStatus(id: string, data: UpdateOrderStatusDto): Promise<Order> {
    const response = await this.client.patch<Order>(`/orders/${id}/status`, data);
    return response.data;
  }

  // Cancel order
  async cancelOrder(id: string, data: CancelOrderDto): Promise<Order> {
    const response = await this.client.post<Order>(`/orders/${id}/cancel`, data);
    return response.data;
  }

  // Process payment
  async processPayment(id: string, data: ProcessPaymentDto): Promise<Order> {
    const response = await this.client.post<Order>(`/orders/${id}/payment`, data);
    return response.data;
  }
}

// Export singleton instance
export const orderApi = new OrderApiClient();

// Export class for custom instances
export { OrderApiClient };

// Helper function to get status color for UI
export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'yellow',
    [OrderStatus.CONFIRMED]: 'blue',
    [OrderStatus.PROCESSING]: 'orange',
    [OrderStatus.PACKED]: 'purple',
    [OrderStatus.SHIPPED]: 'cyan',
    [OrderStatus.IN_TRANSIT]: 'teal',
    [OrderStatus.OUT_FOR_DELIVERY]: 'lime',
    [OrderStatus.DELIVERED]: 'green',
    [OrderStatus.CANCELLED]: 'red',
    [OrderStatus.REFUNDED]: 'pink',
    [OrderStatus.ON_HOLD]: 'gray',
  };
  return colors[status] || 'gray';
}

// Helper function to get payment status color for UI
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'yellow',
    [PaymentStatus.AUTHORIZED]: 'blue',
    [PaymentStatus.PAID]: 'green',
    [PaymentStatus.PARTIALLY_PAID]: 'orange',
    [PaymentStatus.REFUNDED]: 'purple',
    [PaymentStatus.FAILED]: 'red',
  };
  return colors[status] || 'gray';
}

// Helper to format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}