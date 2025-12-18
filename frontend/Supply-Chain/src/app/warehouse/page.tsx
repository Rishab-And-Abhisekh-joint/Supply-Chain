'use client';

import React, { useState, useEffect } from 'react';
import { Warehouse, MapPin, User, Phone, Package, RefreshCw } from 'lucide-react';

interface WarehouseData {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  capacity: number;
  currentStock: number;
  manager: string;
  contact: string;
}

const demoWarehouses: WarehouseData[] = [
  { id: '1', name: 'Delhi Central Hub', code: 'W001', address: 'Industrial Area, Okhla Phase-2', city: 'New Delhi', capacity: 10000, currentStock: 7800, manager: 'Arun Mehta', contact: '+91 98765 43210' },
  { id: '2', name: 'Noida Warehouse', code: 'W002', address: 'Sector 63, Noida', city: 'Noida', capacity: 8000, currentStock: 5200, manager: 'Priya Sharma', contact: '+91 98765 43211' },
  { id: '3', name: 'Gurgaon Depot', code: 'W003', address: 'IMT Manesar', city: 'Gurgaon', capacity: 12000, currentStock: 9840, manager: 'Rahul Gupta', contact: '+91 98765 43212' },
  { id: '4', name: 'Faridabad Center', code: 'W004', address: 'Sector 27-D, Faridabad', city: 'Faridabad', capacity: 6000, currentStock: 3200, manager: 'Sunita Rao', contact: '+91 98765 43213' },
];

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/warehouses.json');
        if (response.ok) {
          const data = await response.json();
          setWarehouses(data);
        } else {
          setWarehouses(demoWarehouses);
        }
      } catch {
        setWarehouses(demoWarehouses);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity, 0);
  const totalStock = warehouses.reduce((sum, w) => sum + w.currentStock, 0);
  const avgUtilization = totalCapacity > 0 ? (totalStock / totalCapacity * 100).toFixed(1) : 0;

  const getUtilizationColor = (current: number, capacity: number) => {
    const percent = (current / capacity) * 100;
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUtilizationBadge = (current: number, capacity: number) => {
    const percent = (current / capacity) * 100;
    if (percent >= 90) return { text: 'Critical', color: 'bg-red-100 text-red-800' };
    if (percent >= 70) return { text: 'High', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Normal', color: 'bg-green-100 text-green-800' };
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
        <p className="text-gray-500">Monitor warehouse capacity and operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Warehouse className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Warehouses</p>
              <p className="text-2xl font-bold">{warehouses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Capacity</p>
              <p className="text-2xl font-bold">{(totalCapacity / 1000).toFixed(0)}K units</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Stock</p>
              <p className="text-2xl font-bold">{(totalStock / 1000).toFixed(1)}K units</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Warehouse className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Utilization</p>
              <p className="text-2xl font-bold">{avgUtilization}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {warehouses.map((warehouse) => {
          const utilization = (warehouse.currentStock / warehouse.capacity * 100).toFixed(1);
          const badge = getUtilizationBadge(warehouse.currentStock, warehouse.capacity);
          
          return (
            <div key={warehouse.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{warehouse.name}</h3>
                      <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{warehouse.code}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="w-4 h-4" />
                      {warehouse.address}, {warehouse.city}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>

                {/* Capacity Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Capacity Utilization</span>
                    <span className="font-medium">{utilization}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${getUtilizationColor(warehouse.currentStock, warehouse.capacity)}`}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{warehouse.currentStock.toLocaleString()} units</span>
                    <span>{warehouse.capacity.toLocaleString()} units max</span>
                  </div>
                </div>

                {/* Manager Info */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{warehouse.manager}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{warehouse.contact}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
