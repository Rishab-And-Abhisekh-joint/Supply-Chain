'use client';

import React, { useEffect, useState } from 'react';
import { analyticsApi, inventoryApi, ordersApi, warehouseApi, vehiclesApi } from '../../lib/api';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockCount: number;
  warehouseUtilization: number;
  activeDeliveries: number;
}

interface RevenueData {
  month: string;
  revenue: number;
}

interface OrderStatusData {
  status: string;
  count: number;
}

interface CategoryData {
  category: string;
  value: number;
  percentage: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('6m');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, revenue, orderStatus, categories, products] = await Promise.allSettled([
        analyticsApi.getDashboardStats(),
        analyticsApi.getRevenueByMonth(),
        analyticsApi.getOrdersByStatus(),
        analyticsApi.getCategoryDistribution(),
        analyticsApi.getTopProducts(),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (revenue.status === 'fulfilled') setRevenueData(revenue.value);
      if (orderStatus.status === 'fulfilled') setOrderStatusData(orderStatus.value);
      if (categories.status === 'fulfilled') setCategoryData(categories.value);
      if (products.status === 'fulfilled') setTopProducts(products.value);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      shipped: 'bg-purple-500',
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
  const totalCategoryValue = categoryData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500">Comprehensive overview of your supply chain performance</p>
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 font-medium">+12.5%</span>
            <span className="text-gray-400 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 font-medium">+8.3%</span>
            <span className="text-gray-400 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-blue-600 font-medium">Active SKUs</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.lowStockCount || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-red-600 font-medium">Needs attention</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Warehouse Util.</p>
              <p className="text-2xl font-bold text-gray-900">{(stats?.warehouseUtilization || 0).toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 rounded-full" 
                style={{ width: `${Math.min(stats?.warehouseUtilization || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeDeliveries || 0}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 font-medium">In transit</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-end gap-2">
            {revenueData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-colors cursor-pointer relative group"
                  style={{ height: `${(data.revenue / maxRevenue) * 200}px` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(data.revenue)}
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
          <div className="space-y-4">
            {orderStatusData.map((data, index) => {
              const percentage = totalOrderCount > 0 ? (data.count / totalOrderCount) * 100 : 0;
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{data.status}</span>
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
          {orderStatusData.length === 0 && (
            <p className="text-gray-500 text-center py-8">No order data available</p>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Category</h3>
          <div className="flex items-center gap-8">
            {/* Donut Chart Visualization */}
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
            <div className="flex-1 space-y-2">
              {categoryData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getCategoryColor(index)}`}></div>
                    <span className="text-sm text-gray-700">{data.category}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{data.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          {categoryData.length === 0 && (
            <p className="text-gray-500 text-center py-8">No category data available</p>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Revenue</h3>
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
                    <span className="text-xs text-gray-500">{product.quantity.toLocaleString()} units</span>
                  </div>
                </div>
              );
            })}
          </div>
          {topProducts.length === 0 && (
            <p className="text-gray-500 text-center py-8">No product data available</p>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">98.5%</p>
            <p className="text-sm text-gray-500">Order Fulfillment Rate</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">2.4 days</p>
            <p className="text-sm text-gray-500">Avg. Delivery Time</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">4.2x</p>
            <p className="text-sm text-gray-500">Inventory Turnover</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">4.8/5</p>
            <p className="text-sm text-gray-500">Customer Satisfaction</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="mt-6 flex justify-end gap-3">
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
              ['Total Products', stats?.totalProducts?.toString() || '0'],
              ['Low Stock Items', stats?.lowStockCount?.toString() || '0'],
              ['Warehouse Utilization', `${(stats?.warehouseUtilization || 0).toFixed(1)}%`],
              ['Active Deliveries', stats?.activeDeliveries?.toString() || '0'],
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
