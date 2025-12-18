'use client';

import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, AlertTriangle, CheckCircle, XCircle, Upload, Download, RefreshCw } from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  warehouse: string;
  lastUpdated: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

// Demo data - replace with API call or import from data-service.ts
const demoInventory: InventoryItem[] = [
  { id: '1', sku: 'SKU001', name: 'Organic Wheat Flour', category: 'Grains', quantity: 2500, minStock: 500, maxStock: 5000, unitPrice: 45, warehouse: 'Delhi Central Hub', lastUpdated: '2024-12-18', status: 'in-stock' },
  { id: '2', sku: 'SKU002', name: 'Basmati Rice Premium', category: 'Grains', quantity: 1800, minStock: 400, maxStock: 4000, unitPrice: 85, warehouse: 'Noida Warehouse', lastUpdated: '2024-12-18', status: 'in-stock' },
  { id: '3', sku: 'SKU003', name: 'Refined Sunflower Oil', category: 'Oils', quantity: 320, minStock: 300, maxStock: 2000, unitPrice: 180, warehouse: 'Delhi Central Hub', lastUpdated: '2024-12-17', status: 'low-stock' },
  { id: '4', sku: 'SKU004', name: 'Toor Dal', category: 'Pulses', quantity: 950, minStock: 200, maxStock: 2500, unitPrice: 120, warehouse: 'Gurgaon Depot', lastUpdated: '2024-12-18', status: 'in-stock' },
  { id: '5', sku: 'SKU005', name: 'Sugar (White)', category: 'Sweeteners', quantity: 0, minStock: 500, maxStock: 3000, unitPrice: 42, warehouse: 'Delhi Central Hub', lastUpdated: '2024-12-16', status: 'out-of-stock' },
  { id: '6', sku: 'SKU006', name: 'Masoor Dal', category: 'Pulses', quantity: 1200, minStock: 300, maxStock: 2000, unitPrice: 95, warehouse: 'Noida Warehouse', lastUpdated: '2024-12-18', status: 'in-stock' },
  { id: '7', sku: 'SKU007', name: 'Mustard Oil', category: 'Oils', quantity: 450, minStock: 200, maxStock: 1500, unitPrice: 165, warehouse: 'Gurgaon Depot', lastUpdated: '2024-12-17', status: 'in-stock' },
  { id: '8', sku: 'SKU008', name: 'Chickpeas (Kabuli)', category: 'Pulses', quantity: 180, minStock: 200, maxStock: 1000, unitPrice: 110, warehouse: 'Delhi Central Hub', lastUpdated: '2024-12-18', status: 'low-stock' },
];

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Try to load from local JSON first, fallback to demo data
    const loadData = async () => {
      try {
        const response = await fetch('/data/inventory.json');
        if (response.ok) {
          const data = await response.json();
          setInventory(data);
        } else {
          setInventory(demoInventory);
        }
      } catch {
        setInventory(demoInventory);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const categories = ['all', ...new Set(inventory.map(item => item.category))];
  
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: inventory.length,
    inStock: inventory.filter(i => i.status === 'in-stock').length,
    lowStock: inventory.filter(i => i.status === 'low-stock').length,
    outOfStock: inventory.filter(i => i.status === 'out-of-stock').length,
    totalValue: inventory.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-stock': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'low-stock': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'out-of-stock': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'in-stock': 'bg-green-100 text-green-800',
      'low-stock': 'bg-yellow-100 text-yellow-800',
      'out-of-stock': 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {getStatusIcon(status)}
        {status.replace('-', ' ')}
      </span>
    );
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(inventory, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.json';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500">Track and manage your stock levels</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Stock</p>
              <p className="text-xl font-bold text-green-600">{stats.inStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-xl font-bold">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{item.sku}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <span className="font-medium">{item.quantity.toLocaleString()}</span>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                        <div 
                          className={`h-full rounded-full ${
                            item.quantity === 0 ? 'bg-red-500' :
                            item.quantity < item.minStock ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((item.quantity / item.maxStock) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">₹{item.unitPrice}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.warehouse}</td>
                  <td className="px-4 py-3 text-sm">{getStatusBadge(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Source Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📁 Load Your Own Data</h3>
        <p className="text-sm text-blue-800">
          Place your <code className="bg-blue-100 px-1 rounded">inventory.json</code> file in the <code className="bg-blue-100 px-1 rounded">/public/data/</code> folder to load real data.
          Or configure AWS S3 in your <code className="bg-blue-100 px-1 rounded">.env.local</code> file.
        </p>
      </div>
    </div>
  );
}
