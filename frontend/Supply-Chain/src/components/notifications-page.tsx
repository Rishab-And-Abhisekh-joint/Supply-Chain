'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bell, Package, Truck, AlertTriangle, CheckCircle, Clock, Trash2, Check,
  RefreshCw, Loader2 
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'order' | 'delivery' | 'alert' | 'system';
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  trackingNumber?: string;
  timestamp: string;
  read: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  order: Package,
  delivery: Truck,
  alert: AlertTriangle,
  system: Bell,
};

const colorMap: Record<string, string> = {
  order: 'bg-blue-100 text-blue-600',
  delivery: 'bg-green-100 text-green-600',
  alert: 'bg-orange-100 text-orange-600',
  system: 'bg-purple-100 text-purple-600',
};

// Demo notifications for fallback
const DEMO_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'order', title: 'New Order Received', message: 'Order #ORD-2847 from Fresh Mart has been placed', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), read: false },
  { id: '2', type: 'delivery', title: 'Delivery Completed', message: 'Order #ORD-2845 has been delivered to Green Grocers', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), read: false },
  { id: '3', type: 'alert', title: 'Low Stock Alert', message: 'Basmati Rice Premium is running low (23 units remaining)', timestamp: new Date(Date.now() - 60 * 60000).toISOString(), read: false },
  { id: '4', type: 'system', title: 'System Update', message: 'Route optimization algorithm has been updated', timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(), read: true },
  { id: '5', type: 'order', title: 'Order Confirmed', message: 'Order #ORD-2843 payment confirmed', timestamp: new Date(Date.now() - 3 * 60 * 60000).toISOString(), read: true },
];

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Get user email from localStorage
function getUserEmail(): string {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.email || 'demo@example.com';
      } catch {
        return 'demo@example.com';
      }
    }
  }
  return 'demo@example.com';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'X-User-Email': getUserEmail(),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          setNotifications(data.data);
          return;
        }
      }
      // Use demo data if no real data
      setNotifications(DEMO_NOTIFICATIONS);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications(DEMO_NOTIFICATIONS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'all' ? notifications : notifications.filter(n => !n.read);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    // API call
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': getUserEmail(),
        },
        body: JSON.stringify({ notificationIds: [id] }),
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    // API call
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': getUserEmail(),
        },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // API call
    try {
      await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': getUserEmail(),
        },
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">Stay updated with your supply chain activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-blue-600 hover:bg-blue-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <p className="text-2xl font-bold">{notifications.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-500">Unread</span>
            </div>
            <p className="text-2xl font-bold">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-500">Orders</span>
            </div>
            <p className="text-2xl font-bold">{notifications.filter(n => n.type === 'order').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-gray-500">Alerts</span>
            </div>
            <p className="text-2xl font-bold">{notifications.filter(n => n.type === 'alert').length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      <Card className="bg-white rounded-xl border shadow-sm">
        <div className="divide-y">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications to show</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = iconMap[notification.type] || Bell;
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${colorMap[notification.type] || colorMap.system}`}>
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
                      {notification.orderNumber && (
                        <p className="text-xs text-blue-600 mt-1">
                          Order: {notification.orderNumber}
                          {notification.trackingNumber && ` • Tracking: ${notification.trackingNumber}`}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(notification.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotification(notification.id)}
                        title="Delete"
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
