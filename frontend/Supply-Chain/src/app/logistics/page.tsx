'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { vehiclesApi, logisticsApi, Vehicle } from '@/lib/api';
import {
  Truck,
  Search,
  Plus,
  RefreshCw,
  MapPin,
  Navigation,
  Clock,
  Package,
  AlertTriangle,
  X,
  Edit,
  Eye,
  Wrench,
  CheckCircle,
  Play,
  Pause,
  Route,
  Fuel,
} from 'lucide-react';

type VehicleStatus = 'moving' | 'delivering' | 'idle' | 'maintenance';

const statusConfig: Record<VehicleStatus, { label: string; color: string; bgColor: string; icon: React.ComponentType<any> }> = {
  moving: { label: 'In Transit', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Play },
  delivering: { label: 'Delivering', color: 'text-green-700', bgColor: 'bg-green-100', icon: Package },
  idle: { label: 'Idle', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Pause },
  maintenance: { label: 'Maintenance', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: Wrench },
};

export default function LogisticsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Route optimization state
  const [routeForm, setRouteForm] = useState({
    origin: '',
    destination: '',
    vehicleType: 'truck',
  });
  const [routeResult, setRouteResult] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Add vehicle form
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    type: 'truck' as 'truck' | 'van' | 'bike',
    model: '',
    driver: '',
    driverPhone: '',
    capacity: 10000,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const vehiclesData = await vehiclesApi.getAll();
      setVehicles(vehiclesData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vehicles');
      console.error('Error fetching vehicles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Set up refresh interval for real-time updates
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch =
      vehicle.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'moving' || v.status === 'delivering').length;
  const idleVehicles = vehicles.filter(v => v.status === 'idle').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newVehicle = await vehiclesApi.create(formData);
      setVehicles([...vehicles, newVehicle]);
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to add vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (vehicleId: string, newStatus: VehicleStatus) => {
    try {
      const updatedVehicle = await vehiclesApi.updateStatus(vehicleId, newStatus);
      setVehicles(vehicles.map(v => (v.id === vehicleId ? updatedVehicle : v)));
    } catch (err: any) {
      setError(err.message || 'Failed to update vehicle status');
    }
  };

  const handleOptimizeRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOptimizing(true);
    setRouteResult(null);

    try {
      const result = await logisticsApi.optimizeRoute({
        origin: routeForm.origin,
        destination: routeForm.destination,
        vehicleType: routeForm.vehicleType,
      });
      setRouteResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to optimize route');
    } finally {
      setIsOptimizing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleNumber: '',
      type: 'truck',
      model: '',
      driver: '',
      driverPhone: '',
      capacity: 10000,
    });
  };

  const getUtilizationColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading fleet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logistics & Fleet Management</h1>
          <p className="text-gray-600">Track vehicles and optimize delivery routes</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowRouteModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            <Route className="w-4 h-4" />
            Optimize Route
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Total Fleet</p>
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalVehicles}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Active</p>
            <Play className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeVehicles}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Idle</p>
            <Pause className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-gray-600 mt-1">{idleVehicles}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Maintenance</p>
            <Wrench className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-1">{maintenanceVehicles}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by vehicle number or driver..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="moving">In Transit</option>
            <option value="delivering">Delivering</option>
            <option value="idle">Idle</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No vehicles found
          </div>
        ) : (
          filteredVehicles.map(vehicle => {
            const status = statusConfig[vehicle.status];
            const StatusIcon = status.icon;
            const utilizationPercent = (vehicle.currentLoad / vehicle.capacity) * 100;

            return (
              <div
                key={vehicle.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${status.bgColor} flex items-center justify-center`}>
                        <Truck className={`w-5 h-5 ${status.color}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{vehicle.vehicleNumber}</p>
                        <p className="text-xs text-gray-500 capitalize">{vehicle.type}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {vehicle.currentLocation
                          ? `${vehicle.currentLocation.lat.toFixed(4)}, ${vehicle.currentLocation.lng.toFixed(4)}`
                          : 'Location unavailable'}
                      </span>
                    </div>
                    {vehicle.destination && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Navigation className="w-4 h-4" />
                        <span>{vehicle.destination}</span>
                      </div>
                    )}
                    {vehicle.eta && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>ETA: {vehicle.eta}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package className="w-4 h-4" />
                      <span>Driver: {vehicle.driver}</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Load Capacity</span>
                      <span>{vehicle.currentLoad.toLocaleString()} / {vehicle.capacity.toLocaleString()} kg</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getUtilizationColor(vehicle.currentLoad, vehicle.capacity)} transition-all`}
                        style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setShowDetailModal(true);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Details
                  </button>
                  <div className="flex items-center gap-2">
                    <select
                      value={vehicle.status}
                      onChange={e => handleUpdateStatus(vehicle.id, e.target.value as VehicleStatus)}
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="moving">In Transit</option>
                      <option value="delivering">Delivering</option>
                      <option value="idle">Idle</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add New Vehicle</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddVehicle} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  required
                  value={formData.vehicleNumber}
                  onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., DL01AB1234"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="bike">Bike</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model (optional)</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  required
                  value={formData.driver}
                  onChange={e => setFormData({ ...formData, driver: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Phone (optional)</label>
                <input
                  type="tel"
                  value={formData.driverPhone}
                  onChange={e => setFormData({ ...formData, driverPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (kg)</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={formData.capacity}
                  onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Route Optimization Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Route Optimization</h2>
              <button onClick={() => setShowRouteModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleOptimizeRoute} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                <input
                  type="text"
                  required
                  value={routeForm.origin}
                  onChange={e => setRouteForm({ ...routeForm, origin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mumbai Warehouse"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <input
                  type="text"
                  required
                  value={routeForm.destination}
                  onChange={e => setRouteForm({ ...routeForm, destination: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Delhi Distribution Center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select
                  value={routeForm.vehicleType}
                  onChange={e => setRouteForm({ ...routeForm, vehicleType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                  <option value="bike">Bike</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isOptimizing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isOptimizing ? 'Optimizing...' : 'Find Optimal Route'}
              </button>
            </form>

            {/* Route Result */}
            {routeResult && (
              <div className="p-4 border-t bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-3">Optimized Route</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Route className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Route</p>
                      <p className="text-sm text-gray-600">{routeResult.optimalRoute}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Est. Time</p>
                        <p className="text-sm font-medium">{routeResult.estimatedTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Distance</p>
                        <p className="text-sm font-medium">{routeResult.estimatedDistance}</p>
                      </div>
                    </div>
                  </div>
                  {routeResult.fuelCost && (
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Est. Fuel Cost</p>
                        <p className="text-sm font-medium">₹{routeResult.fuelCost.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {routeResult.alternativeRoutes && routeResult.alternativeRoutes.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-gray-500 mb-2">Alternative Routes</p>
                      {routeResult.alternativeRoutes.map((alt: any, i: number) => (
                        <div key={i} className="text-sm text-gray-600 py-1">
                          {alt.route} - {alt.time} ({alt.distance})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vehicle Detail Modal */}
      {showDetailModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Vehicle Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-lg ${statusConfig[selectedVehicle.status].bgColor} flex items-center justify-center`}>
                  <Truck className={`w-8 h-8 ${statusConfig[selectedVehicle.status].color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{selectedVehicle.vehicleNumber}</p>
                  <p className="text-gray-500 capitalize">{selectedVehicle.type} {selectedVehicle.model ? `- ${selectedVehicle.model}` : ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-full ${statusConfig[selectedVehicle.status].bgColor} ${statusConfig[selectedVehicle.status].color}`}>
                    {statusConfig[selectedVehicle.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="font-medium">{selectedVehicle.capacity.toLocaleString()} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Load</p>
                  <p className="font-medium">{selectedVehicle.currentLoad.toLocaleString()} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ETA</p>
                  <p className="font-medium">{selectedVehicle.eta || 'N/A'}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-1">Driver</p>
                <p className="font-medium">{selectedVehicle.driver}</p>
                {selectedVehicle.driverPhone && (
                  <p className="text-sm text-blue-600">{selectedVehicle.driverPhone}</p>
                )}
              </div>

              {selectedVehicle.destination && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Destination</p>
                  <p className="font-medium">{selectedVehicle.destination}</p>
                </div>
              )}

              {selectedVehicle.currentLocation && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Current Location</p>
                  <p className="font-medium">
                    Lat: {selectedVehicle.currentLocation.lat.toFixed(4)}, 
                    Lng: {selectedVehicle.currentLocation.lng.toFixed(4)}
                  </p>
                </div>
              )}

              {selectedVehicle.lastUpdated && (
                <div className="text-xs text-gray-400">
                  Last updated: {new Date(selectedVehicle.lastUpdated).toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
