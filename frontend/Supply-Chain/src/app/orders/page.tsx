'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, Truck, Clock, CheckCircle, AlertCircle, 
  RefreshCw, Loader2, Eye, MapPin 
} from 'lucide-react';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  deliveryType: string;
  vehicleNumber?: string;
  driverName?: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

function getUserEmail(): string {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.email || 'demo@example.com';
      } catch {
        return 'demo@example.com';
      }
    }
  }
  return 'demo@example.com';
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString()}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = filter === 'all' ? '/api/orders' : `/api/orders?status=${filter}`;
      const response = await fetch(url, {
        headers: {
          'X-User-Email': getUserEmail(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setOrders(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders;

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">Manage and track all your orders</p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <p className="text-2xl font-bold">{orderStats.total}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter('pending')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <p className="text-2xl font-bold">{orderStats.pending}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter('processing')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-500">Processing</span>
            </div>
            <p className="text-2xl font-bold">{orderStats.processing}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter('shipped')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-500">Shipped</span>
            </div>
            <p className="text-2xl font-bold">{orderStats.shipped}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter('delivered')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-500">Delivered</span>
            </div>
            <p className="text-2xl font-bold">{orderStats.delivered}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'processing', 'shipped', 'delivered'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'all' ? 'All Orders' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Orders`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusInfo = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = statusInfo.icon;
                return (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Tracking: <span className="font-medium text-blue-600">{order.trackingNumber}</span></p>
                          <p>Customer: {order.customerName}</p>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{order.shippingAddress}</span>
                          </div>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">Items: </span>
                            {order.items.map((item, i) => (
                              <span key={i}>
                                {item.productName} x{item.quantity}
                                {i < order.items.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(order.createdAt)}
                        </p>
                        {order.vehicleNumber && (
                          <p className="text-xs text-gray-500 mt-1">
                            <Truck className="w-3 h-3 inline mr-1" />
                            {order.vehicleNumber}
                          </p>
                        )}
                        <Button variant="outline" size="sm" className="mt-2">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
