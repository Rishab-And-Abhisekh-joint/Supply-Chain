'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ordersApi, inventoryApi, Order, Product } from '@/lib/api';
import {
  ShoppingCart,
  Search,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  X,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  ChevronRight,
} from 'lucide-react';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ComponentType<any>; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', icon: Clock, bgColor: 'bg-yellow-100' },
  processing: { label: 'Processing', color: 'text-blue-700', icon: Package, bgColor: 'bg-blue-100' },
  shipped: { label: 'Shipped', color: 'text-purple-700', icon: Truck, bgColor: 'bg-purple-100' },
  delivered: { label: 'Delivered', color: 'text-green-700', icon: CheckCircle, bgColor: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', icon: XCircle, bgColor: 'bg-red-100' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for creating orders
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    shippingAddress: '',
    deliveryType: 'standard',
    items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [ordersData, productsData] = await Promise.all([
        ordersApi.getAll(),
        inventoryApi.getAll(),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderData = {
        customerId: formData.customerId || `CUST-${Date.now()}`,
        customerName: formData.customerName,
        shippingAddress: formData.shippingAddress,
        deliveryType: formData.deliveryType,
        items: formData.items.filter(item => item.productId),
      };

      const newOrder = await ordersApi.create(orderData);
      setOrders([newOrder, ...orders]);
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setIsSubmitting(true);

    try {
      const updatedOrder = await ordersApi.updateStatus(selectedOrder.id, newStatus);
      setOrders(orders.map(o => (o.id === selectedOrder.id ? updatedOrder : o)));
      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm(`Are you sure you want to delete order ${order.orderNumber}?`)) return;

    try {
      await ordersApi.delete(order.id);
      setOrders(orders.filter(o => o.id !== order.id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete order');
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      shippingAddress: '',
      deliveryType: 'standard',
      items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const addOrderItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', productName: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const removeOrderItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems.length ? newItems : [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }] });
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product selected, auto-fill details
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].unitPrice = product.unitPrice;
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const calculateOrderTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const exportToCSV = () => {
    const headers = ['Order Number', 'Customer', 'Status', 'Total', 'Created Date'];
    const rows = filteredOrders.map(o => [
      o.orderNumber,
      o.customerName,
      o.status,
      o.totalAmount,
      o.createdAt || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600">Track and manage customer orders</p>
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
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Order
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
            <p className="text-sm text-gray-600">Total Orders</p>
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Pending</p>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Processing</p>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{processingOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Revenue (Delivered)</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or customer..."
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
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Order Number</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Customer</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Items</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Total</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const status = statusConfig[order.status];
                  const StatusIcon = status.icon;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-blue-600">{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.customerId}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.items?.length || 0} items
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        ₹{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowStatusModal(true);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color} hover:opacity-80`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowViewModal(true);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleDeleteOrder(order)}
                              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create New Order</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOrder} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID (optional)</label>
                  <input
                    type="text"
                    value={formData.customerId}
                    onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                <textarea
                  value={formData.shippingAddress}
                  onChange={e => setFormData({ ...formData, shippingAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Enter shipping address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Type</label>
                <select
                  value={formData.deliveryType}
                  onChange={e => setFormData({ ...formData, deliveryType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">Standard Delivery</option>
                  <option value="express">Express Delivery</option>
                  <option value="same-day">Same Day Delivery</option>
                </select>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Order Items</label>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <select
                            value={item.productId}
                            onChange={e => updateOrderItem(index, 'productId', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          >
                            <option value="">Select Product</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (₹{p.unitPrice})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Qty"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            readOnly
                            value={`₹${(item.quantity * item.unitPrice).toLocaleString()}`}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100"
                          />
                        </div>
                      </div>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOrderItem(index)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                <span className="font-medium text-gray-700">Order Total</span>
                <span className="text-xl font-bold text-gray-900">₹{calculateOrderTotal().toLocaleString()}</span>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.customerName || formData.items.every(i => !i.productId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Order Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-blue-600">{selectedOrder.orderNumber}</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full ${statusConfig[selectedOrder.status].bgColor} ${statusConfig[selectedOrder.status].color}`}>
                  {statusConfig[selectedOrder.status].label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer ID</p>
                  <p className="font-medium">{selectedOrder.customerId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Delivery Type</p>
                  <p className="font-medium capitalize">{selectedOrder.deliveryType || 'Standard'}</p>
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div>
                  <p className="text-sm text-gray-500">Shipping Address</p>
                  <p className="font-medium">{selectedOrder.shippingAddress}</p>
                </div>
              )}

              {selectedOrder.trackingNumber && (
                <div>
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <p className="font-medium text-blue-600">{selectedOrder.trackingNumber}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Order Items</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity} × ₹{item.unitPrice}</p>
                      </div>
                      <p className="font-medium">₹{((item.quantity * item.unitPrice) || item.total || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold text-gray-900">₹{selectedOrder.totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setShowStatusModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Update Order Status</h2>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Order: <strong>{selectedOrder.orderNumber}</strong>
              </p>
              <div className="space-y-2">
                {(Object.keys(statusConfig) as OrderStatus[]).map(status => {
                  const config = statusConfig[status];
                  const StatusIcon = config.icon;
                  const isCurrentStatus = selectedOrder.status === status;

                  return (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(status)}
                      disabled={isSubmitting || isCurrentStatus}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isCurrentStatus
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                          <StatusIcon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <span className="font-medium">{config.label}</span>
                      </div>
                      {isCurrentStatus && (
                        <span className="text-xs text-blue-600 font-medium">Current</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
