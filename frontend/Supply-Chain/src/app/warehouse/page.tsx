'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { warehouseApi, Warehouse } from '@/lib/api';
import {
  Building2,
  Search,
  Plus,
  RefreshCw,
  MapPin,
  Package,
  AlertTriangle,
  X,
  Edit,
  Trash2,
  Phone,
  User,
  CheckCircle,
  Wrench,
  XCircle,
} from 'lucide-react';

type WarehouseStatus = 'operational' | 'maintenance' | 'closed';

const statusConfig: Record<WarehouseStatus, { label: string; color: string; bgColor: string; icon: React.ComponentType<any> }> = {
  operational: { label: 'Operational', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  maintenance: { label: 'Maintenance', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: Wrench },
  closed: { label: 'Closed', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
};

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: 0,
    longitude: 0,
    capacity: 50000,
    manager: '',
    phone: '',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const warehousesData = await warehouseApi.getAll();
      setWarehouses(warehousesData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch warehouses');
      console.error('Error fetching warehouses:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter warehouses
  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch =
      warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.state.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || warehouse.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalWarehouses = warehouses.length;
  const operationalCount = warehouses.filter(w => w.status === 'operational').length;
  const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity, 0);
  const avgUtilization = warehouses.length > 0
    ? warehouses.reduce((sum, w) => sum + w.currentUtilization, 0) / warehouses.length
    : 0;

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newWarehouse = await warehouseApi.create(formData);
      setWarehouses([...warehouses, newWarehouse]);
      setShowAddModal(false);
      resetForm();
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
      const updatedWarehouse = await warehouseApi.update(selectedWarehouse.id, formData);
      setWarehouses(warehouses.map(w => (w.id === selectedWarehouse.id ? updatedWarehouse : w)));
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
      await warehouseApi.delete(selectedWarehouse.id);
      setWarehouses(warehouses.filter(w => w.id !== selectedWarehouse.id));
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
      latitude: warehouse.latitude || 0,
      longitude: warehouse.longitude || 0,
      capacity: warehouse.capacity,
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
      manager: '',
      phone: '',
    });
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-500';
    if (utilization >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUtilizationTextColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 70) return 'text-yellow-600';
    return 'text-green-600';
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
          <p className="text-gray-600">Manage your distribution centers and storage facilities</p>
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
            <p className="text-sm text-gray-600">Total Warehouses</p>
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalWarehouses}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Operational</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">{operationalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Total Capacity</p>
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{(totalCapacity / 1000).toFixed(0)}K units</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Avg. Utilization</p>
            <Building2 className={`w-5 h-5 ${getUtilizationTextColor(avgUtilization)}`} />
          </div>
          <p className={`text-2xl font-bold ${getUtilizationTextColor(avgUtilization)} mt-1`}>
            {avgUtilization.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, city, or state..."
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
            <option value="operational">Operational</option>
            <option value="maintenance">Maintenance</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWarehouses.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No warehouses found
          </div>
        ) : (
          filteredWarehouses.map(warehouse => {
            const status = statusConfig[warehouse.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={warehouse.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${status.bgColor} flex items-center justify-center`}>
                        <Building2 className={`w-5 h-5 ${status.color}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{warehouse.name}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {warehouse.city}, {warehouse.state}
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{warehouse.address}</p>

                  {/* Utilization Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Utilization</span>
                      <span className={getUtilizationTextColor(warehouse.currentUtilization)}>
                        {warehouse.currentUtilization}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getUtilizationColor(warehouse.currentUtilization)} transition-all`}
                        style={{ width: `${Math.min(warehouse.currentUtilization, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Capacity</p>
                      <p className="font-medium">{warehouse.capacity.toLocaleString()} units</p>
                    </div>
                    {warehouse.manager && (
                      <div>
                        <p className="text-gray-500">Manager</p>
                        <p className="font-medium">{warehouse.manager}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
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
            );
          })
        )}
      </div>

      {/* Add Warehouse Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                  required
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (units)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={formData.capacity}
                  onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                  required
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (units)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={formData.capacity}
                  onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
