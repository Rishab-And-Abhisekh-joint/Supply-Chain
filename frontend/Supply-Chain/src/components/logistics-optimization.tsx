'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  Route
} from 'lucide-react';

interface PendingOrder {
  id: string;
  product: string;
  sku: string;
  quantity: number;
  predictedDemand: number;
  confidence: number;
  createdAt: string;
  status: 'pending_route';
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

const mockRouteSteps: RouteStep[] = [
  { instruction: 'Start at Delhi Central Hub', distance: '0 km', duration: '0 min', location: 'Delhi Central Hub, Connaught Place' },
  { instruction: 'Head east on NH44 toward Noida', distance: '12 km', duration: '18 min', location: 'NH44 Eastern Expressway' },
  { instruction: 'Take exit toward Sector 62', distance: '8 km', duration: '12 min', location: 'Noida Expressway Exit' },
  { instruction: 'Turn right onto Industrial Road', distance: '3 km', duration: '5 min', location: 'Sector 62 Industrial Area' },
  { instruction: 'Continue to Warehouse B', distance: '1.5 km', duration: '3 min', location: 'Noida Distribution Center' },
  { instruction: 'Arrive at destination', distance: '0 km', duration: '0 min', location: 'Noida Warehouse B, Gate 4' },
];

export default function LogisticsOptimization() {
  const router = useRouter();
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [shipmentCreated, setShipmentCreated] = useState(false);

  // Check for pending order from demand forecasting
  useEffect(() => {
    const storedOrder = sessionStorage.getItem('pendingOrder');
    if (storedOrder) {
      try {
        const order = JSON.parse(storedOrder);
        setPendingOrder(order);
      } catch (e) {
        console.error('Failed to parse pending order:', e);
      }
    }
  }, []);

  const clearPendingOrder = () => {
    sessionStorage.removeItem('pendingOrder');
    setPendingOrder(null);
  };

  const handleFindOptimalRoute = () => {
    setIsCalculating(true);

    // Simulate API call for route optimization
    setTimeout(() => {
      const baseDistance = 24.5;
      const routes: RouteOption[] = [
        {
          id: 'route-1',
          name: 'Fastest Route',
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

  const handleCreateShipment = () => {
    setIsCreatingShipment(true);

    setTimeout(() => {
      // Clear the pending order
      sessionStorage.removeItem('pendingOrder');
      setIsCreatingShipment(false);
      setShipmentCreated(true);

      // Redirect to dashboard after success
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }, 1500);
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
      </div>

      {/* Pending Order Banner */}
      {pendingOrder && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Pending Order: {pendingOrder.id}</h3>
              <p className="text-sm text-blue-700">
                {pendingOrder.product} ({pendingOrder.sku}) - {pendingOrder.quantity} units
              </p>
            </div>
          </div>
          <button
            onClick={clearPendingOrder}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
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
          <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
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
                          ₹{route.cost}
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
                        <p className="text-2xl font-bold">₹{selectedRoute.cost}</p>
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