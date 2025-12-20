'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Warehouse as WarehouseIcon, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Search, 
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  X,
  Phone,
  User,
  Database
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentUtilization: number;
  status: 'operational' | 'maintenance' | 'closed';
  manager?: string;
  phone?: string;
  email?: string;
  type?: string;
  facilities?: string[];
  operatingHours?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getUserEmail(): string {
  if (typeof window === 'undefined') return 'demo@example.com';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.email || 'demo@example.com';
    }
  } catch {}
  return 'demo@example.com';
}

// Normalize warehouse data from different formats
function normalizeWarehouse(item: any, index: number): Warehouse {
  // Validate status is one of the allowed values
  const validStatuses = ['operational', 'maintenance', 'closed'] as const;
  const status = validStatuses.includes(item.status) ? item.status : 'operational';
  
  return {
    id: item.id || `WH-${String(index + 1).padStart(3, '0')}`,
    name: item.name || 'Unnamed Warehouse',
    address: item.address || '',
    city: item.city || '',
    state: item.state || '',
    pincode: item.pincode || '',
    latitude: parseFloat(item.latitude) || 0,
    longitude: parseFloat(item.longitude) || 0,
    capacity: parseInt(item.capacity) || 50000,
    currentUtilization: parseInt(item.currentUtilization) || Math.floor(Math.random() * 50 + 30),
    status: status as 'operational' | 'maintenance' | 'closed',
    manager: item.manager || '',
    phone: item.phone || '',
    email: item.email || '',
    type: item.type || 'distribution',
    facilities: item.facilities || [],
    operatingHours: item.operatingHours || '24/7',
  };
}

// ============================================================================
// DEMO DATA (fallback when no data uploaded)
// ============================================================================

const DEMO_WAREHOUSES: Warehouse[] = [
  { id: 'WH-001', name: 'Mumbai Central Hub', address: 'Plot 45, MIDC', city: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777, capacity: 100000, currentUtilization: 72, status: 'operational', manager: 'Rahul Mehta', phone: '+91 98765 43210' },
  { id: 'WH-002', name: 'Delhi Distribution Center', address: 'Sector 62, Noida', city: 'Delhi NCR', state: 'Delhi', latitude: 28.7041, longitude: 77.1025, capacity: 85000, currentUtilization: 65, status: 'operational', manager: 'Priya Sharma', phone: '+91 98765 43211' },
  { id: 'WH-003', name: 'Chennai Port Warehouse', address: 'Chennai Port Trust', city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707, capacity: 120000, currentUtilization: 88, status: 'operational', manager: 'Karthik Rajan', phone: '+91 98765 43212' },
  { id: 'WH-004', name: 'Kolkata Regional Hub', address: 'Salt Lake Sector V', city: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639, capacity: 60000, currentUtilization: 45, status: 'maintenance', manager: 'Amit Das', phone: '+91 98765 43213' },
  { id: 'WH-005', name: 'Bangalore Tech Park DC', address: 'Electronic City', city: 'Bangalore', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946, capacity: 75000, currentUtilization: 55, status: 'operational', manager: 'Sneha Patil', phone: '+91 98765 43214' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<string>('loading');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    capacity: number;
    currentUtilization: number;
    status: 'operational' | 'maintenance' | 'closed';
    manager: string;
    phone: string;
  }>({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: 0,
    longitude: 0,
    capacity: 50000,
    currentUtilization: 0,
    status: 'operational',
    manager: '',
    phone: '',
  });

  // ============================================================================
  // FETCH DATA - Now fetches from /api/data endpoint (uploaded JSON)
  // ============================================================================

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const userEmail = getUserEmail();

    try {
      // Fetch warehouses from unified data API (uploaded JSON)
      const warehousesRes = await fetch('/api/data?type=warehouses', {
        headers: { 'X-User-Email': userEmail }
      });

      let warehouseData: Warehouse[] = [];
      let source = 'demo';

      if (warehousesRes.ok) {
        const warehousesJson = await warehousesRes.json();
        console.log('Warehouses API response:', warehousesJson);

        if (warehousesJson.success && warehousesJson.data && Array.isArray(warehousesJson.data) && warehousesJson.data.length > 0) {
          warehouseData = warehousesJson.data.map((item: any, index: number) => normalizeWarehouse(item, index));
          source = warehousesJson.source || 'user_data';
        }
      }

      // If no uploaded data, use demo data
      if (warehouseData.length === 0) {
        warehouseData = DEMO_WAREHOUSES;
        source = 'demo';
      }

      setWarehouses(warehouseData);
      setDataSource(source);

    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
      setError(err.message || 'Failed to fetch warehouses');
      setWarehouses(DEMO_WAREHOUSES);
      setDataSource('demo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter warehouses
  const filteredWarehouses = warehouses.filter(w => {
    const matchesSearch = 
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalItems = warehouses.reduce((sum, w) => sum + Math.floor(w.capacity * w.currentUtilization / 100), 0);
  const avgCapacity = warehouses.length > 0 
    ? Math.round(warehouses.reduce((sum, w) => sum + w.currentUtilization, 0) / warehouses.length) 
    : 0;
  const maintenanceCount = warehouses.filter(w => w.status === 'maintenance').length;

  // ============================================================================
  // CRUD OPERATIONS - Save to /api/data endpoint
  // ============================================================================

  const saveWarehousesToApi = async (updatedWarehouses: Warehouse[]) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': getUserEmail(),
        },
        body: JSON.stringify({
          type: 'warehouses',
          data: updatedWarehouses,
        }),
      });
    } catch (err) {
      console.error('Error saving warehouses:', err);
    }
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newWarehouse: Warehouse = {
        id: `WH-${Date.now().toString(36).toUpperCase()}`,
        ...formData,
      };

      const updatedWarehouses = [...warehouses, newWarehouse];
      setWarehouses(updatedWarehouses);
      await saveWarehousesToApi(updatedWarehouses);
      
      setShowAddModal(false);
      resetForm();
      setDataSource('user_data');
    } catch (err: any) {
      setError(err.message || 'Failed to add warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse) return;
    setIsSubmitting(true);

    try {
      const updatedWarehouse: Warehouse = {
        ...selectedWarehouse,
        ...formData,
      };

      const updatedWarehouses = warehouses.map(w => (w.id === selectedWarehouse.id ? updatedWarehouse : w));
      setWarehouses(updatedWarehouses);
      await saveWarehousesToApi(updatedWarehouses);
      
      setShowEditModal(false);
      setSelectedWarehouse(null);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to update warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWarehouse = async () => {
    if (!selectedWarehouse) return;
    setIsSubmitting(true);

    try {
      const updatedWarehouses = warehouses.filter(w => w.id !== selectedWarehouse.id);
      setWarehouses(updatedWarehouses);
      await saveWarehousesToApi(updatedWarehouses);
      
      setShowDeleteModal(false);
      setSelectedWarehouse(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      address: warehouse.address,
      city: warehouse.city,
      state: warehouse.state,
      pincode: warehouse.pincode || '',
      latitude: warehouse.latitude,
      longitude: warehouse.longitude,
      capacity: warehouse.capacity,
      currentUtilization: warehouse.currentUtilization,
      status: warehouse.status,
      manager: warehouse.manager || '',
      phone: warehouse.phone || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      latitude: 0,
      longitude: 0,
      capacity: 50000,
      currentUtilization: 0,
      status: 'operational',
      manager: '',
      phone: '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading warehouses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
          <p className="text-gray-500">Monitor and manage warehouse operations</p>
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
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Warehouse
          </button>
        </div>
      </div>

      {/* Data Source Banner */}
      <div className={`p-3 rounded-lg flex items-center gap-3 ${
        dataSource === 'demo' 
          ? 'bg-yellow-50 border border-yellow-200' 
          : 'bg-green-50 border border-green-200'
      }`}>
        <Database className={`w-5 h-5 ${dataSource === 'demo' ? 'text-yellow-600' : 'text-green-600'}`} />
        <div>
          <p className={`text-sm font-medium ${dataSource === 'demo' ? 'text-yellow-800' : 'text-green-800'}`}>
            {dataSource === 'demo' 
              ? 'Showing demo data. Upload warehouses.json in Settings → Data Management to see your data.'
              : `Loaded ${warehouses.length} warehouses from your uploaded data (${dataSource})`
            }
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <WarehouseIcon className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Total Warehouses</span>
          </div>
          <p className="text-2xl font-bold">{warehouses.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Total Capacity Used</span>
          </div>
          <p className="text-2xl font-bold">{totalItems.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Avg Utilization</span>
          </div>
          <p className="text-2xl font-bold">{avgCapacity}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-500">In Maintenance</span>
          </div>
          <p className="text-2xl font-bold">{maintenanceCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search warehouses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="operational">Operational</option>
          <option value="maintenance">Maintenance</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWarehouses.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No warehouses found
          </div>
        ) : (
          filteredWarehouses.map((warehouse) => (
            <div key={warehouse.id} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <WarehouseIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{warehouse.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {warehouse.city}, {warehouse.state}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  warehouse.status === 'operational' ? 'bg-green-100 text-green-700' : 
                  warehouse.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {warehouse.status}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Capacity Utilization</span>
                    <span className="font-medium">{warehouse.currentUtilization}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-full rounded-full ${
                        warehouse.currentUtilization > 85 ? 'bg-red-500' :
                        warehouse.currentUtilization > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${warehouse.currentUtilization}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-500">Total Capacity</span>
                  <span className="font-medium">{warehouse.capacity.toLocaleString()} units</span>
                </div>
                
                {warehouse.manager && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3" /> Manager
                    </span>
                    <span className="font-medium">{warehouse.manager}</span>
                  </div>
                )}
                
                {warehouse.phone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone
                    </span>
                    <span className="font-medium">{warehouse.phone}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t flex justify-end gap-2">
                <button
                  onClick={() => openEditModal(warehouse)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedWarehouse(warehouse);
                    setShowDeleteModal(true);
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Warehouse Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add New Warehouse</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddWarehouse} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mumbai Central Hub"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (units)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'operational' | 'maintenance' | 'closed' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="operational">Operational</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
                  <input
                    type="text"
                    value={formData.manager}
                    onChange={e => setFormData({ ...formData, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  {isSubmitting ? 'Adding...' : 'Add Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Warehouse Modal */}
      {showEditModal && selectedWarehouse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Warehouse</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditWarehouse} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (units)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Utilization (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.currentUtilization}
                    onChange={e => setFormData({ ...formData, currentUtilization: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'operational' | 'maintenance' | 'closed' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="operational">Operational</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                  <input
                    type="text"
                    value={formData.manager}
                    onChange={e => setFormData({ ...formData, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedWarehouse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold">Delete Warehouse</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedWarehouse.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWarehouse}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}