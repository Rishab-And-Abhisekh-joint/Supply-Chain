'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Truck, Clock, DollarSign, Fuel, Leaf, Navigation, Package,
  CheckCircle, Loader2, AlertCircle, X, Route, RefreshCw, Bell,
  Warehouse as WarehouseIcon, ArrowRight
} from 'lucide-react';

// Types
interface Warehouse {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface PendingOrder {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  recommendation?: string;
  source?: string;
  sourceWarehouse?: { id: string; name: string; city: string; latitude: number; longitude: number };
  destinationWarehouse?: { id: string; name: string; city: string; latitude: number; longitude: number };
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

// Helpers
function getUserEmail(): string {
  if (typeof window !== 'undefined') {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) return JSON.parse(userStr).email || 'demo@example.com';
    } catch { }
  }
  return 'demo@example.com';
}

function formatNumber(value: number | undefined | null): string {
  return value === undefined || value === null || isNaN(value) ? '0' : value.toLocaleString();
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function generateRouteCoordinates(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  return Array.from({ length: 21 }, (_, i) => {
    const t = i / 20;
    return { lat: fromLat + (toLat - fromLat) * t + Math.sin(t * Math.PI) * 0.3, lng: fromLng + (toLng - fromLng) * t };
  });
}

function generateRouteSteps(from: string, to: string, dist: number): RouteStep[] {
  const seg = Math.round(dist / 5), tim = Math.round(dist * 1.5 / 5);
  return [
    { instruction: `Start at ${from}`, distance: '0 km', duration: '0 min', location: from },
    { instruction: 'Head toward main highway', distance: `${seg} km`, duration: `${tim} min`, location: 'Highway Entry' },
    { instruction: 'Continue on National Highway', distance: `${seg * 2} km`, duration: `${tim * 2} min`, location: 'NH Expressway' },
    { instruction: 'Take exit toward destination', distance: `${seg} km`, duration: `${tim} min`, location: 'Exit Ramp' },
    { instruction: 'Continue to warehouse area', distance: `${Math.round(seg * 0.5)} km`, duration: `${Math.round(tim * 0.5)} min`, location: 'Industrial Zone' },
    { instruction: `Arrive at ${to}`, distance: '0 km', duration: '0 min', location: to },
  ];
}

export default function LogisticsOptimization() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [selectedPendingOrder, setSelectedPendingOrder] = useState<PendingOrder | null>(null);
  const [sourceWarehouse, setSourceWarehouse] = useState('');
  const [destinationWarehouse, setDestinationWarehouse] = useState('');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [shipmentCreated, setShipmentCreated] = useState(false);
  const [orderResult, setOrderResult] = useState<{ order?: { orderNumber?: string; trackingNumber?: string }; truck?: { vehicleNumber?: string; driverName?: string } } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/warehouses?forSelection=true', { headers: { 'X-User-Email': getUserEmail() } });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setWarehouses(data.data.filter((w: Warehouse) => w.status === 'operational'));
      }

      const allOrders: PendingOrder[] = [];
      const stored = sessionStorage.getItem('pendingOrder');
      if (stored) {
        const o = JSON.parse(stored);
        allOrders.push({ ...o, source: 'session' });
        if (o.sourceWarehouse?.id) setSourceWarehouse(o.sourceWarehouse.id);
        if (o.destinationWarehouse?.id) setDestinationWarehouse(o.destinationWarehouse.id);
      }

      const apiRes = await fetch('/api/pending-orders?status=pending', { headers: { 'X-User-Email': getUserEmail() } });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.success) apiData.data.forEach((o: PendingOrder) => { if (!allOrders.find(x => x.productId === o.productId)) allOrders.push(o); });
      }

      setPendingOrders(allOrders);
      if (allOrders.length) setSelectedPendingOrder(allOrders[0]);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const calculateRoutes = useCallback(() => {
    if (!sourceWarehouse || !destinationWarehouse) return;
    setIsCalculating(true);
    const src = warehouses.find(w => w.id === sourceWarehouse), dst = warehouses.find(w => w.id === destinationWarehouse);
    if (!src || !dst) { setError('Invalid selection'); setIsCalculating(false); return; }
    const dist = calculateDistance(src.latitude, src.longitude, dst.latitude, dst.longitude);
    setTimeout(() => {
      setRoutes([
        { id: 'route-1', name: 'Fastest Route', from: src.name, to: dst.name, distance: dist, duration: Math.round(dist * 1.5), cost: Math.round(dist * 45), fuelConsumption: +(dist * 0.12).toFixed(1), co2Emissions: +(dist * 0.35).toFixed(1), isRecommended: true, steps: generateRouteSteps(src.name, dst.name, dist) },
        { id: 'route-2', name: 'Economical Route', from: src.name, to: dst.name, distance: Math.round(dist * 1.15), duration: Math.round(dist * 1.8), cost: Math.round(dist * 38), fuelConsumption: +(dist * 0.1).toFixed(1), co2Emissions: +(dist * 0.3).toFixed(1), isRecommended: false, steps: generateRouteSteps(src.name, dst.name, Math.round(dist * 1.15)) },
        { id: 'route-3', name: 'Eco-Friendly Route', from: src.name, to: dst.name, distance: Math.round(dist * 1.1), duration: Math.round(dist * 2), cost: Math.round(dist * 42), fuelConsumption: +(dist * 0.08).toFixed(1), co2Emissions: +(dist * 0.25).toFixed(1), isRecommended: false, steps: generateRouteSteps(src.name, dst.name, Math.round(dist * 1.1)) },
      ]);
      setSelectedRouteId('route-1');
      setIsCalculating(false);
    }, 1500);
  }, [sourceWarehouse, destinationWarehouse, warehouses]);

  useEffect(() => { if (sourceWarehouse && destinationWarehouse && sourceWarehouse !== destinationWarehouse) calculateRoutes(); }, [sourceWarehouse, destinationWarehouse, calculateRoutes]);

  const handleCreateShipment = async () => {
    if (!selectedRouteId || !sourceWarehouse || !destinationWarehouse) { setError('Select warehouses and route'); return; }
    setIsCreatingShipment(true);
    try {
      const src = warehouses.find(w => w.id === sourceWarehouse)!, dst = warehouses.find(w => w.id === destinationWarehouse)!, route = routes.find(r => r.id === selectedRouteId)!;
      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Email': getUserEmail() },
        body: JSON.stringify({
          customerName: 'Self',
          items: selectedPendingOrder ? [{ productId: selectedPendingOrder.productId, productName: selectedPendingOrder.productName, quantity: selectedPendingOrder.quantity, unitPrice: selectedPendingOrder.unitPrice, total: selectedPendingOrder.total }] : [{ productId: `PROD-${Date.now()}`, productName: 'Transfer Order', quantity: 1, unitPrice: 0, total: 0 }],
          totalAmount: selectedPendingOrder?.total || 0,
          shippingAddress: dst.name,
          deliveryType: 'Heavy Truck',
          selectedRoute: { id: 1, from: src.name, to: dst.name, distance: `${route.distance} km`, time: `${route.duration} min`, savings: '15%', fuelCost: route.cost, coordinates: generateRouteCoordinates(src.latitude, src.longitude, dst.latitude, dst.longitude) },
          origin: { name: src.name, lat: src.latitude, lng: src.longitude },
          destination: { name: dst.name, lat: dst.latitude, lng: dst.longitude },
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setOrderResult(result.data);
      setShipmentCreated(true);
      sessionStorage.removeItem('pendingOrder');
      setTimeout(() => router.push(`/dashboard?tracking=${result.data?.order?.trackingNumber || ''}`), 3000);
    } catch (e: any) { setError(e.message); }
    setIsCreatingShipment(false);
  };

  const selectedRoute = routes.find(r => r.id === selectedRouteId);

  if (isLoading) return <div className="flex items-center justify-center h-[calc(100vh-100px)]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-900">Logistics Optimization</h1><p className="text-gray-500">AI-powered route planning</p></div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-50"><RefreshCw className="w-4 h-4" />Refresh</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-600" /><p className="text-red-800 flex-1">{error}</p><button onClick={() => setError(null)}><X className="w-4 h-4 text-red-600" /></button></div>}

      {pendingOrders.length > 0 && !shipmentCreated && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-blue-100 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div><div><h3 className="font-semibold text-blue-900">Pending Orders ({pendingOrders.length})</h3></div></div>
          <div className="space-y-2">
            {pendingOrders.map((o, i) => (
              <div key={o.id || i} onClick={() => setSelectedPendingOrder(o)} className={`p-3 rounded-lg cursor-pointer ${selectedPendingOrder?.productId === o.productId ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white hover:bg-blue-50'}`}>
                <div className="flex justify-between"><div><p className="font-medium">{o.productName}</p><p className="text-sm text-gray-500">Qty: {o.quantity} | ₹{formatNumber(o.unitPrice)}/unit</p>{o.sourceWarehouse && o.destinationWarehouse && <p className="text-xs text-blue-600 mt-1"><MapPin className="w-3 h-3 inline" /> {o.sourceWarehouse.name} → {o.destinationWarehouse.name}</p>}</div><div className="text-right"><p className="text-lg font-bold">₹{formatNumber(o.total)}</p>{o.source === 'session' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">From Forecast</span>}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {shipmentCreated ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-10 h-10 text-green-600" /></div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Shipment Created!</h2>
          {orderResult && <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto mb-4 grid grid-cols-2 gap-4 text-sm"><div><p className="text-gray-500">Order</p><p className="font-semibold">{orderResult.order?.orderNumber}</p></div><div><p className="text-gray-500">Tracking</p><p className="font-semibold">{orderResult.order?.trackingNumber}</p></div><div><p className="text-gray-500">Vehicle</p><p className="font-semibold">{orderResult.truck?.vehicleNumber}</p></div><div><p className="text-gray-500">Driver</p><p className="font-semibold">{orderResult.truck?.driverName}</p></div></div>}
          <div className="flex items-center justify-center gap-2 text-green-700"><Bell className="w-4 h-4" />Redirecting to dashboard...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><WarehouseIcon className="w-5 h-5 text-blue-600" />Route Configuration</h2>
              <div className="space-y-4">
                <div><label className="text-sm text-gray-500 flex items-center gap-1 mb-1"><div className="w-2 h-2 bg-green-500 rounded-full" />Source Warehouse</label><select value={sourceWarehouse} onChange={e => setSourceWarehouse(e.target.value)} className="w-full px-3 py-2 border rounded-lg"><option value="">Select source...</option>{warehouses.map(w => <option key={w.id} value={w.id} disabled={w.id === destinationWarehouse}>{w.name} - {w.city}</option>)}</select></div>
                <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-gray-400" /></div>
                <div><label className="text-sm text-gray-500 flex items-center gap-1 mb-1"><div className="w-2 h-2 bg-red-500 rounded-full" />Destination Warehouse</label><select value={destinationWarehouse} onChange={e => setDestinationWarehouse(e.target.value)} className="w-full px-3 py-2 border rounded-lg"><option value="">Select destination...</option>{warehouses.map(w => <option key={w.id} value={w.id} disabled={w.id === sourceWarehouse}>{w.name} - {w.city}</option>)}</select></div>
              </div>
              <button onClick={calculateRoutes} disabled={!sourceWarehouse || !destinationWarehouse || sourceWarehouse === destinationWarehouse || isCalculating} className={`w-full mt-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${isCalculating ? 'bg-blue-400 text-white' : !sourceWarehouse || !destinationWarehouse || sourceWarehouse === destinationWarehouse ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{isCalculating ? <><Loader2 className="w-5 h-5 animate-spin" />Calculating...</> : <><Route className="w-5 h-5" />Find Optimal Route</>}</button>
            </div>

            {routes.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="font-semibold mb-4">Available Routes</h2>
                <div className="space-y-3">
                  {routes.map(r => (
                    <div key={r.id} onClick={() => setSelectedRouteId(r.id)} className={`p-4 rounded-lg border-2 cursor-pointer ${selectedRouteId === r.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}>
                      <div className="flex justify-between mb-2"><span className="font-medium">{r.name}</span>{r.isRecommended && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Recommended</span>}</div>
                      <div className="grid grid-cols-3 gap-2 text-sm text-gray-500"><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.distance} km</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.duration} min</span><span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />₹{formatNumber(r.cost)}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {!routes.length ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center"><Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-700 mb-2">Select Warehouses</h3><p className="text-gray-500">Choose source and destination to calculate routes</p></div>
            ) : selectedRoute && (
              <>
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="font-semibold mb-4">Route Summary: {selectedRoute.name}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg"><MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" /><p className="text-2xl font-bold">{selectedRoute.distance}</p><p className="text-sm text-gray-500">km</p></div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg"><Clock className="w-6 h-6 text-green-600 mx-auto mb-2" /><p className="text-2xl font-bold">{selectedRoute.duration}</p><p className="text-sm text-gray-500">min</p></div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg"><DollarSign className="w-6 h-6 text-yellow-600 mx-auto mb-2" /><p className="text-2xl font-bold">₹{formatNumber(selectedRoute.cost)}</p><p className="text-sm text-gray-500">cost</p></div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg"><Fuel className="w-6 h-6 text-orange-600 mx-auto mb-2" /><p className="text-2xl font-bold">{selectedRoute.fuelConsumption}</p><p className="text-sm text-gray-500">L fuel</p></div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg"><Leaf className="w-6 h-6 text-green-600 mx-auto mb-2" /><p className="text-2xl font-bold">{selectedRoute.co2Emissions}</p><p className="text-sm text-gray-500">kg CO₂</p></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="font-semibold mb-4">Route Instructions</h2>
                  <div className="space-y-4">
                    {selectedRoute.steps.map((s, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${i === 0 ? 'bg-green-500 text-white' : i === selectedRoute.steps.length - 1 ? 'bg-red-500 text-white' : 'bg-blue-100 text-blue-600'}`}>{i + 1}</div>{i < selectedRoute.steps.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-2" />}</div>
                        <div className="flex-1 pb-4"><p className="font-medium">{s.instruction}</p><p className="text-sm text-gray-500">{s.location}</p><div className="flex gap-4 mt-1 text-xs text-gray-400"><span>{s.distance}</span><span>{s.duration}</span></div></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div><h3 className="font-semibold">Ready to create shipment?</h3><p className="text-sm text-gray-500">{selectedRoute.name} - {selectedRoute.distance} km</p>{selectedPendingOrder && <p className="text-sm text-blue-600 mt-1">{selectedPendingOrder.productName} x {selectedPendingOrder.quantity} = ₹{formatNumber(selectedPendingOrder.total)}</p>}</div>
                    <button onClick={handleCreateShipment} disabled={isCreatingShipment} className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${isCreatingShipment ? 'bg-green-400 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}>{isCreatingShipment ? <><Loader2 className="w-5 h-5 animate-spin" />Creating...</> : <><Truck className="w-5 h-5" />Confirm & Create Shipment</>}</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}