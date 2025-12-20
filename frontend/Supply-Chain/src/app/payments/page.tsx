'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import {
  CreditCard, IndianRupee, Package, Clock, CheckCircle, XCircle,
  AlertCircle, Loader2, RefreshCw, Search, Filter, Download,
  Wallet, ArrowUpRight, ArrowDownLeft, X, Smartphone, Building2,
  ShieldCheck, Receipt, Settings
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: { productName: string; quantity: number; unitPrice: number; total: number }[];
  totalAmount: number;
  status: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
}

interface Payment {
  id: string;
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  description: string;
  createdAt: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getUserEmail(): string {
  if (typeof window === 'undefined') return 'demo@example.com';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr).email || 'demo@example.com';
  } catch { }
  return 'demo@example.com';
}

function getUserName(): string {
  if (typeof window === 'undefined') return '';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
  } catch { }
  return '';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PaymentsPage() {
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'unpaid' | 'history'>('unpaid');
  const [searchTerm, setSearchTerm] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // ============================================================================
  // LOAD DATA
  // ============================================================================

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const userEmail = getUserEmail();

    try {
      // Load unpaid orders from JSON data
      const ordersRes = await fetch('/api/data?type=orders', {
        headers: { 'X-User-Email': userEmail }
      });
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (ordersData.success && Array.isArray(ordersData.data)) {
          const unpaid = ordersData.data.filter((o: any) => 
            o.paymentStatus !== 'paid' && o.status !== 'cancelled'
          ).map((o: any, i: number) => ({
            id: o.id || `order-${i}`,
            orderNumber: o.orderNumber || o.order_number || `ORD-${i + 1}`,
            customerName: o.customerName || o.customer_name || 'Customer',
            items: o.items || [],
            totalAmount: parseFloat(o.totalAmount || o.total_amount || o.total) || 0,
            status: o.status || 'pending',
            paymentStatus: o.paymentStatus || o.payment_status || 'pending',
            createdAt: o.createdAt || o.created_at || new Date().toISOString(),
          }));
          setUnpaidOrders(unpaid);
        }
      }

      // Also check database orders
      const dbOrdersRes = await fetch('/api/orders', {
        headers: { 'X-User-Email': userEmail }
      });
      
      if (dbOrdersRes.ok) {
        const dbData = await dbOrdersRes.json();
        if (dbData.success && Array.isArray(dbData.data)) {
          const dbUnpaid = dbData.data.filter((o: any) => 
            o.paymentStatus !== 'paid' && o.status !== 'cancelled' && o.status !== 'delivered'
          ).map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName || 'Self',
            items: o.items || [],
            totalAmount: o.totalAmount || 0,
            status: o.status,
            paymentStatus: o.paymentStatus || 'pending',
            createdAt: o.createdAt,
          }));
          
          setUnpaidOrders(prev => {
            const existingIds = new Set(prev.map(o => o.id));
            const newOrders = dbUnpaid.filter((o: Order) => !existingIds.has(o.id));
            return [...prev, ...newOrders];
          });
        }
      }

      // Load payment history - UPDATED to use /api/auth/payments
      const paymentsRes = await fetch('/api/auth/payments', {
        headers: { 'X-User-Email': userEmail }
      });
      
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        if (paymentsData.success) {
          setPayments(paymentsData.data || []);
        }
      }

    } catch (e) {
      console.error('Error loading data:', e);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ============================================================================
  // INITIATE PAYMENT
  // ============================================================================

  const initiatePayment = async (order: Order) => {
    if (!razorpayLoaded) {
      setError('Payment system is loading. Please try again.');
      return;
    }

    setIsProcessing(order.id);
    setError(null);

    try {
      // Create order in backend - UPDATED to use /api/auth/payments
      const res = await fetch('/api/auth/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Email': getUserEmail() },
        body: JSON.stringify({
          action: 'create_order',
          amount: order.totalAmount,
          orderId: order.id,
          description: `Payment for Order ${order.orderNumber}`,
          items: order.items,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment order');
      }

      // Open Razorpay checkout
      const options = {
        key: data.data.keyId,
        amount: data.data.amount * 100,
        currency: data.data.currency,
        name: 'SupplyChain',
        description: `Order ${order.orderNumber}`,
        order_id: data.data.razorpayOrderId,
        prefill: {
          email: getUserEmail(),
          name: getUserName(),
        },
        theme: {
          color: '#2563eb',
        },
        handler: async function (response: any) {
          try {
            // UPDATED to use /api/auth/payments
            const verifyRes = await fetch('/api/auth/payments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-User-Email': getUserEmail() },
              body: JSON.stringify({
                action: 'verify_payment',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setSuccess(`Payment successful for Order ${order.orderNumber}!`);
              loadData();
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch (e) {
            setError('Payment verification error. Please contact support.');
          }
          setIsProcessing(null);
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (e: any) {
      setError(e.message || 'Payment initiation failed');
      setIsProcessing(null);
    }
  };

  // ============================================================================
  // DEMO PAYMENT
  // ============================================================================

  const demoPayment = async (order: Order) => {
    setIsProcessing(order.id);
    setError(null);

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // UPDATED to use /api/auth/payments
      const res = await fetch('/api/auth/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Email': getUserEmail() },
        body: JSON.stringify({
          action: 'create_order',
          amount: order.totalAmount,
          orderId: order.id,
          description: `Payment for Order ${order.orderNumber}`,
          items: order.items,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // UPDATED to use /api/auth/payments
        await fetch('/api/auth/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Email': getUserEmail() },
          body: JSON.stringify({
            action: 'verify_payment',
            razorpay_order_id: data.data.razorpayOrderId,
            razorpay_payment_id: `pay_demo_${Date.now()}`,
            razorpay_signature: 'demo_signature',
          }),
        });

        setSuccess(`Payment successful for Order ${order.orderNumber}! (Demo Mode)`);
        loadData();
      }
    } catch (e: any) {
      setError(e.message || 'Payment failed');
    }
    setIsProcessing(null);
  };

  // ============================================================================
  // EXPORT
  // ============================================================================

  const exportPayments = () => {
    const headers = ['Date', 'Order', 'Amount', 'Status', 'Payment ID'];
    const rows = payments.map(p => [
      new Date(p.createdAt).toLocaleDateString(),
      p.orderId || 'N/A',
      `₹${p.amount}`,
      p.status,
      p.razorpayPaymentId || 'N/A',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const filteredUnpaid = unpaidOrders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnpaid = unpaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-7 h-7 text-blue-600" />Payments
            </h1>
            <p className="text-gray-500">Pay for orders and view payment history</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/settings/payments"
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />Payment Settings
            </Link>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />Refresh
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />{error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
            <CheckCircle className="w-5 h-5" />{success}
            <button onClick={() => setSuccess(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-gray-500">Pending Payment</span>
            </div>
            <p className="text-2xl font-bold text-red-600">₹{totalUnpaid.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{unpaidOrders.length} orders</p>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-500">Total Paid</span>
            </div>
            <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{payments.filter(p => p.status === 'completed').length} payments</p>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-500">Total Transactions</span>
            </div>
            <p className="text-2xl font-bold">{payments.length}</p>
            <p className="text-sm text-gray-500">All time</p>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-gray-500">Payment Gateway</span>
            </div>
            <p className="text-lg font-semibold text-purple-600">Razorpay</p>
            <p className="text-sm text-gray-500">{razorpayLoaded ? 'Connected' : 'Loading...'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b">
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`px-4 py-3 border-b-2 font-medium transition ${
              activeTab === 'unpaid'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Payments
              {unpaidOrders.length > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                  {unpaidOrders.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 border-b-2 font-medium transition ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Payment History
            </span>
          </button>
        </div>

        {/* Unpaid Orders Tab */}
        {activeTab === 'unpaid' && (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {filteredUnpaid.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700">All Caught Up!</h3>
                <p className="text-gray-500">No pending payments. All orders are paid.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredUnpaid.map(order => (
                  <div key={order.id} className="bg-white border rounded-xl p-5 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-5 h-5 text-gray-400" />
                          <span className="font-semibold text-blue-600">{order.orderNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{order.customerName}</p>
                        <div className="text-sm text-gray-500">
                          {order.items.slice(0, 2).map((item, i) => (
                            <span key={i}>
                              {item.productName} × {item.quantity}
                              {i < Math.min(order.items.length, 2) - 1 && ', '}
                            </span>
                          ))}
                          {order.items.length > 2 && ` +${order.items.length - 2} more`}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 mb-3">
                          ₹{order.totalAmount.toLocaleString()}
                        </p>
                        <button
                          onClick={() => razorpayLoaded ? initiatePayment(order) : demoPayment(order)}
                          disabled={isProcessing === order.id}
                          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isProcessing === order.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              Pay Now
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Methods Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Accepted Payment Methods</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm">
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">GPay / PhonePe / UPI</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Credit / Debit Cards</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">Net Banking</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{payments.length} transactions</p>
              <button
                onClick={exportPayments}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />Export
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-12 text-center">
                <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No Payment History</h3>
                <p className="text-gray-500">Your completed payments will appear here.</p>
              </div>
            ) : (
              <div className="bg-white border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Date</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Description</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Amount</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Payment ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{payment.description || 'Order Payment'}</p>
                          {payment.orderId && (
                            <p className="text-xs text-gray-500">Order: {payment.orderId.slice(0, 8)}...</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">₹{payment.amount.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {payment.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                            {payment.status === 'pending' && <Clock className="w-3 h-3" />}
                            {payment.status === 'failed' && <XCircle className="w-3 h-3" />}
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                          {payment.razorpayPaymentId ? payment.razorpayPaymentId.slice(0, 14) + '...' : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}