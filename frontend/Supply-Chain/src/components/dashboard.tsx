'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Package, 
  Truck, 
  AlertTriangle,
  MapPin,
  Clock,
  BarChart3,
  Activity,
  Warehouse,
  RefreshCw
} from 'lucide-react';

// Types
interface Vehicle {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'moving' | 'idle' | 'delivering';
  speed: number;
  destination: string;
  eta: string;
}

interface WarehouseLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  utilization: number;
}

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

// Mock data for vehicles
const initialVehicles: Vehicle[] = [
  { id: 'V001', name: 'Truck Alpha', lat: 28.6139, lng: 77.2090, status: 'moving', speed: 45, destination: 'Delhi Hub', eta: '25 min' },
  { id: 'V002', name: 'Truck Beta', lat: 28.5355, lng: 77.3910, status: 'delivering', speed: 0, destination: 'Noida Center', eta: 'Arrived' },
  { id: 'V003', name: 'Truck Gamma', lat: 28.4595, lng: 77.0266, status: 'moving', speed: 52, destination: 'Gurgaon Depot', eta: '18 min' },
  { id: 'V004', name: 'Van Delta', lat: 28.6280, lng: 77.3649, status: 'idle', speed: 0, destination: 'Awaiting dispatch', eta: '-' },
  { id: 'V005', name: 'Truck Epsilon', lat: 28.5672, lng: 77.3211, status: 'moving', speed: 38, destination: 'Sector 62', eta: '12 min' },
  { id: 'V006', name: 'Van Zeta', lat: 28.4089, lng: 77.3178, status: 'moving', speed: 41, destination: 'Greater Noida', eta: '35 min' },
];

const warehouses: WarehouseLocation[] = [
  { id: 'W001', name: 'Delhi Central Hub', lat: 28.6139, lng: 77.2090, capacity: 10000, utilization: 78 },
  { id: 'W002', name: 'Noida Warehouse', lat: 28.5355, lng: 77.3910, capacity: 8000, utilization: 65 },
  { id: 'W003', name: 'Gurgaon Depot', lat: 28.4595, lng: 77.0266, capacity: 12000, utilization: 82 },
];

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'warehouses' | 'alerts'>('vehicles');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate vehicle movement
  const updateVehiclePositions = useCallback(() => {
    setVehicles(prev => prev.map(vehicle => {
      if (vehicle.status === 'moving') {
        return {
          ...vehicle,
          lat: vehicle.lat + (Math.random() - 0.5) * 0.01,
          lng: vehicle.lng + (Math.random() - 0.5) * 0.01,
          speed: Math.floor(30 + Math.random() * 30),
        };
      }
      return vehicle;
    }));
    setLastUpdated(new Date());
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(updateVehiclePositions, 30000);
    return () => clearInterval(interval);
  }, [updateVehiclePositions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    updateVehiclePositions();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const stats: StatCard[] = [
    { title: 'Total Orders', value: '2,847', change: '+12.5%', changeType: 'positive', icon: <Package className="w-6 h-6" /> },
    { title: 'Active Deliveries', value: '156', change: '+8.2%', changeType: 'positive', icon: <Truck className="w-6 h-6" /> },
    { title: 'Revenue', value: '₹24.5L', change: '+18.7%', changeType: 'positive', icon: <TrendingUp className="w-6 h-6" /> },
    { title: 'Alerts', value: '7', change: '-3', changeType: 'negative', icon: <AlertTriangle className="w-6 h-6" /> },
  ];

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'moving': return 'bg-green-500';
      case 'delivering': return 'bg-blue-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: Vehicle['status']) => {
    switch (status) {
      case 'moving': return 'bg-green-100 text-green-800';
      case 'delivering': return 'bg-blue-100 text-blue-800';
      case 'idle': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Real-time supply chain overview</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <button onClick={handleRefresh} className={`p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 ${isRefreshing ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <span className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'}`}>
                  {stat.change} from last month
                </span>
              </div>
              <div className={`p-3 rounded-lg ${stat.changeType === 'positive' ? 'bg-green-100 text-green-600' : stat.changeType === 'negative' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content - Live Map and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Map */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold">Live Tracking Map</h2>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-green-500"></span> Moving</span>
              <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Delivering</span>
              <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Idle</span>
            </div>
          </div>
          
          {/* Interactive Map Container */}
          <div className="relative h-[500px] bg-gradient-to-br from-blue-50 to-green-50">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-sm">
              <p className="text-xs font-medium text-gray-600">NCR Region - India</p>
              <p className="text-xs text-gray-400">Delhi, Noida, Gurgaon</p>
            </div>

            {/* Warehouse Markers */}
            {warehouses.map((warehouse) => (
              <div key={warehouse.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group" style={{ left: `${((warehouse.lng - 76.8) / 0.8) * 100}%`, top: `${((28.8 - warehouse.lat) / 0.5) * 100}%` }}>
                <div className="relative">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Warehouse className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                      <p className="font-semibold">{warehouse.name}</p>
                      <p>Utilization: {warehouse.utilization}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Vehicle Markers */}
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-1000 ease-linear" style={{ left: `${((vehicle.lng - 76.8) / 0.8) * 100}%`, top: `${((28.8 - vehicle.lat) / 0.5) * 100}%` }} onClick={() => setSelectedVehicle(vehicle)}>
                <div className="relative">
                  {vehicle.status === 'moving' && <div className={`absolute inset-0 ${getStatusColor(vehicle.status)} rounded-full animate-ping opacity-75`}></div>}
                  <div className={`relative w-8 h-8 ${getStatusColor(vehicle.status)} rounded-full flex items-center justify-center shadow-lg border-2 border-white`}>
                    <Truck className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span className="text-xs font-medium bg-white px-1 rounded shadow">{vehicle.id}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Selected Vehicle Info Panel */}
            {selectedVehicle && (
              <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedVehicle.name}</h3>
                    <p className="text-gray-500 text-sm">{selectedVehicle.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedVehicle.status)}`}>
                    {selectedVehicle.status.charAt(0).toUpperCase() + selectedVehicle.status.slice(1)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div><p className="text-xs text-gray-500">Speed</p><p className="font-semibold">{selectedVehicle.speed} km/h</p></div>
                  <div><p className="text-xs text-gray-500">Destination</p><p className="font-semibold">{selectedVehicle.destination}</p></div>
                  <div><p className="text-xs text-gray-500">ETA</p><p className="font-semibold">{selectedVehicle.eta}</p></div>
                </div>
                <button onClick={() => setSelectedVehicle(null)} className="mt-3 text-sm text-blue-600 hover:text-blue-800">Close</button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {[
                { id: 'vehicles', label: 'Vehicles', icon: <Truck className="w-4 h-4" /> },
                { id: 'warehouses', label: 'Warehouses', icon: <Warehouse className="w-4 h-4" /> },
                { id: 'alerts', label: 'Alerts', icon: <AlertTriangle className="w-4 h-4" /> },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4 max-h-[400px] overflow-y-auto">
              {activeTab === 'vehicles' && (
                <div className="space-y-3">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} onClick={() => setSelectedVehicle(vehicle)} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedVehicle?.id === vehicle.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex justify-between items-start">
                        <div><p className="font-medium">{vehicle.name}</p><p className="text-xs text-gray-500">{vehicle.id}</p></div>
                        <span className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`}></span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{vehicle.destination}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{vehicle.eta}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'warehouses' && (
                <div className="space-y-3">
                  {warehouses.map((warehouse) => (
                    <div key={warehouse.id} className="p-3 rounded-lg border border-gray-100 hover:border-gray-200">
                      <div className="flex justify-between items-start">
                        <div><p className="font-medium">{warehouse.name}</p><p className="text-xs text-gray-500">{warehouse.id}</p></div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${warehouse.utilization > 80 ? 'bg-red-100 text-red-800' : warehouse.utilization > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{warehouse.utilization}%</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Capacity</span><span>{warehouse.capacity.toLocaleString()} units</span></div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${warehouse.utilization > 80 ? 'bg-red-500' : warehouse.utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${warehouse.utilization}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="space-y-3">
                  {[
                    { type: 'warning', message: 'Low stock alert: SKU-1234', time: '5 min ago' },
                    { type: 'error', message: 'Delivery delayed: Order #5678', time: '12 min ago' },
                    { type: 'info', message: 'New order received: #9012', time: '18 min ago' },
                    { type: 'warning', message: 'Vehicle maintenance due: V003', time: '1 hour ago' },
                    { type: 'success', message: 'Shipment delivered: #3456', time: '2 hours ago' },
                  ].map((alert, index) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${alert.type === 'error' ? 'border-red-500 bg-red-50' : alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' : alert.type === 'success' ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}`}>
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 text-left rounded-lg border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <Package className="w-5 h-5 text-blue-600 mb-1" /><p className="text-sm font-medium">New Order</p>
              </button>
              <button className="p-3 text-left rounded-lg border border-gray-100 hover:border-green-500 hover:bg-green-50 transition-colors">
                <Truck className="w-5 h-5 text-green-600 mb-1" /><p className="text-sm font-medium">Dispatch</p>
              </button>
              <button className="p-3 text-left rounded-lg border border-gray-100 hover:border-purple-500 hover:bg-purple-50 transition-colors">
                <BarChart3 className="w-5 h-5 text-purple-600 mb-1" /><p className="text-sm font-medium">Reports</p>
              </button>
              <button className="p-3 text-left rounded-lg border border-gray-100 hover:border-orange-500 hover:bg-orange-50 transition-colors">
                <Warehouse className="w-5 h-5 text-orange-600 mb-1" /><p className="text-sm font-medium">Inventory</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}