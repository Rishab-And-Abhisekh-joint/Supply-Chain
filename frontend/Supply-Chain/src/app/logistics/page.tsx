'use client';

import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Navigation, Clock, CheckCircle, AlertTriangle, Wrench, RefreshCw } from 'lucide-react';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  type: 'truck' | 'van' | 'bike';
  driver: string;
  status: 'moving' | 'delivering' | 'idle' | 'maintenance';
  currentLocation: { lat: number; lng: number };
  destination?: string;
  capacity: number;
  currentLoad: number;
  eta?: string;
}

const demoVehicles: Vehicle[] = [
  { id: '1', vehicleNumber: 'DL01AB1234', type: 'truck', driver: 'Rajesh Kumar', status: 'moving', currentLocation: { lat: 28.6139, lng: 77.2090 }, destination: 'Mumbai', capacity: 10000, currentLoad: 7500, eta: '18:30' },
  { id: '2', vehicleNumber: 'DL02CD5678', type: 'truck', driver: 'Amit Singh', status: 'delivering', currentLocation: { lat: 28.5355, lng: 77.3910 }, destination: 'Noida', capacity: 8000, currentLoad: 6000, eta: '14:15' },
  { id: '3', vehicleNumber: 'HR03EF9012', type: 'van', driver: 'Suresh Yadav', status: 'idle', currentLocation: { lat: 28.4595, lng: 77.0266 }, capacity: 3000, currentLoad: 0 },
  { id: '4', vehicleNumber: 'DL04GH3456', type: 'truck', driver: 'Vikram Sharma', status: 'moving', currentLocation: { lat: 28.7041, lng: 77.1025 }, destination: 'Gurgaon', capacity: 10000, currentLoad: 8500, eta: '15:45' },
  { id: '5', vehicleNumber: 'UP05IJ7890', type: 'van', driver: 'Prakash Verma', status: 'maintenance', currentLocation: { lat: 28.6692, lng: 77.4538 }, capacity: 3000, currentLoad: 0 },
  { id: '6', vehicleNumber: 'DL06KL2345', type: 'bike', driver: 'Ravi Tiwari', status: 'delivering', currentLocation: { lat: 28.6280, lng: 77.2200 }, destination: 'Connaught Place', capacity: 50, currentLoad: 35, eta: '13:00' },
];

export default function LogisticsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/vehicles.json');
        if (response.ok) {
          const data = await response.json();
          setVehicles(data);
        } else {
          setVehicles(demoVehicles);
        }
      } catch {
        setVehicles(demoVehicles);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const stats = {
    total: vehicles.length,
    moving: vehicles.filter(v => v.status === 'moving').length,
    delivering: vehicles.filter(v => v.status === 'delivering').length,
    idle: vehicles.filter(v => v.status === 'idle').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
  };

  const filteredVehicles = selectedStatus === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.status === selectedStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'moving': return <Navigation className="w-4 h-4" />;
      case 'delivering': return <CheckCircle className="w-4 h-4" />;
      case 'idle': return <Clock className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving': return 'bg-green-100 text-green-800 border-green-200';
      case 'delivering': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'idle': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'truck': return '🚛';
      case 'van': return '🚐';
      case 'bike': return '🏍️';
      default: return '🚗';
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Logistics & Fleet Management</h1>
        <p className="text-gray-500">Track vehicles and manage deliveries</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`bg-white rounded-xl p-4 border shadow-sm text-left transition ${selectedStatus === 'all' ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Truck className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Fleet</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setSelectedStatus('moving')}
          className={`bg-white rounded-xl p-4 border shadow-sm text-left transition ${selectedStatus === 'moving' ? 'ring-2 ring-green-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Navigation className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Moving</p>
              <p className="text-2xl font-bold text-green-600">{stats.moving}</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setSelectedStatus('delivering')}
          className={`bg-white rounded-xl p-4 border shadow-sm text-left transition ${selectedStatus === 'delivering' ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Delivering</p>
              <p className="text-2xl font-bold text-blue-600">{stats.delivering}</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setSelectedStatus('idle')}
          className={`bg-white rounded-xl p-4 border shadow-sm text-left transition ${selectedStatus === 'idle' ? 'ring-2 ring-yellow-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Idle</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.idle}</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setSelectedStatus('maintenance')}
          className={`bg-white rounded-xl p-4 border shadow-sm text-left transition ${selectedStatus === 'maintenance' ? 'ring-2 ring-red-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Wrench className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Maintenance</p>
              <p className="text-2xl font-bold text-red-600">{stats.maintenance}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Vehicle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white rounded-xl border shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getVehicleIcon(vehicle.type)}</span>
                <div>
                  <p className="font-bold text-gray-900">{vehicle.vehicleNumber}</p>
                  <p className="text-sm text-gray-500">{vehicle.driver}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(vehicle.status)}`}>
                {getStatusIcon(vehicle.status)}
                {vehicle.status}
              </span>
            </div>

            {/* Load Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Load</span>
                <span>{vehicle.currentLoad} / {vehicle.capacity} kg</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(vehicle.currentLoad / vehicle.capacity) * 100}%` }}
                />
              </div>
            </div>

            {/* Destination */}
            {vehicle.destination && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">→ {vehicle.destination}</span>
                {vehicle.eta && (
                  <span className="ml-auto text-blue-600 font-medium">ETA: {vehicle.eta}</span>
                )}
              </div>
            )}

            {vehicle.status === 'idle' && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <Clock className="w-4 h-4" />
                <span>Available for dispatch</span>
              </div>
            )}

            {vehicle.status === 'maintenance' && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Under maintenance</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Data Source Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📁 Load Your Own Data</h3>
        <p className="text-sm text-blue-800">
          Place your <code className="bg-blue-100 px-1 rounded">vehicles.json</code> file in the <code className="bg-blue-100 px-1 rounded">/public/data/</code> folder.
        </p>
      </div>
    </div>
  );
}
