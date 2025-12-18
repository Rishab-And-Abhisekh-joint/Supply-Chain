'use client';

import React, { useState } from 'react';
import { Truck, User, Calendar, Fuel, Settings, Plus, Search } from 'lucide-react';

const demoFleet = [
  { id: 'TRK-001', type: 'Heavy Truck', model: 'Tata Prima', year: 2022, driver: 'Rajesh Kumar', status: 'active', mileage: '45,230 km', fuel: 'Diesel', nextService: '2024-02-15' },
  { id: 'VAN-012', type: 'Delivery Van', model: 'Mahindra Supro', year: 2023, driver: 'Amit Singh', status: 'active', mileage: '12,450 km', fuel: 'CNG', nextService: '2024-03-01' },
  { id: 'TRK-003', type: 'Medium Truck', model: 'Ashok Leyland', year: 2021, driver: 'Suresh Patel', status: 'active', mileage: '67,890 km', fuel: 'Diesel', nextService: '2024-01-30' },
  { id: 'BKE-045', type: 'Cargo Bike', model: 'TVS XL', year: 2023, driver: 'Vikram Rao', status: 'active', mileage: '8,120 km', fuel: 'Petrol', nextService: '2024-04-10' },
  { id: 'TRK-007', type: 'Heavy Truck', model: 'Eicher Pro', year: 2020, driver: 'Manoj Verma', status: 'maintenance', mileage: '98,450 km', fuel: 'Diesel', nextService: 'In Service' },
  { id: 'VAN-023', type: 'Delivery Van', model: 'Tata Ace', year: 2022, driver: 'Ravi Sharma', status: 'active', mileage: '34,670 km', fuel: 'Diesel', nextService: '2024-02-28' },
];

export default function FleetManagementPage() {
  const [fleet] = useState(demoFleet);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFleet = fleet.filter(
    v => v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
         v.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
         v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-500">Manage your vehicle fleet and drivers</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Total Fleet</span>
          </div>
          <p className="text-2xl font-bold">{fleet.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Active Drivers</span>
          </div>
          <p className="text-2xl font-bold">{fleet.filter(v => v.status === 'active').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-500">In Maintenance</span>
          </div>
          <p className="text-2xl font-bold">{fleet.filter(v => v.status === 'maintenance').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Fuel className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Avg. Mileage</span>
          </div>
          <p className="text-2xl font-bold">44.5K km</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by ID, driver, or model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFleet.map((vehicle) => (
          <div key={vehicle.id} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{vehicle.id}</h3>
                  <p className="text-sm text-gray-500">{vehicle.type}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                vehicle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {vehicle.status}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Model</span>
                <span className="font-medium">{vehicle.model} ({vehicle.year})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Driver</span>
                <span className="font-medium">{vehicle.driver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mileage</span>
                <span className="font-medium">{vehicle.mileage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fuel Type</span>
                <span className="font-medium">{vehicle.fuel}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Next Service
                </span>
                <span className={`font-medium ${vehicle.nextService === 'In Service' ? 'text-orange-600' : ''}`}>
                  {vehicle.nextService}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
