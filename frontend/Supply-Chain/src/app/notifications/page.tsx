'use client';

import React, { useState } from 'react';
import { Bell, Package, Truck, AlertTriangle, CheckCircle, Clock, Trash2, Check } from 'lucide-react';

interface Notification {
  id: number;
  type: 'order' | 'delivery' | 'alert' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const demoNotifications: Notification[] = [
  { id: 1, type: 'order', title: 'New Order Received', message: 'Order #ORD-2847 from Fresh Mart has been placed', time: '5 min ago', read: false },
  { id: 2, type: 'delivery', title: 'Delivery Completed', message: 'Order #ORD-2845 has been delivered to Green Grocers', time: '15 min ago', read: false },
  { id: 3, type: 'alert', title: 'Low Stock Alert', message: 'Basmati Rice Premium is running low (23 units remaining)', time: '1 hour ago', read: false },
  { id: 4, type: 'system', title: 'System Update', message: 'Route optimization algorithm has been updated', time: '2 hours ago', read: true },
  { id: 5, type: 'order', title: 'Order Confirmed', message: 'Order #ORD-2843 payment confirmed', time: '3 hours ago', read: true },
  { id: 6, type: 'delivery', title: 'Shipment Dispatched', message: 'Order #ORD-2840 is on its way to Metro Supermarket', time: '4 hours ago', read: true },
  { id: 7, type: 'alert', title: 'Vehicle Maintenance Due', message: 'TRK-007 is due for scheduled maintenance', time: '5 hours ago', read: true },
  { id: 8, type: 'order', title: 'Bulk Order Alert', message: 'Large order #ORD-2838 requires approval (₹2.5L)', time: '6 hours ago', read: true },
];

const iconMap = {
  order: Package,
  delivery: Truck,
  alert: AlertTriangle,
  system: Bell,
};

const colorMap = {
  order: 'bg-blue-100 text-blue-600',
  delivery: 'bg-green-100 text-green-600',
  alert: 'bg-orange-100 text-orange-600',
  system: 'bg-purple-100 text-purple-600',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(demoNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'all' ? notifications : notifications.filter(n => !n.read);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">Stay updated with your supply chain activities</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <CheckCircle className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold">{notifications.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-500">Unread</span>
          </div>
          <p className="text-2xl font-bold">{unreadCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Orders</span>
          </div>
          <p className="text-2xl font-bold">{notifications.filter(n => n.type === 'order').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-500">Alerts</span>
          </div>
          <p className="text-2xl font-bold">{notifications.filter(n => n.type === 'alert').length}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="divide-y">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications to show</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = iconMap[notification.type];
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${colorMap[notification.type]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
