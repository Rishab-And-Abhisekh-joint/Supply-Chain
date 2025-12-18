'use client';

import React, { useState } from 'react';
import { Warehouse, Package, TrendingUp, AlertTriangle, MapPin, Search, Plus } from 'lucide-react';

const demoWarehouses = [
  { id: 'WH-001', name: 'Mumbai Central Hub', location: 'Mumbai, Maharashtra', capacity: 85, items: 12450, status: 'operational', manager: 'Rahul Mehta' },
  { id: 'WH-002', name: 'Delhi Distribution Center', location: 'Delhi NCR', capacity: 72, items: 8920, status: 'operational', manager: 'Priya Sharma' },
  { id: 'WH-003', name: 'Chennai Port Warehouse', location: 'Chennai, Tamil Nadu', capacity: 91, items: 15680, status: 'operational', manager: 'Karthik Rajan' },
  { id: 'WH-004', name: 'Kolkata Regional Hub', location: 'Kolkata, West Bengal', capacity: 45, items: 5230, status: 'maintenance', manager: 'Amit Das' },
  { id: 'WH-005', name: 'Bangalore Tech Park DC', location: 'Bangalore, Karnataka', capacity: 68, items: 9870, status: 'operational', manager: 'Sneha Patil' },
  { id: 'WH-006', name: 'Hyderabad Logistics Center', location: 'Hyderabad, Telangana', capacity: 78, items: 11200, status: 'operational', manager: 'Venkat Reddy' },
];

export default function WarehousesPage() {
  const [warehouses] = useState(demoWarehouses);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWarehouses = warehouses.filter(
    w => w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         w.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = warehouses.reduce((sum, w) => sum + w.items, 0);
  const avgCapacity = Math.round(warehouses.reduce((sum, w) => sum + w.capacity, 0) / warehouses.length);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
          <p className="text-gray-500">Monitor and manage warehouse operations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add Warehouse
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Warehouse className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Total Warehouses</span>
          </div>
          <p className="text-2xl font-bold">{warehouses.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Total Items</span>
          </div>
          <p className="text-2xl font-bold">{totalItems.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Avg Capacity</span>
          </div>
          <p className="text-2xl font-bold">{avgCapacity}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-500">In Maintenance</span>
          </div>
          <p className="text-2xl font-bold">{warehouses.filter(w => w.status === 'maintenance').length}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search warehouses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWarehouses.map((warehouse) => (
          <div key={warehouse.id} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Warehouse className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{warehouse.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {warehouse.location}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                warehouse.status === 'operational' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {warehouse.status}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Capacity</span>
                  <span className="font-medium">{warehouse.capacity}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-full rounded-full ${
                      warehouse.capacity > 85 ? 'bg-red-500' :
                      warehouse.capacity > 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${warehouse.capacity}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-500">Items Stored</span>
                <span className="font-medium">{warehouse.items.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Manager</span>
                <span className="font-medium">{warehouse.manager}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
