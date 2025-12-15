'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import InventoryChart, { type InventoryData } from "@/components/inventory-chart";
import { AlertCircle, PackageCheck, Truck, RefreshCw, Loader2 } from "lucide-react";
import LiveRoutesMap from '@/components/live-routes-map';
import RealTimeOrders, { type Order } from '@/components/real-time-orders';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { inventoryApi, ordersApi, warehouseApi, type Product, type Order as ApiOrder } from '@/lib/api';

// Transform API products to chart format
const transformToInventoryData = (products: Product[], warehouses: Map<string, string>): InventoryData[] => {
  const productMap = new Map<string, { warehouses: { name: string; total: number; previous: number }[] }>();
  
  products.forEach(product => {
    const warehouseName = warehouses.get(product.warehouseId) || `Warehouse ${product.warehouseId}`;
    
    if (!productMap.has(product.category)) {
      productMap.set(product.category, { warehouses: [] });
    }
    
    const entry = productMap.get(product.category)!;
    const existingWarehouse = entry.warehouses.find(w => w.name === warehouseName);
    
    if (existingWarehouse) {
      existingWarehouse.total += product.quantityInStock;
      existingWarehouse.previous += product.quantityInStock; // Will be updated with real previous data
    } else {
      entry.warehouses.push({
        name: warehouseName,
        total: product.quantityInStock,
        previous: product.quantityInStock,
      });
    }
  });
  
  return Array.from(productMap.entries()).map(([name, data]) => ({
    name,
    warehouses: data.warehouses,
  }));
};

// Transform API orders to UI format
const transformToOrders = (apiOrders: ApiOrder[]): Order[] => {
  return apiOrders.map(order => ({
    id: order.orderNumber || order.id,
    customerName: order.customerName,
    customerId: order.customerId,
    orderDate: order.orderDate?.split('T')[0] || new Date(order.createdAt).toISOString().split('T')[0],
    expectedDate: order.expectedDeliveryDate?.split('T')[0] || '',
    status: mapOrderStatus(order.status),
    deliveryType: order.deliveryType as 'Truck' | 'Train' | 'Flight',
    totalAmount: order.totalAmount,
    amountPaid: order.amountPaid,
    transitId: order.transitId || null,
  }));
};

const mapOrderStatus = (status: string): 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' => {
  const statusMap: Record<string, 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'> = {
    'Pending': 'Processing',
    'Processing': 'Processing',
    'Shipped': 'Shipped',
    'Delivered': 'Delivered',
    'Cancelled': 'Cancelled',
  };
  return statusMap[status] || 'Processing';
};

const calculateTotal = (data: InventoryData[]) => 
  data.reduce((sum, item) => sum + item.warehouses.reduce((wSum, w) => wSum + w.total, 0), 0);

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [totalInventory, setTotalInventory] = useState(0);
  const [previousInventory, setPreviousInventory] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [warehouseMap, setWarehouseMap] = useState<Map<string, string>>(new Map());
  
  const previousInventoryRef = useRef<Map<string, number>>(new Map());

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    
    try {
      // Fetch warehouses first to get names
      let warehouses: Map<string, string> = warehouseMap;
      if (warehouseMap.size === 0) {
        try {
          const warehouseData = await warehouseApi.getAll();
          warehouses = new Map(warehouseData.map(w => [w.id, w.name]));
          setWarehouseMap(warehouses);
        } catch (e) {
          console.warn('Could not fetch warehouses, using IDs as names');
        }
      }

      // Fetch products and orders in parallel
      const [products, apiOrders] = await Promise.all([
        inventoryApi.getAll().catch(() => []),
        ordersApi.getAll().catch(() => []),
      ]);

      // Transform and set inventory data
      const newInventoryData = transformToInventoryData(products, warehouses);
      
      // Calculate previous totals for change tracking
      const newTotal = calculateTotal(newInventoryData);
      const prevTotal = previousInventoryRef.current.get('total') || newTotal;
      
      // Update previous values in inventory data
      newInventoryData.forEach(item => {
        item.warehouses.forEach(w => {
          const key = `${item.name}-${w.name}`;
          const prevValue = previousInventoryRef.current.get(key);
          if (prevValue !== undefined) {
            w.previous = prevValue;
          }
          previousInventoryRef.current.set(key, w.total);
        });
      });
      previousInventoryRef.current.set('total', newTotal);

      setPreviousInventory(prevTotal);
      setTotalInventory(newTotal);
      setInventoryData(newInventoryData);

      // Transform and set orders
      const transformedOrders = transformToOrders(apiOrders);
      setOrders(transformedOrders);

      // Calculate anomalies (low stock items)
      const lowStockCount = products.filter(p => p.quantityInStock <= p.reorderLevel).length;
      setAnomalyCount(lowStockCount);

      if (isRefresh) {
        toast({ title: "Dashboard Refreshed", description: "Data updated successfully." });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data. Using cached data.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [warehouseMap, toast]);

  // Initial load and polling
  useEffect(() => {
    fetchDashboardData();

    // Poll for updates every 30 seconds
    const pollInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [fetchDashboardData]);

  // Handle new order from logistics page
  useEffect(() => {
    if (searchParams.has('newOrder')) {
      fetchDashboardData(true);
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({...window.history.state, as: newUrl, url: newUrl}, '', newUrl);
    }
  }, [searchParams, fetchDashboardData]);

  // Handle payment
  const handlePayment = async (orderId: string, amount: number) => {
    try {
      await ordersApi.processPayment(orderId, amount);
      
      // Update local state
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          const newAmountPaid = Math.min(order.totalAmount, order.amountPaid + amount);
          return { ...order, amountPaid: newAmountPaid };
        }
        return order;
      }));
      
      toast({
        title: "Payment Processed",
        description: `Payment of $${amount.toFixed(2)} recorded for order ${orderId}.`,
      });
    } catch (error) {
      console.error('Payment failed:', error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "Could not process payment. Please try again.",
      });
    }
  };

  // Calculate stats
  const inventoryChange = totalInventory - previousInventory;
  const percentageChange = previousInventory === 0 ? 0 : (inventoryChange / previousInventory) * 100;
  const changeColor = inventoryChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
  const changePrefix = inventoryChange >= 0 ? '+' : '';
  const shippedCount = orders.filter(o => o.status === 'Shipped').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInventory.toLocaleString()} units</div>
            <p className={`text-xs ${changeColor}`}>
              {changePrefix}{inventoryChange.toLocaleString()} ({changePrefix}{percentageChange.toFixed(2)}%)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deliveries In-Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shippedCount}</div>
            <p className="text-xs text-muted-foreground">
              {orders.length} total orders
            </p>
          </CardContent>
        </Card>
        
        <Link href="/operations">
          <Card className={`border-destructive text-destructive transition-all hover:bg-destructive/10 ${anomalyCount === 0 ? 'border-green-500 text-green-600' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {anomalyCount > 0 ? 'Low Stock Alerts' : 'Stock Status'}
              </CardTitle>
              <AlertCircle className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{anomalyCount}</div>
              <p className={`text-xs ${anomalyCount > 0 ? 'text-destructive/80' : 'text-green-600/80'}`}>
                {anomalyCount > 0 ? 'Items need reorder' : 'All stock levels healthy'}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts and Map */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Inventory Levels</CardTitle>
            <CardDescription>Current stock levels by category across warehouses.</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryData.length > 0 ? (
              <InventoryChart data={inventoryData} view="admin" />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No inventory data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Delivery Routes</CardTitle>
            <CardDescription>Real-time location of in-transit deliveries.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[300px] w-full overflow-hidden rounded-lg">
              <LiveRoutesMap orders={orders} selectedOrderId={selectedOrderId} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Overview of all orders and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <RealTimeOrders 
              orders={orders} 
              onOrderSelect={setSelectedOrderId} 
              selectedOrderId={selectedOrderId}
              onPayDue={handlePayment}
            />
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No orders found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DashboardPageContent />
    </React.Suspense>
  );
}