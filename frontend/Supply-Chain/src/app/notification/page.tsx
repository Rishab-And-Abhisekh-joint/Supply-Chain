'use client';

import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, XCircle, Check, Trash2, RefreshCw, Filter } from 'lucide-react';

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: 'inventory' | 'delivery' | 'system' | 'order';
}

const demoNotifications: Notification[] = [
  { id: '1', type: 'warning', title: 'Low Stock Alert', message: 'Refined Sunflower Oil is running low (320 units remaining). Consider reordering soon.', timestamp: '2024-12-18T10:30:00', read: false, category: 'inventory' },
  { id: '2', type: 'error', title: 'Out of Stock', message: 'Sugar (White) is out of stock. Reorder immediately to avoid supply chain disruption.', timestamp: '2024-12-18T09:15:00', read: false, category: 'inventory' },
  { id: '3', type: 'info', title: 'Delivery Completed', message: 'Order ORD-2024-001 has been successfully delivered to Reliance Fresh, Mumbai.', timestamp: '2024-12-17T16:45:00', read: true, category: 'delivery' },
  { id: '4', type: 'warning', title: 'Vehicle Maintenance Due', message: 'Vehicle UP05IJ7890 is due for scheduled maintenance. Please arrange service.', timestamp: '2024-12-18T08:00:00', read: false, category: 'system' },
  { id: '5', type: 'success', title: 'New Order Received', message: 'Order ORD-2024-005 received from More Supermarket worth ₹12,375.', timestamp: '2024-12-18T11:00:00', read: true, category: 'order' },
  { id: '6', type: 'info', title: 'Shipment Dispatched', message: 'Order ORD-2024-002 has been dispatched to BigBasket, Bangalore via DL02CD5678.', timestamp: '2024-12-17T14:30:00', read: true, category: 'delivery' },
  { id: '7', type: 'warning', title: 'Low Stock Alert', message: 'Chickpeas (Kabuli) stock is below minimum threshold (180 units).', timestamp: '2024-12-18T07:00:00', read: false, category: 'inventory' },
  { id: '8', type: 'success', title: 'Payment Received', message: 'Payment of ₹17,000 received from BigBasket for Order ORD-2024-002.', timestamp: '2024-12-17T10:00:00', read: true, category: 'order' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/notifications.json');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        } else {
          setNotifications(demoNotifications);
        }
      } catch {
        setNotifications(demoNotifications);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredNotifications = notifications.filter(n => {
    const matchesType = typeFilter === 'all' || n.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || n.category === categoryFilter;
    const matchesRead = !showUnreadOnly || !n.read;
    return matchesType && matchesCategory && matchesRead;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      'inventory': 'bg-purple-100 text-purple-800',
      'delivery': 'bg-blue-100 text-blue-800',
      'system': 'bg-gray-100 text-gray-800',
      'order': 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[category]}`}>
        {category}
      </span>
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <button 
          onClick={markAllAsRead}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          <Check className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 border shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="warning">Warnings</option>
              <option value="error">Errors</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="inventory">Inventory</option>
              <option value="delivery">Delivery</option>
              <option value="order">Order</option>
              <option value="system">System</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Show unread only</span>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications to show</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`rounded-xl border p-4 transition ${getTypeBgColor(notification.type)} ${!notification.read ? 'ring-2 ring-blue-200' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </h3>
                    {getCategoryBadge(notification.category)}
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">{formatTime(notification.timestamp)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
