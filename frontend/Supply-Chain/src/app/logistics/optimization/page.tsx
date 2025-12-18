'use client';

// This page handles /logistics/optimization route
// Re-exports the same content as /logistics-optimization

import React, { useState } from 'react';
import { Truck, MapPin, Clock, Route, Play, RefreshCw, Navigation } from 'lucide-react';

const demoRoutes = [
  { id: 1, from: 'Mumbai Warehouse', to: 'Pune Distribution', distance: '148 km', time: '3h 15m', status: 'optimized', savings: '12%' },
  { id: 2, from: 'Delhi Hub', to: 'Jaipur Center', distance: '281 km', time: '5h 30m', status: 'calculating', savings: '-' },
  { id: 3, from: 'Chennai Port', to: 'Bangalore DC', distance: '346 km', time: '6h 45m', status: 'optimized', savings: '8%' },
  { id: 4, from: 'Kolkata Depot', to: 'Bhubaneswar', distance: '441 km', time: '8h 20m', status: 'pending', savings: '-' },
];

export default function LogisticsOptimizationNestedPage() {
  const [routes] = useState(demoRoutes);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Optimization</h1>
          <p className="text-gray-500">Optimize delivery routes for efficiency</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Play className="w-4 h-4" />
          Optimize All Routes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Route className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Active Routes</span>
          </div>
          <p className="text-2xl font-bold">{routes.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Optimized</span>
          </div>
          <p className="text-2xl font-bold">{routes.filter(r => r.status === 'optimized').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-500">Avg Time Saved</span>
          </div>
          <p className="text-2xl font-bold">10%</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Fuel Saved</span>
          </div>
          <p className="text-2xl font-bold">₹12.5K</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Route List</h2>
        </div>
        <div className="divide-y">
          {routes.map((route) => (
            <div
              key={route.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedRoute === route.id ? 'bg-blue-50' : ''}`}
              onClick={() => setSelectedRoute(route.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span className="font-medium">{route.from}</span>
                      <span className="text-gray-400">→</span>
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="font-medium">{route.to}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{route.distance}</span>
                      <span>•</span>
                      <span>{route.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {route.savings !== '-' && (
                    <span className="text-green-600 font-medium">↓ {route.savings}</span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    route.status === 'optimized' ? 'bg-green-100 text-green-700' :
                    route.status === 'calculating' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {route.status === 'calculating' && <RefreshCw className="w-3 h-3 inline mr-1 animate-spin" />}
                    {route.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
