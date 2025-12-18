'use client';

import React, { useState } from 'react';
import { Truck, MapPin, Clock, Navigation, Package, AlertCircle } from 'lucide-react';

const demoVehicles = [
  { id: 'TRK-001', driver: 'Rajesh Kumar', status: 'moving', location: 'NH48 near Pune', eta: '45 min', load: '85%', type: 'truck' },
  { id: 'VAN-012', driver: 'Amit Singh', status: 'delivering', location: 'Mumbai Central', eta: '10 min', load: '40%', type: 'van' },
  { id: 'TRK-003', driver: 'Suresh Patel', status: 'idle', location: 'Delhi Warehouse', eta: '-', load: '0%', type: 'truck' },
  { id: 'BKE-045', driver: 'Vikram Rao', status: 'moving', location: 'Bangalore Koramangala', eta: '20 min', load: '60%', type: 'bike' },
  { id: 'TRK-007', driver: 'Manoj Verma', status: 'maintenance', location: 'Chennai Service Center', eta: '-', load: '0%', type: 'truck' },
  { id: 'VAN-023', driver: 'Ravi Sharma', status: 'moving', location: 'Hyderabad Ring Road', eta: '1h 15m', load: '92%', type: 'van' },
];

const statusColors: Record<string, string> = {
  moving: 'bg-green-100 text-green-700',
  delivering: 'bg-blue-100 text-blue-700',
  idle: 'bg-gray-100 text-gray-700',
  maintenance: 'bg-red-100 text-red-700',
};

export default function LogisticsTrackingPage() {
  const [vehicles] = useState(demoVehicles);
  const [filter, setFilter] = useState('all');

  const filteredVehicles = filter === 'all' ? vehicles : vehicles.filter(v => v.status === filter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Tracking</h1>
          <p className="text-gray-500">Real-time vehicle location and status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Total Vehicles</span>
          </div>
          <p className="text-2xl font-bold">{vehicles.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">In Transit</span>
          </div>
          <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'moving').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Delivering</span>
          </div>
          <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'delivering').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-500">Maintenance</span>
          </div>
          <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'maintenance').length}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'moving', 'delivering', 'idle', 'maintenance'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              filter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Vehicle Status</h2>
        </div>
        <div className="divide-y">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{vehicle.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[vehicle.status]}`}>
                        {vehicle.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{vehicle.driver}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{vehicle.location}</span>
                    </div>
                    {vehicle.eta !== '-' && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>ETA: {vehicle.eta}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-20">
                    <div className="text-sm text-gray-500 mb-1">Load</div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: vehicle.load }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{vehicle.load}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
