'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  RefreshCw, Database, TrendingUp, TrendingDown, Package, 
  Truck, Warehouse, Users, DollarSign, AlertTriangle,
  ShoppingCart, Clock, CheckCircle, XCircle, BarChart3
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface UploadedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  items?: any[];
  createdAt?: string;
  paymentStatus?: string;
}

interface UploadedWarehouse {
  id: string;
  name: string;
  city: string;
  capacity: number;
  currentUtilization: number;
  status: string;
}

interface UploadedVehicle {
  id: string;
  vehicleNumber: string;
  type: string;
  status: string;
  driver?: string;
  capacity?: number;
  currentLocation?: string;
}

interface UploadedDelivery {
  id: string;
  orderId: string;
  status: string;
  progress?: number;
  estimatedDelivery?: string;
  actualDelivery?: string;
}

interface UploadedInventory {
  id: string;
  name: string;
  productName?: string;
  sku: string;
  category: string;
  currentStock?: number;
  quantityInStock?: number;
  reorderLevel?: number;
  reorderPoint?: number;
  price?: number;
  unitPrice?: number;
}

interface UploadedTeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
  warehouse?: string;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  warehouseUtilization: number;
  activeDeliveries: number;
  totalWarehouses: number;
  operationalWarehouses: number;
  totalVehicles: number;
  activeVehicles: number;
  totalTeamMembers: number;
  activeTeamMembers: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  inventoryValue: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

interface OrderStatusData {
  status: string;
  count: number;
}

interface CategoryData {
  category: string;
  value: number;
  percentage: number;
  count: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
  category: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getUserEmail(): string {
  if (typeof window === 'undefined') return 'demo@example.com';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.email || 'demo@example.com';
    }
  } catch {}
  return 'demo@example.com';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('loading');
  const [dateRange, setDateRange] = useState('6m');

  // Raw uploaded data
  const [uploadedOrders, setUploadedOrders] = useState<UploadedOrder[]>([]);
  const [uploadedWarehouses, setUploadedWarehouses] = useState<UploadedWarehouse[]>([]);
  const [uploadedVehicles, setUploadedVehicles] = useState<UploadedVehicle[]>([]);
  const [uploadedDeliveries, setUploadedDeliveries] = useState<UploadedDelivery[]>([]);
  const [uploadedInventory, setUploadedInventory] = useState<UploadedInventory[]>([]);
  const [uploadedTeam, setUploadedTeam] = useState<UploadedTeamMember[]>([]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    const userEmail = getUserEmail();
    const headers = { 'X-User-Email': userEmail };
    let hasUploadedData = false;

    try {
      // Fetch all uploaded data
      const [ordersRes, warehousesRes, vehiclesRes, deliveriesRes, inventoryRes, teamRes] = await Promise.all([
        fetch('/api/data?type=orders', { headers }).catch(() => null),
        fetch('/api/data?type=warehouses', { headers }).catch(() => null),
        fetch('/api/data?type=vehicles', { headers }).catch(() => null),
        fetch('/api/data?type=deliveries', { headers }).catch(() => null),
        fetch('/api/data?type=inventory', { headers }).catch(() => null),
        fetch('/api/data?type=team', { headers }).catch(() => null),
      ]);

      let orders: UploadedOrder[] = [];
      let warehouses: UploadedWarehouse[] = [];
      let vehicles: UploadedVehicle[] = [];
      let deliveries: UploadedDelivery[] = [];
      let inventory: UploadedInventory[] = [];
      let team: UploadedTeamMember[] = [];

      if (ordersRes?.ok) {
        const json = await ordersRes.json();
        if (json.success && json.data?.length > 0) {
          orders = json.data;
          hasUploadedData = true;
        }
      }

      if (warehousesRes?.ok) {
        const json = await warehousesRes.json();
        if (json.success && json.data?.length > 0) {
          warehouses = json.data;
          hasUploadedData = true;
        }
      }

      if (vehiclesRes?.ok) {
        const json = await vehiclesRes.json();
        if (json.success && json.data?.length > 0) {
          vehicles = json.data;
          hasUploadedData = true;
        }
      }

      if (deliveriesRes?.ok) {
        const json = await deliveriesRes.json();
        if (json.success && json.data?.length > 0) {
          deliveries = json.data;
          hasUploadedData = true;
        }
      }

      if (inventoryRes?.ok) {
        const json = await inventoryRes.json();
        if (json.success && json.data?.length > 0) {
          inventory = json.data;
          hasUploadedData = true;
        }
      }

      if (teamRes?.ok) {
        const json = await teamRes.json();
        if (json.success && json.data?.length > 0) {
          team = json.data;
          hasUploadedData = true;
        }
      }

      // Store raw data
      setUploadedOrders(orders);
      setUploadedWarehouses(warehouses);
      setUploadedVehicles(vehicles);
      setUploadedDeliveries(deliveries);
      setUploadedInventory(inventory);
      setUploadedTeam(team);

      // Calculate analytics from uploaded data
      calculateAnalytics(orders, warehouses, vehicles, deliveries, inventory, team);
      
      setDataSource(hasUploadedData ? 'user_data' : 'none');

    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
      setDataSource('none');
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateAnalytics = (
    orders: UploadedOrder[],
    warehouses: UploadedWarehouse[],
    vehicles: UploadedVehicle[],
    deliveries: UploadedDelivery[],
    inventory: UploadedInventory[],
    team: UploadedTeamMember[]
  ) => {
    // Calculate stats
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const totalProducts = inventory.length;
    
    const lowStockCount = inventory.filter(i => {
      const stock = i.currentStock ?? i.quantityInStock ?? 0;
      const reorder = i.reorderLevel ?? i.reorderPoint ?? 10;
      return stock > 0 && stock <= reorder;
    }).length;
    
    const outOfStockCount = inventory.filter(i => {
      const stock = i.currentStock ?? i.quantityInStock ?? 0;
      return stock === 0;
    }).length;

    const totalWarehouseCapacity = warehouses.reduce((sum, w) => sum + (w.capacity || 0), 0);
    const usedWarehouseCapacity = warehouses.reduce((sum, w) => sum + (w.currentUtilization || 0), 0);
    const warehouseUtilization = totalWarehouseCapacity > 0 
      ? (usedWarehouseCapacity / totalWarehouseCapacity) * 100 
      : 0;

    const activeDeliveries = deliveries.filter(d => 
      d.status === 'in_transit' || d.status === 'delivering' || d.status === 'picking_up'
    ).length;

    const operationalWarehouses = warehouses.filter(w => w.status === 'operational').length;
    
    const activeVehicles = vehicles.filter(v => 
      v.status === 'active' || v.status === 'in_transit' || v.status === 'on_route'
    ).length;

    const activeTeamMembers = team.filter(t => t.status === 'active').length;

    const pendingOrders = orders.filter(o => 
      o.status === 'pending' || o.status === 'processing' || o.status === 'confirmed'
    ).length;
    
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    const inventoryValue = inventory.reduce((sum, i) => {
      const stock = i.currentStock ?? i.quantityInStock ?? 0;
      const price = i.price ?? i.unitPrice ?? 0;
      return sum + (stock * price);
    }, 0);

    setStats({
      totalRevenue,
      totalOrders,
      totalProducts,
      lowStockCount,
      outOfStockCount,
      warehouseUtilization,
      activeDeliveries,
      totalWarehouses: warehouses.length,
      operationalWarehouses,
      totalVehicles: vehicles.length,
      activeVehicles,
      totalTeamMembers: team.length,
      activeTeamMembers,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      inventoryValue,
    });

    // Calculate order status distribution
    const statusCounts: Record<string, number> = {};
    orders.forEach(o => {
      const status = o.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    setOrderStatusData(Object.entries(statusCounts).map(([status, count]) => ({ status, count })));

    // Calculate category distribution from inventory
    const categoryCounts: Record<string, { count: number; value: number }> = {};
    inventory.forEach(i => {
      const category = i.category || 'Uncategorized';
      const stock = i.currentStock ?? i.quantityInStock ?? 0;
      const price = i.price ?? i.unitPrice ?? 0;
      if (!categoryCounts[category]) {
        categoryCounts[category] = { count: 0, value: 0 };
      }
      categoryCounts[category].count += 1;
      categoryCounts[category].value += stock * price;
    });
    
    const totalCategoryValue = Object.values(categoryCounts).reduce((sum, c) => sum + c.value, 0);
    setCategoryData(Object.entries(categoryCounts).map(([category, data]) => ({
      category,
      value: data.value,
      count: data.count,
      percentage: totalCategoryValue > 0 ? (data.value / totalCategoryValue) * 100 : 0,
    })));

    // Calculate top products by value
    const productValues = inventory.map(i => ({
      name: i.name || i.productName || 'Unknown',
      quantity: i.currentStock ?? i.quantityInStock ?? 0,
      revenue: (i.currentStock ?? i.quantityInStock ?? 0) * (i.price ?? i.unitPrice ?? 0),
      category: i.category || 'Uncategorized',
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    setTopProducts(productValues);

    // Calculate monthly revenue (group orders by month)
    const monthlyData: Record<string, { revenue: number; orders: number }> = {};
    orders.forEach(o => {
      let month = 'Unknown';
      if (o.createdAt) {
        const date = new Date(o.createdAt);
        month = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, orders: 0 };
      }
      monthlyData[month].revenue += o.totalAmount || 0;
      monthlyData[month].orders += 1;
    });
    setRevenueData(Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orders: data.orders,
    })));
  };

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics, dateRange]);

  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      processing: 'bg-blue-500',
      confirmed: 'bg-indigo-500',
      shipped: 'bg-purple-500',
      in_transit: 'bg-cyan-500',
      delivering: 'bg-teal-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getCategoryColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
  const totalOrderCount = orderStatusData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Data Source Banner */}
      <div className={`mb-6 p-3 rounded-lg flex items-center gap-3 ${
        dataSource === 'user_data' 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <Database className={`w-5 h-5 ${dataSource === 'user_data' ? 'text-green-600' : 'text-yellow-600'}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${dataSource === 'user_data' ? 'text-green-800' : 'text-yellow-800'}`}>
            {dataSource === 'user_data' 
              ? `Analytics based on your uploaded data`
              : 'No data uploaded. Upload JSON files in Settings → Data Management to see analytics.'
            }
          </p>
          {dataSource === 'user_data' && (
            <p className="text-xs text-green-600 mt-1">
              Sources: {uploadedOrders.length} orders, {uploadedInventory.length} products, {uploadedWarehouses.length} warehouses, {uploadedVehicles.length} vehicles, {uploadedTeam.length} team members
            </p>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500">Real-time insights from your supply chain data</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 font-medium">From {stats?.totalOrders || 0} orders</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm gap-2">
            <span className="text-yellow-600">{stats?.pendingOrders || 0} pending</span>
            <span className="text-green-600">{stats?.deliveredOrders || 0} delivered</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inventory Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-purple-600 font-medium">Value: {formatCurrency(stats?.inventoryValue || 0)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock Alert</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.lowStockCount || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-red-600 font-medium">{stats?.outOfStockCount || 0} out of stock</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Warehouses</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.operationalWarehouses || 0}/{stats?.totalWarehouses || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Warehouse className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 rounded-full" 
                style={{ width: `${Math.min(stats?.warehouseUtilization || 0, 100)}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">{(stats?.warehouseUtilization || 0).toFixed(1)}% utilized</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeDeliveries || 0}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Truck className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-indigo-600 font-medium">{stats?.activeVehicles || 0}/{stats?.totalVehicles || 0} vehicles active</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-cyan-100 rounded-lg">
            <Users className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Team Members</p>
            <p className="text-xl font-bold">{stats?.activeTeamMembers || 0}/{stats?.totalTeamMembers || 0} active</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Delivered Orders</p>
            <p className="text-xl font-bold text-green-600">{stats?.deliveredOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending Orders</p>
            <p className="text-xl font-bold text-yellow-600">{stats?.pendingOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Cancelled Orders</p>
            <p className="text-xl font-bold text-red-600">{stats?.cancelledOrders || 0}</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Period</h3>
          {revenueData.length > 0 ? (
            <div className="h-64 flex items-end gap-2">
              {revenueData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-colors cursor-pointer relative group"
                    style={{ height: `${Math.max((data.revenue / maxRevenue) * 200, 20)}px` }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {formatCurrency(data.revenue)}<br/>{data.orders} orders
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">{data.month}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No revenue data available</p>
                <p className="text-sm">Upload orders.json with createdAt dates</p>
              </div>
            </div>
          )}
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
          {orderStatusData.length > 0 ? (
            <div className="space-y-4">
              {orderStatusData.map((data, index) => {
                const percentage = totalOrderCount > 0 ? (data.count / totalOrderCount) * 100 : 0;
                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">{data.status.replace('_', ' ')}</span>
                      <span className="text-sm text-gray-500">{data.count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getStatusColor(data.status)} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No order data available</p>
                <p className="text-sm">Upload orders.json to see status distribution</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Category</h3>
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-8">
              {/* Donut Chart */}
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {categoryData.reduce((acc, data, index) => {
                    const startAngle = acc.totalAngle;
                    const angle = (data.percentage / 100) * 360;
                    const endAngle = startAngle + angle;
                    
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    
                    const x1 = 50 + 40 * Math.cos(startRad);
                    const y1 = 50 + 40 * Math.sin(startRad);
                    const x2 = 50 + 40 * Math.cos(endRad);
                    const y2 = 50 + 40 * Math.sin(endRad);
                    
                    const largeArcFlag = angle > 180 ? 1 : 0;
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];
                    
                    acc.paths.push(
                      <path
                        key={index}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={colors[index % colors.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    );
                    
                    acc.totalAngle = endAngle;
                    return acc;
                  }, { paths: [] as React.ReactNode[], totalAngle: 0 }).paths}
                  <circle cx="50" cy="50" r="25" fill="white" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{categoryData.length}</p>
                    <p className="text-xs text-gray-500">Categories</p>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex-1 space-y-2 max-h-40 overflow-y-auto">
                {categoryData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(index)}`}></div>
                      <span className="text-sm text-gray-700 truncate max-w-[120px]">{data.category}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{data.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No inventory data available</p>
                <p className="text-sm">Upload inventory.json to see categories</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Value</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => {
                const maxProductRevenue = Math.max(...topProducts.map(p => p.revenue), 1);
                const widthPercentage = (product.revenue / maxProductRevenue) * 100;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{product.name}</span>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(product.revenue)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                          style={{ width: `${widthPercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">{product.quantity.toLocaleString()} units</span>
                        <span className="text-xs text-gray-400">{product.category}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No product data available</p>
                <p className="text-sm">Upload inventory.json to see top products</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      {dataSource === 'user_data' && stats && stats.totalOrders > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalOrders > 0 
                  ? ((stats.deliveredOrders / stats.totalOrders) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-sm text-gray-500">Order Fulfillment Rate</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalVehicles > 0 
                  ? ((stats.activeVehicles / stats.totalVehicles) * 100).toFixed(0)
                  : 0}%
              </p>
              <p className="text-sm text-gray-500">Fleet Utilization</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                <Warehouse className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{(stats.warehouseUtilization || 0).toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Warehouse Utilization</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalOrders > 0 
                  ? formatCurrency(stats.totalRevenue / stats.totalOrders)
                  : '₹0'}
              </p>
              <p className="text-sm text-gray-500">Avg. Order Value</p>
            </div>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            const reportData = {
              generatedAt: new Date().toISOString(),
              dateRange,
              stats,
              revenueData,
              orderStatusData,
              categoryData,
              topProducts,
              sources: {
                orders: uploadedOrders.length,
                inventory: uploadedInventory.length,
                warehouses: uploadedWarehouses.length,
                vehicles: uploadedVehicles.length,
                team: uploadedTeam.length,
                deliveries: uploadedDeliveries.length,
              }
            };
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export JSON
        </button>
        <button
          onClick={() => {
            const headers = ['Metric', 'Value'];
            const rows = [
              ['Total Revenue', formatCurrency(stats?.totalRevenue || 0)],
              ['Total Orders', stats?.totalOrders?.toString() || '0'],
              ['Delivered Orders', stats?.deliveredOrders?.toString() || '0'],
              ['Pending Orders', stats?.pendingOrders?.toString() || '0'],
              ['Cancelled Orders', stats?.cancelledOrders?.toString() || '0'],
              ['Total Products', stats?.totalProducts?.toString() || '0'],
              ['Low Stock Items', stats?.lowStockCount?.toString() || '0'],
              ['Inventory Value', formatCurrency(stats?.inventoryValue || 0)],
              ['Warehouse Utilization', `${(stats?.warehouseUtilization || 0).toFixed(1)}%`],
              ['Active Deliveries', stats?.activeDeliveries?.toString() || '0'],
              ['Total Warehouses', stats?.totalWarehouses?.toString() || '0'],
              ['Total Vehicles', stats?.totalVehicles?.toString() || '0'],
              ['Team Members', stats?.totalTeamMembers?.toString() || '0'],
            ];
            const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-summary-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>
    </div>
  );
}