'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Clock, Truck, CheckCircle, XCircle, Package, RefreshCw } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  items: { sku: string; name: string; quantity: number; price: number }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  deliveryDate: string;
  address: string;
}

const demoOrders: Order[] = [
  { id: '1', orderNumber: 'ORD-2024-001', customer: 'Reliance Fresh', items: [{ sku: 'SKU001', name: 'Organic Wheat Flour', quantity: 100, price: 4500 }], total: 4500, status: 'delivered', createdAt: '2024-12-15', deliveryDate: '2024-12-17', address: 'Mumbai, Maharashtra' },
  { id: '2', orderNumber: 'ORD-2024-002', customer: 'BigBasket', items: [{ sku: 'SKU002', name: 'Basmati Rice Premium', quantity: 200, price: 17000 }], total: 17000, status: 'shipped', createdAt: '2024-12-16', deliveryDate: '2024-12-19', address: 'Bangalore, Karnataka' },
  { id: '3', orderNumber: 'ORD-2024-003', customer: 'DMart', items: [{ sku: 'SKU003', name: 'Refined Sunflower Oil', quantity: 50, price: 9000 }, { sku: 'SKU004', name: 'Toor Dal', quantity: 80, price: 9600 }], total: 18600, status: 'processing', createdAt: '2024-12-17', deliveryDate: '2024-12-20', address: 'Pune, Maharashtra' },
  { id: '4', orderNumber: 'ORD-2024-004', customer: 'Spencer\'s', items: [{ sku: 'SKU006', name: 'Masoor Dal', quantity: 150, price: 14250 }], total: 14250, status: 'pending', createdAt: '2024-12-18', deliveryDate: '2024-12-21', address: 'Kolkata, West Bengal' },
  { id: '5', orderNumber: 'ORD-2024-005', customer: 'More Supermarket', items: [{ sku: 'SKU007', name: 'Mustard Oil', quantity: 75, price: 12375 }], total: 12375, status: 'processing', createdAt: '2024-12-18', deliveryDate: '2024-12-22', address: 'Chennai, Tamil Nadu' },
  { id: '6', orderNumber: 'ORD-2024-006', customer: 'Star Bazaar', items: [{ sku: 'SKU001', name: 'Organic Wheat Flour', quantity: 200, price: 9000 }], total: 9000, status: 'cancelled', createdAt: '2024-12-14', deliveryDate: '2024-12-18', address: 'Hyderabad, Telangana' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/orders.json');
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          setOrders(demoOrders);
        }
      } catch {
        setOrders(demoOrders);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalValue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
        {getStatusIcon(status)}
        {status}
      </span>
    );
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
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-500">Track and manage customer orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Processing</p>
          <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Shipped</p>
          <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Delivered</p>
          <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-bold">₹{(stats.totalValue / 1000).toFixed(0)}K</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order # or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.customer}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{order.items.length} item(s)</td>
                  <td className="px-4 py-3 text-sm font-medium">₹{order.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{order.createdAt}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{order.deliveryDate}</td>
                  <td className="px-4 py-3 text-sm">{getStatusBadge(order.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedOrder.orderNumber}</h2>
              {getStatusBadge(selectedOrder.status)}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{selectedOrder.customer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p className="font-medium">{selectedOrder.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between bg-gray-50 p-2 rounded">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="font-medium">₹{item.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg">₹{selectedOrder.total.toLocaleString()}</span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedOrder(null)}
              className="mt-6 w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Data Source Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📁 Load Your Own Data</h3>
        <p className="text-sm text-blue-800">
          Place your <code className="bg-blue-100 px-1 rounded">orders.json</code> file in the <code className="bg-blue-100 px-1 rounded">/public/data/</code> folder.
        </p>
      </div>
    </div>
  );
}
