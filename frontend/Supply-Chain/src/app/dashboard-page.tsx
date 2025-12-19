'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, ShoppingCart, Truck, TrendingUp, AlertTriangle, 
  RefreshCw, MapPin, Clock, CheckCircle, Warehouse,
  FileText, Send, BarChart3, Package2
} from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  code: string;
  status: 'moving' | 'delivering' | 'idle';
  location: string;
  eta?: string;
  position: { x: number; y: number };
}

interface WarehouseInfo {
  id: string;
  name: string;
  code: string;
  capacity: number;
  currentStock: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
}

// Demo data
const demoVehicles: Vehicle[] = [
  { id: '1', name: 'Truck Alpha', code: 'V001', status: 'moving', location: 'Delhi Hub', eta: '25 min', position: { x: 35, y: 45 } },
  { id: '2', name: 'Truck Beta', code: 'V002', status: 'delivering', location: 'Noida Center', eta: 'Arrived', position: { x: 55, y: 55 } },
  { id: '3', name: 'Truck Gamma', code: 'V003', status: 'moving', location: 'Gurgaon Depot', eta: '18 min', position: { x: 25, y: 65 } },
  { id: '4', name: 'Van Delta', code: 'V004', status: 'idle', location: 'Awaiting dispatch', position: { x: 50, y: 35 } },
  { id: '5', name: 'Truck Echo', code: 'V005', status: 'moving', location: 'Faridabad', eta: '32 min', position: { x: 45, y: 50 } },
  { id: '6', name: 'Van Foxtrot', code: 'V006', status: 'delivering', location: 'Dwarka', eta: '5 min', position: { x: 40, y: 70 } },
];

const demoWarehouses: WarehouseInfo[] = [
  { id: '1', name: 'Delhi Central Hub', code: 'W001', capacity: 10000, currentStock: 7800 },
  { id: '2', name: 'Noida Warehouse', code: 'W002', capacity: 8000, currentStock: 5200 },
  { id: '3', name: 'Gurgaon Depot', code: 'W003', capacity: 12000, currentStock: 9840 },
];

const demoAlerts: Alert[] = [
  { id: '1', type: 'warning', title: 'Low Stock Alert', message: 'Sunflower Oil below threshold', time: '10 min ago' },
  { id: '2', type: 'error', title: 'Out of Stock', message: 'Sugar (White) depleted', time: '25 min ago' },
  { id: '3', type: 'info', title: 'Delivery Complete', message: 'ORD-2024-001 delivered', time: '1 hour ago' },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'warehouses' | 'alerts'>('vehicles');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [vehicles] = useState(demoVehicles);
  const [warehouses] = useState(demoWarehouses);
  const [alerts] = useState(demoAlerts);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Total Orders', value: '2,847', change: '+12.5% from last month', positive: true, icon: ShoppingCart, color: 'bg-green-100 text-green-600' },
    { label: 'Active Deliveries', value: '156', change: '+8.2% from last month', positive: true, icon: Truck, color: 'bg-blue-100 text-blue-600' },
    { label: 'Revenue', value: '₹24.5L', change: '+18.7% from last month', positive: true, icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
    { label: 'Alerts', value: '7', change: '-3 from last month', positive: true, icon: AlertTriangle, color: 'bg-orange-100 text-orange-600' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving': return 'bg-green-500';
      case 'delivering': return 'bg-blue-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'moving': return '●';
      case 'delivering': return '●';
      case 'idle': return '●';
      default: return '●';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Real-time supply chain overview</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <button className="p-1 hover:bg-gray-100 rounded">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className={`text-sm mt-1 ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Tracking Map */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold">Live Tracking Map</h2>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Moving</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Delivering</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Idle</span>
            </div>
          </div>
          <div className="relative h-80 bg-gray-50 m-4 rounded-lg border">
            <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-sm border text-sm">
              <p className="font-medium">NCR Region - India</p>
              <p className="text-gray-500 text-xs">Delhi, Noida, Gurgaon</p>
            </div>
            {/* Vehicle markers */}
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${vehicle.position.x}%`, top: `${vehicle.position.y}%` }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white ${getStatusColor(vehicle.status)}`}>
                  <Truck className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
                  {vehicle.code}
                </span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                  <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {vehicle.name} - {vehicle.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-white rounded-xl border shadow-sm">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === 'vehicles' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
              }`}
            >
              <Truck className="w-4 h-4" /> Vehicles
            </button>
            <button
              onClick={() => setActiveTab('warehouses')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === 'warehouses' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
              }`}
            >
              <Warehouse className="w-4 h-4" /> Warehouses
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === 'alerts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
              }`}
            >
              <AlertTriangle className="w-4 h-4" /> Alerts
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {activeTab === 'vehicles' && vehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{vehicle.name}</p>
                  <p className="text-xs text-gray-500">{vehicle.code}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                    <MapPin className="w-3 h-3" />
                    {vehicle.location}
                    {vehicle.eta && vehicle.status !== 'idle' && (
                      <>
                        <Clock className="w-3 h-3 ml-2" />
                        {vehicle.eta}
                      </>
                    )}
                  </div>
                </div>
                <span className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`}></span>
              </div>
            ))}

            {activeTab === 'warehouses' && warehouses.map((warehouse) => (
              <div key={warehouse.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{warehouse.name}</p>
                    <p className="text-xs text-gray-500">{warehouse.code}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    (warehouse.currentStock / warehouse.capacity) > 0.8 ? 'bg-red-100 text-red-800' :
                    (warehouse.currentStock / warehouse.capacity) > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {Math.round((warehouse.currentStock / warehouse.capacity) * 100)}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Capacity</span>
                    <span>{warehouse.currentStock.toLocaleString()} / {warehouse.capacity.toLocaleString()} units</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-full rounded-full ${
                        (warehouse.currentStock / warehouse.capacity) > 0.8 ? 'bg-red-500' :
                        (warehouse.currentStock / warehouse.capacity) > 0.6 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${(warehouse.currentStock / warehouse.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'alerts' && alerts.map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border ${
                alert.type === 'error' ? 'bg-red-50 border-red-200' :
                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <p className={`font-medium text-sm ${
                  alert.type === 'error' ? 'text-red-800' :
                  alert.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>{alert.title}</p>
                <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions - FIXED LINKS */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/orders" className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition cursor-pointer">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">New Order</span>
          </Link>
          <Link href="/logistics" className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition cursor-pointer">
            <div className="p-3 bg-green-100 rounded-lg">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Dispatch</span>
          </Link>
          <Link href="/analytics" className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition cursor-pointer">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Reports</span>
          </Link>
          <Link href="/inventory" className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition cursor-pointer">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package2 className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Inventory</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
