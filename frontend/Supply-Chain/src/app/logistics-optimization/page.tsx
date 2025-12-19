"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, MapPin, Clock, DollarSign, Fuel, Package, 
  ArrowRight, CheckCircle, AlertCircle, Loader2, Route,
  Navigation, TrendingDown, Warehouse, Target
} from 'lucide-react';
import { placeOrder, PlaceOrderData } from '@/lib/services/supplychain-api';

// City coordinates for route mapping
const CITY_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
  'Mumbai Warehouse': { lat: 19.0760, lng: 72.8777 },
  'Pune Distribution': { lat: 18.5204, lng: 73.8567 },
  'Delhi Hub': { lat: 28.7041, lng: 77.1025 },
  'Jaipur Center': { lat: 26.9124, lng: 75.7873 },
  'Chennai Port': { lat: 13.0827, lng: 80.2707 },
  'Bangalore DC': { lat: 12.9716, lng: 77.5946 },
  'Kolkata Depot': { lat: 22.5726, lng: 88.3639 },
  'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
};

// Sample routes for optimization
const SAMPLE_ROUTES = [
  { id: 1, from: 'Mumbai Warehouse', to: 'Pune Distribution', distance: '150 km', time: '3h', savings: '12%', fuelCost: 2500 },
  { id: 2, from: 'Delhi Hub', to: 'Jaipur Center', distance: '280 km', time: '5h', savings: '18%', fuelCost: 4200 },
  { id: 3, from: 'Chennai Port', to: 'Bangalore DC', distance: '350 km', time: '6h', savings: '15%', fuelCost: 5100 },
  { id: 4, from: 'Kolkata Depot', to: 'Bhubaneswar', distance: '440 km', time: '8h', savings: '20%', fuelCost: 6500 },
  { id: 5, from: 'Mumbai Warehouse', to: 'Ahmedabad', distance: '530 km', time: '9h', savings: '22%', fuelCost: 7800 },
  { id: 6, from: 'Delhi Hub', to: 'Kolkata Depot', distance: '1450 km', time: '24h', savings: '25%', fuelCost: 18500 },
];

interface PendingOrder {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  recommendation?: string;
}

interface OptimizedRoute {
  id: number;
  from: string;
  to: string;
  distance: string;
  time: string;
  savings: string;
  fuelCost: number;
  optimized?: boolean;
  newDistance?: string;
  newTime?: string;
  newFuelCost?: number;
}

export default function LogisticsOptimizationPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<OptimizedRoute[]>(SAMPLE_ROUTES);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load pending order from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('pendingOrder');
      if (stored) {
        try {
          setPendingOrder(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse pending order:', e);
        }
      }
    }
  }, []);

  // Optimize all routes
  const handleOptimizeRoutes = async () => {
    setIsOptimizing(true);
    setError(null);
    
    // Simulate optimization process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const optimizedRoutes = routes.map(route => {
      const savingsPercent = parseInt(route.savings) / 100;
      const distanceNum = parseInt(route.distance);
      const timeNum = parseInt(route.time);
      
      return {
        ...route,
        optimized: true,
        newDistance: `${Math.round(distanceNum * (1 - savingsPercent * 0.3))} km`,
        newTime: `${Math.round(timeNum * (1 - savingsPercent * 0.2))}h`,
        newFuelCost: Math.round(route.fuelCost * (1 - savingsPercent)),
      };
    });
    
    setRoutes(optimizedRoutes);
    setIsOptimizing(false);
    setOptimizationComplete(true);
  };

  // Select a route for the order
  const handleSelectRoute = (route: OptimizedRoute) => {
    setSelectedRoute(route);
  };

  // Place the order
  const handlePlaceOrder = async () => {
    if (!pendingOrder || !selectedRoute) {
      // If no pending order, select first optimized route
      if (!selectedRoute && routes.length > 0) {
        setSelectedRoute(routes.find(r => r.optimized) || routes[0]);
      }
      if (!pendingOrder) {
        // Create a sample order for demo
        setPendingOrder({
          productId: 'PROD-001',
          productName: 'Sample Product',
          quantity: 100,
          unitPrice: 50,
          total: 5000,
        });
      }
      setShowOrderConfirm(true);
      return;
    }
    setShowOrderConfirm(true);
  };

  // Confirm and submit the order to PostgreSQL
  const handleConfirmOrder = async () => {
    setIsPlacingOrder(true);
    setError(null);

    try {
      const routeToUse = selectedRoute || routes.find(r => r.optimized) || routes[0];
      const orderToUse = pendingOrder || {
        productId: 'PROD-001',
        productName: 'Sample Product',
        quantity: 100,
        unitPrice: 50,
        total: 5000,
      };

      // Get coordinates for origin and destination
      const originCoords = CITY_COORDINATES[routeToUse.from] || { lat: 19.0760, lng: 72.8777 };
      const destCoords = CITY_COORDINATES[routeToUse.to] || { lat: 18.5204, lng: 73.8567 };

      // Generate route coordinates for map display
      const generateRouteCoordinates = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
        const coords = [];
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          coords.push({
            lat: from.lat + (to.lat - from.lat) * t + Math.sin(t * Math.PI) * 0.3,
            lng: from.lng + (to.lng - from.lng) * t,
          });
        }
        return coords;
      };

      const orderData: PlaceOrderData = {
        customerName: 'Self',
        items: [{
          productId: orderToUse.productId,
          productName: orderToUse.productName,
          quantity: orderToUse.quantity,
          unitPrice: orderToUse.unitPrice,
          total: orderToUse.total,
        }],
        totalAmount: orderToUse.total,
        shippingAddress: routeToUse.to,
        deliveryType: 'Heavy Truck',
        selectedRoute: {
          id: routeToUse.id,
          from: routeToUse.from,
          to: routeToUse.to,
          distance: routeToUse.newDistance || routeToUse.distance,
          time: routeToUse.newTime || routeToUse.time,
          savings: routeToUse.savings,
          fuelCost: routeToUse.newFuelCost || routeToUse.fuelCost,
          coordinates: generateRouteCoordinates(originCoords, destCoords),
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

      // Call the API to place order
      const result = await placeOrder(orderData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to place order');
      }

      setOrderResult(result.data);

      // Clear pending order from session
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingOrder');
      }

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push(`/dashboard?tracking=${result.data?.order?.trackingNumber}`);
      }, 3000);

    } catch (err: any) {
      console.error('Error placing order:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const totalSavings = routes
    .filter(r => r.optimized)
    .reduce((sum, r) => sum + (r.fuelCost - (r.newFuelCost || r.fuelCost)), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Route Optimization</h1>
          <p className="text-muted-foreground">
            Optimize delivery routes and place orders with assigned trucks
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleOptimizeRoutes} 
            disabled={isOptimizing || optimizationComplete}
          >
            {isOptimizing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : optimizationComplete ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Optimized
              </>
            ) : (
              <>
                <Route className="w-4 h-4 mr-2" />
                Optimize All Routes
              </>
            )}
          </Button>
          {optimizationComplete && (
            <Button onClick={handlePlaceOrder} variant="default">
              <Package className="w-4 h-4 mr-2" />
              Place Order
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Order Success Banner */}
      {orderResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800">Order Placed Successfully!</h3>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">Order Number:</span>
                    <p className="font-semibold text-green-900">{orderResult.order?.orderNumber}</p>
                  </div>
                  <div>
                    <span className="text-green-600">Tracking:</span>
                    <p className="font-semibold text-green-900">{orderResult.order?.trackingNumber}</p>
                  </div>
                  <div>
                    <span className="text-green-600">Vehicle:</span>
                    <p className="font-semibold text-green-900">{orderResult.truck?.vehicleNumber}</p>
                  </div>
                  <div>
                    <span className="text-green-600">Driver:</span>
                    <p className="font-semibold text-green-900">{orderResult.truck?.driverName}</p>
                  </div>
                </div>
                <p className="mt-3 text-green-700">
                  Redirecting to dashboard to track your shipment...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Route className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Routes</p>
              <p className="text-2xl font-bold">{routes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Optimized</p>
              <p className="text-2xl font-bold">{routes.filter(r => r.optimized).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Savings</p>
              <p className="text-2xl font-bold">₹{totalSavings.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingDown className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Savings</p>
              <p className="text-2xl font-bold">
                {routes.length > 0 
                  ? `${Math.round(routes.reduce((sum, r) => sum + parseInt(r.savings), 0) / routes.length)}%`
                  : '0%'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Order Card */}
      {pendingOrder && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Pending Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{pendingOrder.productName}</p>
                <p className="text-sm text-muted-foreground">
                  Quantity: {pendingOrder.quantity} | Unit Price: ₹{pendingOrder.unitPrice}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">₹{pendingOrder.total.toLocaleString()}</p>
                <Badge variant="outline">{pendingOrder.recommendation || 'Ready for Shipment'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((route) => (
          <Card 
            key={route.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRoute?.id === route.id 
                ? 'ring-2 ring-green-500 border-green-500' 
                : route.optimized 
                  ? 'border-green-200' 
                  : ''
            }`}
            onClick={() => route.optimized && handleSelectRoute(route)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base flex items-center gap-2">
                  <Warehouse className="w-4 h-4" />
                  Route {route.id}
                </CardTitle>
                {route.optimized && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Optimized
                  </Badge>
                )}
                {selectedRoute?.id === route.id && (
                  <Badge className="bg-blue-100 text-blue-800">
                    Selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Route Path */}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="font-medium">{route.from}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="font-medium">{route.to}</span>
              </div>

              {/* Route Details */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Navigation className="w-4 h-4 text-muted-foreground" />
                  <span className={route.optimized ? 'line-through text-muted-foreground' : ''}>
                    {route.distance}
                  </span>
                  {route.optimized && route.newDistance && (
                    <span className="text-green-600 font-medium">{route.newDistance}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className={route.optimized ? 'line-through text-muted-foreground' : ''}>
                    {route.time}
                  </span>
                  {route.optimized && route.newTime && (
                    <span className="text-green-600 font-medium">{route.newTime}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Fuel className="w-4 h-4 text-muted-foreground" />
                  <span className={route.optimized ? 'line-through text-muted-foreground' : ''}>
                    ₹{route.fuelCost}
                  </span>
                  {route.optimized && route.newFuelCost && (
                    <span className="text-green-600 font-medium">₹{route.newFuelCost}</span>
                  )}
                </div>
              </div>

              {/* Savings Badge */}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">Potential Savings</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  {route.savings}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Confirmation Modal */}
      {showOrderConfirm && !orderResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Confirm Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedRoute && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Selected Route:</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span>{selectedRoute.from}</span>
                    <ArrowRight className="w-4 h-4" />
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span>{selectedRoute.to}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{selectedRoute.newDistance || selectedRoute.distance}</span>
                    <span>{selectedRoute.newTime || selectedRoute.time}</span>
                    <span>₹{selectedRoute.newFuelCost || selectedRoute.fuelCost}</span>
                  </div>
                </div>
              )}

              {pendingOrder && (
                <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Order Details:</p>
                  <p>{pendingOrder.productName} x {pendingOrder.quantity}</p>
                  <p className="text-lg font-bold">₹{pendingOrder.total.toLocaleString()}</p>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                A truck will be automatically assigned and you&apos;ll receive tracking information.
                Order will be saved to your account database.
              </p>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowOrderConfirm(false)}
                  disabled={isPlacingOrder}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleConfirmOrder}
                  disabled={isPlacingOrder}
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Order
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
