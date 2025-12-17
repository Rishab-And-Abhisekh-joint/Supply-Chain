// React Hooks for Order Management
// Location: frontend/src/hooks/use-orders.ts

import { useState, useEffect, useCallback } from 'react';
import {
  orderApi,
  Order,
  OrderStats,
  OrderFilterDto,
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  CancelOrderDto,
  ProcessPaymentDto,
  PaginatedOrders,
} from '@/lib/api/order-client';

// Hook for fetching orders with pagination
export function useOrders(initialFilters?: OrderFilterDto) {
  const [orders, setOrders] = useState<PaginatedOrders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilterDto>(initialFilters || {});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getOrders(filters);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateFilters = useCallback((newFilters: Partial<OrderFilterDto>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    orders,
    loading,
    error,
    filters,
    updateFilters,
    refetch: fetchOrders,
  };
}

// Hook for fetching a single order
export function useOrder(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getOrder(orderId);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
  };
}

// Hook for order statistics
export function useOrderStats() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getOrderStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// Hook for recent orders
export function useRecentOrders(limit: number = 10) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getRecentOrders(limit);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent orders');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
  };
}

// Hook for order mutations (create, update, cancel, etc.)
export function useOrderMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (data: CreateOrderDto): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const order = await orderApi.createOrder(data);
      return order;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrder = useCallback(async (id: string, data: UpdateOrderDto): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const order = await orderApi.updateOrder(id, data);
      return order;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, data: UpdateOrderStatusDto): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const order = await orderApi.updateOrderStatus(id, data);
      return order;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (id: string, data: CancelOrderDto): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const order = await orderApi.cancelOrder(id, data);
      return order;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const processPayment = useCallback(async (id: string, data: ProcessPaymentDto): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const order = await orderApi.processPayment(id, data);
      return order;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createOrder,
    updateOrder,
    updateStatus,
    cancelOrder,
    processPayment,
    clearError: () => setError(null),
  };
}

// Hook for customer orders
export function useCustomerOrders(customerId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!customerId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getCustomerOrders(customerId);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer orders');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
  };
}