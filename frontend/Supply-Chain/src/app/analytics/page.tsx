'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Package, ShoppingCart, Truck, Warehouse, DollarSign, AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  revenue: { month: string; value: number }[];
  orders: { month: string; value: number }[];
  categories: { name: string; value: number; color: string }[];
  topProducts: { name: string; units: number; revenue: number }[];
}

const demoAnalytics: AnalyticsData = {
  revenue: [
    { month: 'Jul', value: 18.5 },
    { month: 'Aug', value: 21.2 },
    { month: 'Sep', value: 19.8 },
    { month: 'Oct', value: 24.1 },
    { month: 'Nov', value: 22.5 },
    { month: 'Dec', value: 24.5 },
  ],
  orders: [
    { month: 'Jul', value: 2100 },
    { month: 'Aug', value: 2350 },
    { month: 'Sep', value: 2200 },
    { month: 'Oct', value: 2600 },
    { month: 'Nov', value: 2450 },
    { month: 'Dec', value: 2847 },
  ],
  categories: [
    { name: 'Grains', value: 35, color: '#3B82F6' },
    { name: 'Pulses', value: 25, color: '#10B981' },
    { name: 'Oils', value: 20, color: '#F59E0B' },
    { name: 'Sweeteners', value: 12, color: '#EF4444' },
    { name: 'Others', value: 8, color: '#8B5CF6' },
  ],
  topProducts: [
    { name: 'Basmati Rice Premium', units: 4500, revenue: 382500 },
    { name: 'Organic Wheat Flour', units: 3200, revenue: 144000 },
    { name: 'Toor Dal', units: 2800, revenue: 336000 },
    { name: 'Refined Sunflower Oil', units: 1500, revenue: 270000 },
    { name: 'Mustard Oil', units: 1200, revenue: 198000 },
  ],
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1y');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/analytics.json');
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          setAnalytics(demoAnalytics);
        }
      } catch {
        setAnalytics(demoAnalytics);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const maxRevenue = Math.max(...analytics.revenue.map(r => r.value));
  const maxOrders = Math.max(...analytics.orders.map(o => o.value));

  const kpiCards = [
    { label: 'Total Revenue', value: '₹24.5L', change: '+18.7%', positive: true, icon: DollarSign, color: 'blue' },
    { label: 'Total Orders', value: '2,847', change: '+12.5%', positive: true, icon: ShoppingCart, color: 'green' },
    { label: 'Active Deliveries', value: '156', change: '+8.2%', positive: true, icon: Truck, color: 'purple' },
    { label: 'Warehouse Utilization', value: '75%', change: '+5.3%', positive: true, icon: Warehouse, color: 'orange' },
    { label: 'Low Stock Items', value: '7', change: '-3', positive: true, icon: AlertTriangle, color: 'yellow' },
    { label: 'Avg Order Value', value: '₹8,600', change: '+4.2%', positive: true, icon: BarChart3, color: 'indigo' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500">Business performance and insights</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="1m">Last Month</option>
          <option value="3m">Last 3 Months</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last Year</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${colorMap[kpi.color]}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
            <p className="text-xl font-bold">{kpi.value}</p>
            <div className={`flex items-center gap-1 text-xs ${kpi.positive ? 'text-green-600' : 'text-red-600'}`}>
              {kpi.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {kpi.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend (₹ Lakhs)</h3>
          <div className="h-52 flex items-end justify-between gap-2 px-2">
            {analytics.revenue.map((item, idx) => {
              const heightPercent = (item.value / maxRevenue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end" style={{ height: '180px' }}>
                    <div 
                      className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600 min-h-[4px]"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Orders Trend</h3>
          <div className="h-52 flex items-end justify-between gap-2 px-2">
            {analytics.orders.map((item, idx) => {
              const heightPercent = (item.value / maxOrders) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end" style={{ height: '180px' }}>
                    <div 
                      className="w-full bg-green-500 rounded-t-md transition-all hover:bg-green-600 min-h-[4px]"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Sales by Category</h3>
          <div className="space-y-3">
            {analytics.categories.map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{cat.name}</span>
                  <span className="font-medium">{cat.value}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cat.value}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {analytics.topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.units.toLocaleString()} units</p>
                  </div>
                </div>
                <span className="font-semibold text-green-600">₹{(product.revenue / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
