'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertTriangle,
  X,
  Database,
  Download
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  trackingNumber?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'in_transit' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  sourceWarehouseId?: string;
  destinationAddress?: string;
  destinationCity?: string;
  createdAt: string;
  deliveredAt?: string;
  estimatedDelivery?: string;
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

function normalizeOrder(item: any, index: number): Order {
  return {
    id: item.id || `ORD-${String(index + 1).padStart(3, '0')}`,
    orderNumber: item.orderNumber || item.order_number || `ORD-${Date.now().toString(36).toUpperCase()}`,
    trackingNumber: item.trackingNumber || item.tracking_number || '',
    customerName: item.customerName || item.customer_name || 'Unknown Customer',
    customerEmail: item.customerEmail || item.customer_email || '',
    customerPhone: item.customerPhone || item.customer_phone || '',
    items: item.items || [],
    totalAmount: parseFloat(item.totalAmount || item.total_amount) || 0,
    status: item.status || 'pending',
    paymentStatus: item.paymentStatus || item.payment_status || 'pending',
    sourceWarehouseId: item.sourceWarehouseId || item.source_warehouse_id || '',
    destinationAddress: item.destinationAddress || item.destination_address || '',
    destinationCity: item.destinationCity || item.destination_city || '',
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    deliveredAt: item.deliveredAt || item.delivered_at || '',
    estimatedDelivery: item.estimatedDelivery || item.estimated_delivery || '',
  };
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ComponentType<any> }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle },
  processing: { label: 'Processing', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Package },
  in_transit: { label: 'In Transit', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
};

// ============================================================================
// DEMO DATA
// ============================================================================

const DEMO_ORDERS: Order[] = [
  {
    id: 'DEMO-001', orderNumber: 'ORD-DEMO01', trackingNumber: 'TRK-DEMO0001', customerName: 'Reliance Fresh',
    items: [{ productId: 'P1', productName: 'Organic Wheat Flour', quantity: 100, unitPrice: 65, total: 6500 }],
    totalAmount: 6500, status: 'delivered', paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'DEMO-002', orderNumber: 'ORD-DEMO02', trackingNumber: 'TRK-DEMO0002', customerName: 'BigBasket',
    items: [{ productId: 'P2', productName: 'Basmati Rice Premium', quantity: 200, unitPrice: 120, total: 24000 }],
    totalAmount: 24000, status: 'in_transit', paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'DEMO-003', orderNumber: 'ORD-DEMO03', customerName: 'Metro Supermart',
    items: [
      { productId: 'P3', productName: 'Sunflower Oil', quantity: 50, unitPrice: 185, total: 9250 },
      { productId: 'P4', productName: 'Toor Dal', quantity: 80, unitPrice: 145, total: 11600 },
    ],
    totalAmount: 20850, status: 'processing', paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<string>('loading');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const userEmail = getUserEmail();

    try {
      let allOrders: Order[] = [];
      let source = 'demo';

      // 1. First fetch from uploaded JSON data
      const uploadedRes = await fetch('/api/data?type=orders', {
        headers: { 'X-User-Email': userEmail }
      });

      if (uploadedRes.ok) {
        const uploadedJson = await uploadedRes.json();
        if (uploadedJson.success && uploadedJson.data && Array.isArray(uploadedJson.data) && uploadedJson.data.length > 0) {
          allOrders = uploadedJson.data.map((item: any, index: number) => normalizeOrder(item, index));
          source = uploadedJson.source || 'user_data';
        }
      }

      // 2. Also fetch from database orders (placed through the system)
      const dbRes = await fetch('/api/orders', {
        headers: { 'X-User-Email': userEmail }
      });

      if (dbRes.ok) {
        const dbJson = await dbRes.json();
        if (dbJson.success && dbJson.data && Array.isArray(dbJson.data)) {
          const existingIds = new Set(allOrders.map(o => o.id));
          const existingOrderNumbers = new Set(allOrders.map(o => o.orderNumber));
          
          dbJson.data.forEach((item: any) => {
            if (!existingIds.has(item.id) && !existingOrderNumbers.has(item.orderNumber)) {
              allOrders.push(normalizeOrder(item, allOrders.length));
            }
          });

          if (allOrders.length > 0 && source === 'demo') {
            source = 'database';
          }
        }
      }

      if (allOrders.length === 0) {
        allOrders = DEMO_ORDERS;
        source = 'demo';
      }

      allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(allOrders);
      setDataSource(source);

    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
      setOrders(DEMO_ORDERS);
      setDataSource('demo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const inTransitOrders = orders.filter(o => o.status === 'in_transit').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0);

  const exportToCSV = () => {
    const headers = ['Order Number', 'Customer', 'Items', 'Total', 'Status', 'Payment', 'Created'];
    const rows = filteredOrders.map(o => [
      o.orderNumber, o.customerName,
      o.items.map(i => `${i.productName} x${i.quantity}`).join('; '),
      o.totalAmount, o.status, o.paymentStatus || 'N/A',
      new Date(o.createdAt).toLocaleDateString(),
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-500">Track and manage all orders</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />Export
          </button>
        </div>
      </div>

      <div className={`p-3 rounded-lg flex items-center gap-3 ${dataSource === 'demo' ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
        <Database className={`w-5 h-5 ${dataSource === 'demo' ? 'text-yellow-600' : 'text-green-600'}`} />
        <p className={`text-sm font-medium ${dataSource === 'demo' ? 'text-yellow-800' : 'text-green-800'}`}>
          {dataSource === 'demo' ? 'Showing demo data. Upload orders.json in Settings → Data Management to see your data.' : `Loaded ${orders.length} orders from ${dataSource}`}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" /><p className="text-red-800">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4 text-red-600" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Package className="w-5 h-5 text-blue-500" /><span className="text-sm text-gray-500">Total Orders</span></div>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-yellow-500" /><span className="text-sm text-gray-500">Pending</span></div>
          <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Truck className="w-5 h-5 text-indigo-500" /><span className="text-sm text-gray-500">In Transit</span></div>
          <p className="text-2xl font-bold text-indigo-600">{inTransitOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-sm text-gray-500">Completed</span></div>
          <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Package className="w-5 h-5 text-purple-500" /><span className="text-sm text-gray-500">Revenue</span></div>
          <p className="text-2xl font-bold">₹{(totalRevenue / 1000).toFixed(1)}K</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by order number, customer, or tracking..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Order</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Customer</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Items</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Total</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No orders found</td></tr>
              ) : (
                filteredOrders.map(order => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-blue-600">{order.orderNumber}</p>
                        {order.trackingNumber && <p className="text-xs text-gray-500">{order.trackingNumber}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.customerName}</p>
                        {order.destinationCity && <p className="text-xs text-gray-500">{order.destinationCity}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{order.items.map(i => i.productName).join(', ')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">₹{order.totalAmount.toLocaleString()}</p>
                        {order.paymentStatus && <span className={`text-xs ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'refunded' ? 'text-red-600' : 'text-yellow-600'}`}>{order.paymentStatus}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />{status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedOrder(order)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t bg-gray-50">
          <p className="text-sm text-gray-600">Showing {filteredOrders.length} of {orders.length} orders</p>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Order Number</p><p className="font-medium">{selectedOrder.orderNumber}</p></div>
                <div><p className="text-sm text-gray-500">Tracking Number</p><p className="font-medium">{selectedOrder.trackingNumber || 'N/A'}</p></div>
                <div><p className="text-sm text-gray-500">Customer</p><p className="font-medium">{selectedOrder.customerName}</p></div>
                <div><p className="text-sm text-gray-500">Status</p><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedOrder.status]?.bgColor} ${statusConfig[selectedOrder.status]?.color}`}>{statusConfig[selectedOrder.status]?.label || selectedOrder.status}</span></div>
                <div><p className="text-sm text-gray-500">Created</p><p className="font-medium">{formatDate(selectedOrder.createdAt)}</p></div>
                <div><p className="text-sm text-gray-500">Payment</p><p className={`font-medium ${selectedOrder.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{selectedOrder.paymentStatus || 'Pending'}</p></div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Order Items</p>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="p-3 flex justify-between items-center">
                      <div><p className="font-medium">{item.productName}</p><p className="text-sm text-gray-500">{item.quantity} × ₹{item.unitPrice.toLocaleString()}</p></div>
                      <p className="font-medium">₹{item.total.toLocaleString()}</p>
                    </div>
                  ))}
                  <div className="p-3 bg-gray-50 flex justify-between items-center">
                    <p className="font-semibold">Total</p>
                    <p className="font-bold text-lg">₹{selectedOrder.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              {selectedOrder.destinationAddress && (
                <div><p className="text-sm text-gray-500 mb-1">Delivery Address</p><p className="font-medium">{selectedOrder.destinationAddress}</p>{selectedOrder.destinationCity && <p className="text-sm text-gray-500">{selectedOrder.destinationCity}</p>}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}