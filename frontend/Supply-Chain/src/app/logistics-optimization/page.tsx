'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Truck, MapPin, Clock, Route, Play, RefreshCw, Navigation, 
  CheckCircle, Loader2, Package, ArrowRight, X, DollarSign,
  Fuel, AlertCircle
} from 'lucide-react';

interface RouteItem {
  id: number;
  from: string;
  to: string;
  distance: string;
  time: string;
  status: 'optimized' | 'calculating' | 'pending';
  savings: string;
  fuelCost: number;
  originalTime: string;
}

interface PendingOrder {
  id: string;
  product: string;
  sku: string;
  quantity: number;
  recommendedOrder: number;
  confidence: number;
  createdAt: string;
}

const initialRoutes: RouteItem[] = [
  { id: 1, from: 'Mumbai Warehouse', to: 'Pune Distribution', distance: '148 km', time: '3h 15m', status: 'pending', savings: '-', fuelCost: 1850, originalTime: '3h 45m' },
  { id: 2, from: 'Delhi Hub', to: 'Jaipur Center', distance: '281 km', time: '5h 30m', status: 'pending', savings: '-', fuelCost: 3200, originalTime: '6h 15m' },
  { id: 3, from: 'Chennai Port', to: 'Bangalore DC', distance: '346 km', time: '6h 45m', status: 'pending', savings: '-', fuelCost: 3850, originalTime: '7h 20m' },
  { id: 4, from: 'Kolkata Depot', to: 'Bhubaneswar', distance: '441 km', time: '8h 20m', status: 'pending', savings: '-', fuelCost: 4500, originalTime: '9h 30m' },
];

export default function LogisticsOptimizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [routes, setRoutes] = useState<RouteItem[]>(initialRoutes);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [isOptimizingAll, setIsOptimizingAll] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Check for pending order from demand forecasting
  useEffect(() => {
    // Check URL params first
    const orderData = searchParams.get('order');
    if (orderData) {
      try {
        const order = JSON.parse(decodeURIComponent(orderData));
        setPendingOrder(order);
      } catch (e) {
        console.error('Failed to parse order data from URL:', e);
      }
    }
    
    // Also check sessionStorage for orders (primary method)
    const storedOrder = sessionStorage.getItem('pendingOrder');
    if (storedOrder) {
      try {
        const order = JSON.parse(storedOrder);
        setPendingOrder(order);
        console.log('Loaded pending order from sessionStorage:', order);
      } catch (e) {
        console.error('Failed to parse stored order:', e);
      }
    }
  }, [searchParams]);

  // Calculate stats
  const totalRoutes = routes.length;
  const optimizedRoutes = routes.filter(r => r.status === 'optimized').length;
  const totalSavings = routes
    .filter(r => r.savings !== '-')
    .reduce((acc, r) => acc + parseFloat(r.savings.replace('%', '')), 0);
  const avgSavings = optimizedRoutes > 0 ? (totalSavings / optimizedRoutes).toFixed(0) : 0;
  const totalFuelSaved = routes
    .filter(r => r.status === 'optimized')
    .reduce((acc, r) => acc + (r.fuelCost * parseFloat(r.savings) / 100), 0);

  // Optimize a single route
  const optimizeSingleRoute = (routeId: number) => {
    // Set to calculating
    setRoutes(prev => prev.map(r => 
      r.id === routeId ? { ...r, status: 'calculating' as const } : r
    ));

    // Simulate optimization delay (1.5-2.5 seconds)
    setTimeout(() => {
      setRoutes(prev => prev.map(r => {
        if (r.id === routeId) {
          const savingsPercent = Math.floor(Math.random() * 10) + 5; // 5-15% savings
          return {
            ...r,
            status: 'optimized' as const,
            savings: `${savingsPercent}%`,
          };
        }
        return r;
      }));
    }, 1500 + Math.random() * 1000);
  };

  // Optimize all pending routes
  const optimizeAllRoutes = async () => {
    setIsOptimizingAll(true);

    // Get all pending routes
    const pendingRoutesList = routes.filter(r => r.status === 'pending');
    
    if (pendingRoutesList.length === 0) {
      setIsOptimizingAll(false);
      return;
    }

    // Set all pending routes to calculating first
    setRoutes(prev => prev.map(r => 
      r.status === 'pending' ? { ...r, status: 'calculating' as const } : r
    ));

    // Optimize routes one by one with staggered timing
    for (let i = 0; i < pendingRoutesList.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600));
      
      const routeId = pendingRoutesList[i].id;
      setRoutes(prev => prev.map(r => {
        if (r.id === routeId) {
          const savingsPercent = Math.floor(Math.random() * 10) + 5; // 5-15% savings
          return {
            ...r,
            status: 'optimized' as const,
            savings: `${savingsPercent}%`,
          };
        }
        return r;
      }));
    }

    setIsOptimizingAll(false);
  };

  // Reset all routes to initial state
  const resetRoutes = () => {
    setRoutes(initialRoutes);
    setSelectedRoute(null);
  };

  // Place the order
  const handlePlaceOrder = async () => {
    if (!pendingOrder) return;
    
    setIsPlacingOrder(true);
    
    // Simulate order placement API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Clear pending order from sessionStorage
    sessionStorage.removeItem('pendingOrder');
    
    setIsPlacingOrder(false);
    setShowOrderConfirmation(false);
    setOrderPlaced(true);
    
    // Redirect to dashboard after showing success
    setTimeout(() => {
      router.push('/dashboard?orderPlaced=true');
    }, 2000);
  };

  // Dismiss the pending order
  const dismissOrder = () => {
    sessionStorage.removeItem('pendingOrder');
    setPendingOrder(null);
    // Clear URL params if any
    router.replace('/logistics-optimization');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Optimization</h1>
          <p className="text-gray-500">Optimize delivery routes for efficiency</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetRoutes}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button 
            onClick={optimizeAllRoutes}
            disabled={isOptimizingAll || routes.every(r => r.status === 'optimized')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isOptimizingAll || routes.every(r => r.status === 'optimized')
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isOptimizingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Optimize All Routes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pending Order Banner - Shows when there's an order from Demand Forecasting */}
      {pendingOrder && !orderPlaced && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Order from Demand Forecasting</h3>
                <p className="text-sm text-blue-700">
                  {pendingOrder.product} ({pendingOrder.sku}) - {pendingOrder.recommendedOrder} units
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Based on {pendingOrder.confidence}% confidence forecast • Order ID: {pendingOrder.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowOrderConfirmation(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Place Order
              </button>
              <button
                onClick={dismissOrder}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Dismiss order"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Banner */}
      {orderPlaced && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900">Order Placed Successfully!</h3>
          <p className="text-green-700">Redirecting to dashboard...</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Route className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Active Routes</span>
          </div>
          <p className="text-2xl font-bold">{totalRoutes}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Optimized</span>
          </div>
          <p className="text-2xl font-bold">{optimizedRoutes}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-500">Avg Time Saved</span>
          </div>
          <p className="text-2xl font-bold">{avgSavings}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Fuel Saved</span>
          </div>
          <p className="text-2xl font-bold">₹{totalFuelSaved > 0 ? (totalFuelSaved / 1000).toFixed(1) + 'K' : '0'}</p>
        </div>
      </div>

      {/* Route List */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Route List</h2>
          {optimizedRoutes > 0 && (
            <span className="text-sm text-green-600 font-medium">
              {optimizedRoutes}/{totalRoutes} routes optimized
            </span>
          )}
        </div>
        <div className="divide-y">
          {routes.map((route) => (
            <div
              key={route.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedRoute === route.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedRoute(route.id === selectedRoute ? null : route.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    route.status === 'optimized' ? 'bg-green-100' :
                    route.status === 'calculating' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    <Truck className={`w-5 h-5 ${
                      route.status === 'optimized' ? 'text-green-600' :
                      route.status === 'calculating' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span className="font-medium">{route.from}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="font-medium">{route.to}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{route.distance}</span>
                      <span>•</span>
                      <span>{route.time}</span>
                      {route.status === 'optimized' && route.originalTime && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 line-through text-xs">{route.originalTime}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {route.savings !== '-' && (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <span>↓</span> {route.savings}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    {route.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          optimizeSingleRoute(route.id);
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        Optimize
                      </button>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      route.status === 'optimized' ? 'bg-green-100 text-green-700' :
                      route.status === 'calculating' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {route.status === 'calculating' && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {route.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Route Details - Shows when route is selected and optimized */}
              {selectedRoute === route.id && route.status === 'optimized' && (
                <div className="mt-4 pt-4 border-t bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Route Details</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Time Saved</span>
                      </div>
                      <p className="font-semibold text-green-600">{route.savings}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                        <Fuel className="w-4 h-4" />
                        <span className="text-sm">Fuel Cost</span>
                      </div>
                      <p className="font-semibold">₹{route.fuelCost.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">Savings</span>
                      </div>
                      <p className="font-semibold text-green-600">
                        ₹{Math.round(route.fuelCost * parseFloat(route.savings) / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Order Confirmation Modal */}
      {showOrderConfirmation && pendingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold">Confirm Order</h2>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">{pendingOrder.product}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">SKU:</span>
                      <span className="ml-2 font-medium">{pendingOrder.sku}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Quantity:</span>
                      <span className="ml-2 font-medium">{pendingOrder.recommendedOrder} units</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Confidence:</span>
                      <span className="ml-2 font-medium text-green-600">{pendingOrder.confidence}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Order ID:</span>
                      <span className="ml-2 font-medium text-xs">{pendingOrder.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>This order will be processed using the optimized routes above for efficient delivery.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowOrderConfirmation(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isPlacingOrder
                      ? 'bg-blue-400 text-white cursor-wait'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}