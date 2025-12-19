'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Truck,
  Clock,
  DollarSign,
  Fuel,
  Leaf,
  Navigation,
  Package,
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  Route,
  RefreshCw,
  Bell
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface PendingOrder {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  recommendation?: string;
  source?: string;
  status?: string;
  createdAt?: string;
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  location: string;
}

interface RouteOption {
  id: string;
  name: string;
  from: string;
  to: string;
  distance: number;
  duration: number;
  cost: number;
  fuelConsumption: number;
  co2Emissions: number;
  isRecommended: boolean;
  steps: RouteStep[];
}

interface OptimizationResult {
  routes: RouteOption[];
  selectedRoute: RouteOption | null;
  origin: string;
  destination: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CITY_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
  'Delhi Central Hub': { lat: 28.7041, lng: 77.1025 },
  'Noida Warehouse B': { lat: 28.5355, lng: 77.3910 },
  'Mumbai Warehouse': { lat: 19.0760, lng: 72.8777 },
  'Pune Distribution': { lat: 18.5204, lng: 73.8567 },
  'Jaipur Center': { lat: 26.9124, lng: 75.7873 },
  'Chennai Port': { lat: 13.0827, lng: 80.2707 },
  'Bangalore DC': { lat: 12.9716, lng: 77.5946 },
};

const mockRouteSteps: RouteStep[] = [
  { instruction: 'Start at Delhi Central Hub', distance: '0 km', duration: '0 min', location: 'Delhi Central Hub, Connaught Place' },
  { instruction: 'Head east on NH44 toward Noida', distance: '12 km', duration: '18 min', location: 'NH44 Eastern Expressway' },
  { instruction: 'Take exit toward Sector 62', distance: '8 km', duration: '12 min', location: 'Noida Expressway Exit' },
  { instruction: 'Turn right onto Industrial Road', distance: '3 km', duration: '5 min', location: 'Sector 62 Industrial Area' },
  { instruction: 'Continue to Warehouse B', distance: '1.5 km', duration: '3 min', location: 'Noida Distribution Center' },
  { instruction: 'Arrive at destination', distance: '0 km', duration: '0 min', location: 'Noida Warehouse B, Gate 4' },
];

// ============================================================================
// HELPERS
// ============================================================================

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

function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  return value.toLocaleString();
}

function generateRouteCoordinates(fromLat: number, fromLng: number, toLat: number, toLng: number): Array<{ lat: number; lng: number }> {
  const coordinates = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    coordinates.push({
      lat: fromLat + (toLat - fromLat) * t + Math.sin(t * Math.PI) * 0.3,
      lng: fromLng + (toLng - fromLng) * t,
    });
  }
  return coordinates;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LogisticsOptimization() {
  const router = useRouter();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [selectedPendingOrder, setSelectedPendingOrder] = useState<PendingOrder | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [shipmentCreated, setShipmentCreated] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    order?: { orderNumber?: string; trackingNumber?: string };
    truck?: { vehicleNumber?: string; driverName?: string };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load pending orders from API and sessionStorage
  const loadPendingOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const allOrders: PendingOrder[] = [];
      
      // Check sessionStorage for order from demand forecasting
      const storedOrder = sessionStorage.getItem('pendingOrder');
      if (storedOrder) {
        try {
          const order = JSON.parse(storedOrder);
          allOrders.push({
            productId: order.productId || `PROD-${Date.now()}`,
            productName: order.productName || order.product || 'Product',
            quantity: order.quantity || 1,
            unitPrice: order.unitPrice || 0,
            total: order.total || 0,
            recommendation: order.recommendation,
            source: 'session',
          });
        } catch (e) {
          console.error('Failed to parse pending order:', e);
        }
      }

      // Fetch from API
      try {
        const response = await fetch('/api/pending-orders?status=pending', {
          headers: {
            'X-User-Email': getUserEmail(),
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            data.data.forEach((o: PendingOrder) => {
              // Avoid duplicates - check by productId
              const existingIndex = allOrders.findIndex(existing => existing.productId === o.productId);
              if (existingIndex === -1) {
                allOrders.push({
                  id: o.id,
                  productId: o.productId || `PROD-${Date.now()}`,
                  productName: o.productName || 'Product',
                  quantity: o.quantity || 1,
                  unitPrice: o.unitPrice || 0,
                  total: o.total || 0,
                  recommendation: o.recommendation,
                  source: o.source || 'api',
                });
              }
            });
          }
        }
      } catch (apiError) {
        console.warn('API unavailable, using session data only');
      }
      
      setPendingOrders(allOrders);
      
      // Auto-select first order
      if (allOrders.length > 0) {
        setSelectedPendingOrder(allOrders[0]);
      }
    } catch (err) {
      console.error('Error loading pending orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingOrders();
  }, [loadPendingOrders]);

  const clearPendingOrder = () => {
    sessionStorage.removeItem('pendingOrder');
    setPendingOrders(prev => prev.filter(o => o.source !== 'session'));
    if (selectedPendingOrder?.source === 'session') {
      setSelectedPendingOrder(pendingOrders.length > 1 ? pendingOrders[1] : null);
    }
  };

  const handleSelectPendingOrder = (order: PendingOrder) => {
    setSelectedPendingOrder(order);
  };

  const handleFindOptimalRoute = () => {
    setIsCalculating(true);
    setError(null);

    // Simulate API call for route optimization
    setTimeout(() => {
      const baseDistance = 24.5;
      const routes: RouteOption[] = [
        {
          id: 'route-1',
          name: 'Fastest Route',
          from: 'Delhi Central Hub',
          to: 'Noida Warehouse B',
          distance: baseDistance,
          duration: 38,
          cost: 1250,
          fuelConsumption: 3.2,
          co2Emissions: 8.4,
          isRecommended: true,
          steps: mockRouteSteps,
        },
        {
          id: 'route-2',
          name: 'Economical Route',
          from: 'Delhi Central Hub',
          to: 'Noida Warehouse B',
          distance: baseDistance + 5,
          duration: 48,
          cost: 980,
          fuelConsumption: 2.8,
          co2Emissions: 7.3,
          isRecommended: false,
          steps: mockRouteSteps.map(s => ({ ...s, duration: s.duration.replace(/\d+/, m => String(Math.round(parseInt(m) * 1.2))) })),
        },
        {
          id: 'route-3',
          name: 'Eco-Friendly Route',
          from: 'Delhi Central Hub',
          to: 'Noida Warehouse B',
          distance: baseDistance + 3,
          duration: 52,
          cost: 1100,
          fuelConsumption: 2.4,
          co2Emissions: 6.2,
          isRecommended: false,
          steps: mockRouteSteps.map(s => ({ ...s, duration: s.duration.replace(/\d+/, m => String(Math.round(parseInt(m) * 1.3))) })),
        },
      ];

      setOptimizationResult({
        routes,
        selectedRoute: routes[0],
        origin: 'Delhi Central Hub',
        destination: 'Noida Warehouse B',
      });
      setSelectedRouteId('route-1');
      setIsCalculating(false);
    }, 2000);
  };

  const handleSelectRoute = (routeId: string) => {
    if (!optimizationResult) return;
    const route = optimizationResult.routes.find(r => r.id === routeId);
    if (route) {
      setSelectedRouteId(routeId);
      setOptimizationResult({
        ...optimizationResult,
        selectedRoute: route,
      });
    }
  };

  const handleCreateShipment = async () => {
    setIsCreatingShipment(true);
    setError(null);

    try {
      const routeToUse = optimizationResult?.selectedRoute || optimizationResult?.routes[0];
      
      // Create default order if none selected - FIXED: ensure productId is always string
      const orderToUse: PendingOrder = selectedPendingOrder || {
        productId: `PROD-${Date.now()}`,
        productName: 'Sample Product',
        quantity: 100,
        unitPrice: 50,
        total: 5000,
      };

      if (!routeToUse) {
        throw new Error('No route selected');
      }

      const originCoords = CITY_COORDINATES[routeToUse.from] || { lat: 28.7041, lng: 77.1025 };
      const destCoords = CITY_COORDINATES[routeToUse.to] || { lat: 28.5355, lng: 77.3910 };

      const orderData = {
        customerName: 'Self',
        items: [{
          productId: orderToUse.productId, // Always string now
          productName: orderToUse.productName,
          quantity: orderToUse.quantity,
          unitPrice: orderToUse.unitPrice,
          total: orderToUse.total,
        }],
        totalAmount: orderToUse.total,
        shippingAddress: routeToUse.to,
        deliveryType: 'Heavy Truck',
        selectedRoute: {
          id: 1,
          from: routeToUse.from,
          to: routeToUse.to,
          distance: `${routeToUse.distance} km`,
          time: `${routeToUse.duration} min`,
          savings: '15%',
          fuelCost: routeToUse.cost,
          coordinates: generateRouteCoordinates(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng),
        },
        origin: {
          name: routeToUse.from,
          ...originCoords,
        },
        destination: {
          name: routeToUse.to,
          ...destCoords,
        },
      };

      const response = await fetch('/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': getUserEmail(),
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to place order');
      }

      setOrderResult(result.data);
      setShipmentCreated(true);

      // Clear pending order
      sessionStorage.removeItem('pendingOrder');
      
      // Update pending order status if it has an ID
      if (selectedPendingOrder?.id) {
        try {
          await fetch('/api/pending-orders', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Email': getUserEmail(),
            },
            body: JSON.stringify({ orderId: selectedPendingOrder.id, status: 'completed' }),
          });
        } catch (e) {
          console.warn('Could not update pending order status');
        }
      }

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push(`/dashboard?tracking=${result.data?.order?.trackingNumber || ''}`);
      }, 3000);

    } catch (err: unknown) {
      console.error('Error creating shipment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create shipment. Please try again.';
      setError(errorMessage);
    } finally {
      setIsCreatingShipment(false);
    }
  };

  const selectedRoute = optimizationResult?.routes.find(r => r.id === selectedRouteId);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logistics Optimization</h1>
          <p className="text-gray-500">AI-powered route planning and delivery optimization</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadPendingOrders}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {/* Pending Orders Banner */}
      {pendingOrders.length > 0 && !shipmentCreated && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Pending Orders ({pendingOrders.length})</h3>
                <p className="text-sm text-blue-700">Select an order to optimize route</p>
              </div>
            </div>
            {pendingOrders.some(o => o.source === 'session') && (
              <button
                onClick={clearPendingOrder}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg"
                title="Clear session order"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {pendingOrders.map((order, index) => (
              <div
                key={order.id || index}
                onClick={() => handleSelectPendingOrder(order)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedPendingOrder?.productId === order.productId
                    ? 'bg-blue-100 ring-2 ring-blue-500'
                    : 'bg-white hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{order.productName}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {order.quantity} | ₹{formatNumber(order.unitPrice)}/unit
                    </p>
                    {order.source === 'session' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        From Forecast
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">₹{formatNumber(order.total)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success State */}
      {shipmentCreated ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Shipment Created Successfully!</h2>
          <p className="text-gray-500 mb-4">Your order has been scheduled for delivery</p>
          
          {orderResult && (
            <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Order Number</p>
                  <p className="font-semibold">{orderResult?.order?.orderNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tracking</p>
                  <p className="font-semibold">{orderResult?.order?.trackingNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vehicle</p>
                  <p className="font-semibold">{orderResult?.truck?.vehicleNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Driver</p>
                  <p className="font-semibold">{orderResult?.truck?.driverName || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 text-green-700">
            <Bell className="w-4 h-4" />
            <span>Notification sent! Redirecting to dashboard...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Origin & Destination */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold mb-4">Route Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Origin</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Delhi Central Hub</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-0.5 h-8 bg-gray-300"></div>
                </div>

                <div>
                  <label className="block text-sm text-gray-500 mb-1">Destination</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium">Noida Warehouse B</span>
                  </div>
                </div>
              </div>

              {/* Find Route Button */}
              <button
                onClick={handleFindOptimalRoute}
                disabled={isCalculating}
                className={`w-full mt-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                  isCalculating
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Calculating Routes...
                  </>
                ) : (
                  <>
                    <Route className="w-5 h-5" />
                    Find Optimal Route
                  </>
                )}
              </button>
            </div>

            {/* Route Options */}
            {optimizationResult && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold mb-4">Available Routes</h2>
                <div className="space-y-3">
                  {optimizationResult.routes.map((route) => (
                    <div
                      key={route.id}
                      onClick={() => handleSelectRoute(route.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedRouteId === route.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{route.name}</span>
                        {route.isRecommended && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {route.distance} km
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {route.duration} min
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ₹{formatNumber(route.cost)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Route Details & Map */}
          <div className="lg:col-span-2 space-y-6">
            {!optimizationResult ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Route Selected</h3>
                <p className="text-gray-500">
                  Click &quot;Find Optimal Route&quot; to calculate the best delivery routes
                </p>
              </div>
            ) : (
              <>
                {/* Route Summary */}
                {selectedRoute && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-semibold mb-4">Route Summary: {selectedRoute.name}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{selectedRoute.distance}</p>
                        <p className="text-sm text-gray-500">km distance</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{selectedRoute.duration}</p>
                        <p className="text-sm text-gray-500">min duration</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <DollarSign className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">₹{formatNumber(selectedRoute.cost)}</p>
                        <p className="text-sm text-gray-500">estimated cost</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Fuel className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{selectedRoute.fuelConsumption}</p>
                        <p className="text-sm text-gray-500">liters fuel</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Leaf className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{selectedRoute.co2Emissions}</p>
                        <p className="text-sm text-gray-500">kg CO₂</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Route Steps */}
                {selectedRoute && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-semibold mb-4">Route Instructions</h2>
                    <div className="space-y-4">
                      {selectedRoute.steps.map((step, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              index === 0 ? 'bg-green-500 text-white' :
                              index === selectedRoute.steps.length - 1 ? 'bg-red-500 text-white' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {index + 1}
                            </div>
                            {index < selectedRoute.steps.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium">{step.instruction}</p>
                            <p className="text-sm text-gray-500">{step.location}</p>
                            <div className="flex gap-4 mt-1 text-xs text-gray-400">
                              <span>{step.distance}</span>
                              <span>{step.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create Shipment Button */}
                {selectedRoute && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Ready to create shipment?</h3>
                        <p className="text-sm text-gray-500">
                          Using {selectedRoute.name} - {selectedRoute.distance} km, {selectedRoute.duration} min
                        </p>
                        {selectedPendingOrder && (
                          <p className="text-sm text-blue-600 mt-1">
                            Order: {selectedPendingOrder.productName} x {selectedPendingOrder.quantity} = ₹{formatNumber(selectedPendingOrder.total)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleCreateShipment}
                        disabled={isCreatingShipment}
                        className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                          isCreatingShipment
                            ? 'bg-green-400 text-white cursor-wait'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isCreatingShipment ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Truck className="w-5 h-5" />
                            Confirm & Create Shipment
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
