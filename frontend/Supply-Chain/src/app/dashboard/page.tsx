"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Package, Truck, MapPin, Clock, DollarSign, Route,
  CheckCircle, RefreshCw, Loader2, Navigation, Eye,
  TrendingDown, AlertCircle, X, Database, Warehouse,
  Users, ShoppingCart
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  ordersApi, shipmentsApi, routesApi,
  Order, Shipment, OptimizedRoute 
} from '@/lib/services/supplychain-api';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || 'pk.eyJ1IjoicmlzaGFiLWFjaGFyamVlIiwiYSI6ImNtY3gwNW9lejA1bWgyanNhNTh4MGMyc3UifQ.ioMV5nbcBFh3VpvDMzEzIg';

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

// Types for uploaded data
interface UploadedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  items?: any[];
  createdAt?: string;
}

interface UploadedWarehouse {
  id: string;
  name: string;
  city: string;
  capacity: number;
  currentUtilization: number;
  status: string;
}

interface UploadedVehicle {
  id: string;
  vehicleNumber: string;
  type: string;
  status: string;
  driver?: string;
  capacity?: number;
}

interface UploadedDelivery {
  id: string;
  orderId: string;
  status: string;
  progress?: number;
  origin?: any;
  destination?: any;
}

interface UploadedInventory {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  price: number;
}

interface UploadedTeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
}

// ============================================================================
// STATUS HELPERS
// ============================================================================

const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    picking_up: '#eab308',
    in_transit: '#3b82f6',
    delivering: '#22c55e',
    delivered: '#10b981',
  };
  return colors[status] || '#6b7280';
};

const getStatusBadge = (status: string) => {
  const styles: { [key: string]: string } = {
    picking_up: 'bg-yellow-100 text-yellow-800',
    in_transit: 'bg-blue-100 text-blue-800',
    delivering: 'bg-green-100 text-green-800',
    delivered: 'bg-emerald-100 text-emerald-800',
  };
  return styles[status] || 'bg-gray-100 text-gray-800';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Dashboard() {
  const searchParams = useSearchParams();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Live data from website activity
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
  
  // Uploaded JSON data (base data)
  const [uploadedOrders, setUploadedOrders] = useState<UploadedOrder[]>([]);
  const [uploadedWarehouses, setUploadedWarehouses] = useState<UploadedWarehouse[]>([]);
  const [uploadedVehicles, setUploadedVehicles] = useState<UploadedVehicle[]>([]);
  const [uploadedDeliveries, setUploadedDeliveries] = useState<UploadedDelivery[]>([]);
  const [uploadedInventory, setUploadedInventory] = useState<UploadedInventory[]>([]);
  const [uploadedTeam, setUploadedTeam] = useState<UploadedTeamMember[]>([]);
  
  // Data source tracking
  const [dataSource, setDataSource] = useState<string>('loading');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showShipments, setShowShipments] = useState(true);
  const [showOrderBanner, setShowOrderBanner] = useState(false);
  const [newTrackingNumber, setNewTrackingNumber] = useState<string | null>(null);

  // Check for new order from URL params
  useEffect(() => {
    const tracking = searchParams.get('tracking');
    if (tracking) {
      setNewTrackingNumber(tracking);
      setShowOrderBanner(true);
      setTimeout(() => setShowOrderBanner(false), 5000);
    }
  }, [searchParams]);

  // Fetch uploaded JSON data from /api/data
  const fetchUploadedData = useCallback(async () => {
    const userEmail = getUserEmail();
    const headers = { 'X-User-Email': userEmail };
    let hasUploadedData = false;

    try {
      // Fetch all data types in parallel
      const [ordersRes, warehousesRes, vehiclesRes, deliveriesRes, inventoryRes, teamRes] = await Promise.all([
        fetch('/api/data?type=orders', { headers }).catch(() => null),
        fetch('/api/data?type=warehouses', { headers }).catch(() => null),
        fetch('/api/data?type=vehicles', { headers }).catch(() => null),
        fetch('/api/data?type=deliveries', { headers }).catch(() => null),
        fetch('/api/data?type=inventory', { headers }).catch(() => null),
        fetch('/api/data?type=team', { headers }).catch(() => null),
      ]);

      // Process orders
      if (ordersRes?.ok) {
        const json = await ordersRes.json();
        if (json.success && json.data && Array.isArray(json.data) && json.data.length > 0) {
          setUploadedOrders(json.data);
          hasUploadedData = true;
        }
      }

      // Process warehouses
      if (warehousesRes?.ok) {
        const json = await warehousesRes.json();
        if (json.success && json.data && Array.isArray(json.data) && json.data.length > 0) {
          setUploadedWarehouses(json.data);
          hasUploadedData = true;
        }
      }

      // Process vehicles (fleet)
      if (vehiclesRes?.ok) {
        const json = await vehiclesRes.json();
        if (json.success && json.data && Array.isArray(json.data) && json.data.length > 0) {
          setUploadedVehicles(json.data);
          hasUploadedData = true;
        }
      }

      // Process deliveries
      if (deliveriesRes?.ok) {
        const json = await deliveriesRes.json();
        if (json.success && json.data && Array.isArray(json.data) && json.data.length > 0) {
          setUploadedDeliveries(json.data);
          hasUploadedData = true;
        }
      }

      // Process inventory
      if (inventoryRes?.ok) {
        const json = await inventoryRes.json();
        if (json.success && json.data && Array.isArray(json.data) && json.data.length > 0) {
          setUploadedInventory(json.data);
          hasUploadedData = true;
        }
      }

      // Process team
      if (teamRes?.ok) {
        const json = await teamRes.json();
        if (json.success && json.data && Array.isArray(json.data) && json.data.length > 0) {
          setUploadedTeam(json.data);
          hasUploadedData = true;
        }
      }

      setDataSource(hasUploadedData ? 'user_data' : 'none');

    } catch (err) {
      console.error('Error fetching uploaded data:', err);
      setDataSource('none');
    }
  }, []);

  // Fetch live data from website activity (existing API)
  const fetchLiveData = useCallback(async () => {
    try {
      const [ordersResult, shipmentsResult, routesResult] = await Promise.all([
        ordersApi.getAll(),
        shipmentsApi.getAll({ active: true }),
        routesApi.getAll(true),
      ]);

      if (ordersResult.success) setOrders(ordersResult.data || []);
      if (shipmentsResult.success) setShipments(shipmentsResult.data || []);
      if (routesResult.success) setRoutes(routesResult.data || []);

    } catch (err: any) {
      console.error('Error fetching live data:', err);
      setError(err.message || 'Failed to fetch live data');
    }
  }, []);

  // Combined fetch function
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    await Promise.all([
      fetchUploadedData(),
      fetchLiveData(),
    ]);

    setIsLoading(false);
  }, [fetchUploadedData, fetchLiveData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [78.9629, 20.5937],
      zoom: 4.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map with routes and shipments
  useEffect(() => {
    if (!map.current) return;

    const mapInstance = map.current;

    const updateMap = () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      ['optimized-routes', 'shipment-routes'].forEach(id => {
        if (mapInstance.getLayer(id)) mapInstance.removeLayer(id);
        if (mapInstance.getSource(id)) mapInstance.removeSource(id);
      });

      // Add optimized routes
      if (showRoutes && routes.length > 0) {
        const routeFeatures = routes.map(route => ({
          type: 'Feature' as const,
          properties: { name: route.routeName },
          geometry: {
            type: 'LineString' as const,
            coordinates: route.coordinates?.map(c => [c.lng, c.lat]) || [
              [route.fromCoords.lng, route.fromCoords.lat],
              [route.toCoords.lng, route.toCoords.lat],
            ],
          },
        }));

        mapInstance.addSource('optimized-routes', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: routeFeatures },
        });

        mapInstance.addLayer({
          id: 'optimized-routes',
          type: 'line',
          source: 'optimized-routes',
          paint: {
            'line-color': '#22c55e',
            'line-width': 3,
            'line-opacity': 0.7,
            'line-dasharray': [2, 2],
          },
        });

        routes.forEach(route => {
          const originEl = document.createElement('div');
          originEl.className = 'w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow';
          const originMarker = new mapboxgl.Marker(originEl)
            .setLngLat([route.fromCoords.lng, route.fromCoords.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<b>${route.from}</b><br/>Origin`))
            .addTo(mapInstance);
          markersRef.current.push(originMarker);

          const destEl = document.createElement('div');
          destEl.className = 'w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow';
          const destMarker = new mapboxgl.Marker(destEl)
            .setLngLat([route.toCoords.lng, route.toCoords.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<b>${route.to}</b><br/>Destination`))
            .addTo(mapInstance);
          markersRef.current.push(destMarker);
        });
      }

      // Add shipment routes and truck markers
      if (showShipments && shipments.length > 0) {
        const shipmentFeatures = shipments.map(shipment => ({
          type: 'Feature' as const,
          properties: { id: shipment.id, status: shipment.status },
          geometry: {
            type: 'LineString' as const,
            coordinates: shipment.route?.coordinates?.map(c => [c.lng, c.lat]) || [
              [shipment.origin.lng, shipment.origin.lat],
              [shipment.destination.lng, shipment.destination.lat],
            ],
          },
        }));

        mapInstance.addSource('shipment-routes', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: shipmentFeatures },
        });

        mapInstance.addLayer({
          id: 'shipment-routes',
          type: 'line',
          source: 'shipment-routes',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });

        shipments.forEach(shipment => {
          const truckEl = document.createElement('div');
          truckEl.innerHTML = `
            <div class="relative cursor-pointer">
              <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
                </svg>
              </div>
              <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          `;
          truckEl.addEventListener('click', () => setSelectedShipment(shipment));

          const truckMarker = new mapboxgl.Marker(truckEl)
            .setLngLat([shipment.currentLocation.lng, shipment.currentLocation.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="p-2">
                <b>${shipment.vehicleNumber}</b><br/>
                <span class="text-sm">${shipment.driverName}</span><br/>
                <span class="text-xs text-gray-500">${shipment.status}</span>
              </div>
            `))
            .addTo(mapInstance);
          markersRef.current.push(truckMarker);

          const originEl = document.createElement('div');
          originEl.className = 'w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow';
          const originMarker = new mapboxgl.Marker(originEl)
            .setLngLat([shipment.origin.lng, shipment.origin.lat])
            .addTo(mapInstance);
          markersRef.current.push(originMarker);

          const destEl = document.createElement('div');
          destEl.className = 'w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow';
          const destMarker = new mapboxgl.Marker(destEl)
            .setLngLat([shipment.destination.lng, shipment.destination.lat])
            .addTo(mapInstance);
          markersRef.current.push(destMarker);
        });
      }

      // Add warehouse markers from uploaded data
      if (uploadedWarehouses.length > 0) {
        uploadedWarehouses.forEach(warehouse => {
          // Only add if warehouse has coordinates
          const lat = (warehouse as any).latitude;
          const lng = (warehouse as any).longitude;
          if (lat && lng) {
            const warehouseEl = document.createElement('div');
            warehouseEl.innerHTML = `
              <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg border-2 border-white cursor-pointer">
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
            `;
            
            const warehouseMarker = new mapboxgl.Marker(warehouseEl)
              .setLngLat([lng, lat])
              .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div class="p-2">
                  <b>${warehouse.name}</b><br/>
                  <span class="text-sm">${warehouse.city}</span><br/>
                  <span class="text-xs text-gray-500">Capacity: ${warehouse.currentUtilization}/${warehouse.capacity}</span>
                </div>
              `))
              .addTo(mapInstance);
            markersRef.current.push(warehouseMarker);
          }
        });
      }
    };

    if (mapInstance.isStyleLoaded()) {
      updateMap();
    } else {
      mapInstance.on('load', updateMap);
    }
  }, [routes, shipments, showRoutes, showShipments, uploadedWarehouses]);

  // Simulate shipment movement
  useEffect(() => {
    if (shipments.length === 0) return;

    const interval = setInterval(async () => {
      for (const shipment of shipments) {
        if (shipment.status === 'delivered') continue;

        const newProgress = Math.min(shipment.progress + Math.random() * 2, 100);
        let newStatus = shipment.status;

        if (newProgress >= 100) {
          newStatus = 'picking_up';
        } else if (newProgress >= 90) {
          newStatus = 'delivering';
        } else if (newProgress >= 20) {
          newStatus = 'in_transit';
        }

        const route = shipment.route?.coordinates;
        let newLat = shipment.currentLocation.lat;
        let newLng = shipment.currentLocation.lng;

        if (route && route.length > 0) {
          const index = Math.floor((newProgress / 100) * (route.length - 1));
          newLat = route[index].lat;
          newLng = route[index].lng;
        } else {
          newLat = shipment.origin.lat + (shipment.destination.lat - shipment.origin.lat) * (newProgress / 100);
          newLng = shipment.origin.lng + (shipment.destination.lng - shipment.origin.lng) * (newProgress / 100);
        }

        await shipmentsApi.update(shipment.id, {
          progress: Math.round(newProgress),
          status: newStatus,
          currentLat: newLat,
          currentLng: newLng,
        });
      }

      fetchData();
    }, 10000);

    return () => clearInterval(interval);
  }, [shipments, fetchData]);

  // ============================================================================
  // CALCULATE COMBINED STATS (Uploaded Base Data + Live Website Activity)
  // ============================================================================
  
  // Total Orders = Uploaded orders + Live orders (placed through website)
  const totalOrders = uploadedOrders.length + orders.length;
  
  // Active Shipments = Uploaded deliveries (in_transit) + Live shipments
  const uploadedActiveDeliveries = uploadedDeliveries.filter(d => 
    d.status === 'in_transit' || d.status === 'delivering' || d.status === 'picking_up'
  ).length;
  const liveActiveShipments = shipments.filter(s => s.status !== 'delivered').length;
  const totalActiveShipments = uploadedActiveDeliveries + liveActiveShipments;
  
  // Optimized Routes (from live data)
  const totalOptimizedRoutes = routes.length;
  
  // Average Savings
  const avgSavings = routes.length > 0 
    ? Math.round(routes.reduce((sum, r) => sum + parseInt(r.savings || '0'), 0) / routes.length) 
    : 0;

  // Additional stats from uploaded data
  const totalWarehouses = uploadedWarehouses.length;
  const operationalWarehouses = uploadedWarehouses.filter(w => w.status === 'operational').length;
  
  const totalVehicles = uploadedVehicles.length;
  const activeVehicles = uploadedVehicles.filter(v => 
    v.status === 'active' || v.status === 'in_transit' || v.status === 'on_route'
  ).length;
  
  const totalInventoryItems = uploadedInventory.length;
  const lowStockItems = uploadedInventory.filter(i => 
    i.currentStock <= i.reorderLevel
  ).length;
  
  const totalTeamMembers = uploadedTeam.length;
  const activeTeamMembers = uploadedTeam.filter(t => t.status === 'active').length;

  // Revenue from uploaded orders
  const uploadedRevenue = uploadedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const liveRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalRevenue = uploadedRevenue + liveRevenue;

  // Pending orders
  const uploadedPendingOrders = uploadedOrders.filter(o => 
    o.status === 'pending' || o.status === 'processing' || o.status === 'confirmed'
  ).length;
  const livePendingOrders = orders.filter(o => 
    o.status === 'pending' || o.status === 'processing' || o.status === 'confirmed'
  ).length;
  const totalPendingOrders = uploadedPendingOrders + livePendingOrders;

  return (
    <div className="p-6 space-y-6">
      {/* Order Placed Banner */}
      {showOrderBanner && newTrackingNumber && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Order Placed Successfully!</p>
                <p className="text-sm text-green-600">Tracking: {newTrackingNumber}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowOrderBanner(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Data Source Banner */}
      <div className={`p-3 rounded-lg flex items-center gap-3 ${
        dataSource === 'user_data' 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <Database className={`w-5 h-5 ${dataSource === 'user_data' ? 'text-green-600' : 'text-yellow-600'}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${dataSource === 'user_data' ? 'text-green-800' : 'text-yellow-800'}`}>
            {dataSource === 'user_data' 
              ? `Dashboard showing your uploaded data + live activity`
              : 'No data uploaded. Upload JSON files in Settings → Data Management to see your data here.'
            }
          </p>
          {dataSource === 'user_data' && (
            <p className="text-xs text-green-600 mt-1">
              Base: {uploadedOrders.length} orders, {uploadedWarehouses.length} warehouses, {uploadedVehicles.length} vehicles, {uploadedInventory.length} inventory items
            </p>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time shipment tracking and supply chain overview
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
              {(uploadedOrders.length > 0 || orders.length > 0) && (
                <p className="text-xs text-muted-foreground">
                  {uploadedOrders.length} base + {orders.length} new
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Shipments</p>
              <p className="text-2xl font-bold">{totalActiveShipments}</p>
              {(uploadedActiveDeliveries > 0 || liveActiveShipments > 0) && (
                <p className="text-xs text-muted-foreground">
                  {uploadedActiveDeliveries} base + {liveActiveShipments} live
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Route className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Optimized Routes</p>
              <p className="text-2xl font-bold">{totalOptimizedRoutes}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <TrendingDown className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Savings</p>
              <p className="text-2xl font-bold">{avgSavings}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Cards (from uploaded data) */}
      {dataSource === 'user_data' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-full">
                <Warehouse className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Warehouses</p>
                <p className="text-lg font-bold">{operationalWarehouses}/{totalWarehouses}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-full">
                <Truck className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fleet</p>
                <p className="text-lg font-bold">{activeVehicles}/{totalVehicles}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inventory</p>
                <p className="text-lg font-bold">{totalInventoryItems}</p>
                {lowStockItems > 0 && (
                  <p className="text-xs text-red-500">{lowStockItems} low stock</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-full">
                <Users className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Team</p>
                <p className="text-lg font-bold">{activeTeamMembers}/{totalTeamMembers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-full">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-lg font-bold">₹{(totalRevenue / 1000).toFixed(0)}K</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Live Tracking Map</CardTitle>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showRoutes} 
                    onChange={(e) => setShowRoutes(e.target.checked)}
                    className="rounded"
                  />
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-1 bg-green-500 rounded"></div>
                    Routes
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showShipments} 
                    onChange={(e) => setShowShipments(e.target.checked)}
                    className="rounded"
                  />
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-1 bg-blue-500 rounded"></div>
                    Shipments
                  </span>
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={mapContainer} className="w-full h-[500px] rounded-lg overflow-hidden" />
            
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Origin
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                Destination
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                Truck
              </span>
              {uploadedWarehouses.length > 0 && (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-600 rounded"></div>
                  Warehouse
                </span>
              )}
              <span className="flex items-center gap-1">
                <div className="w-4 h-1 bg-green-500 rounded border-dashed"></div>
                Optimized Route
              </span>
              <span className="flex items-center gap-1">
                <div className="w-4 h-1 bg-blue-500 rounded"></div>
                Active Shipment
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Shipments Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Active Shipments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[550px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : shipments.length === 0 && uploadedDeliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active shipments</p>
                <p className="text-sm">Place an order or upload deliveries.json to see shipments</p>
              </div>
            ) : (
              <>
                {/* Live shipments */}
                {shipments.map((shipment) => (
                  <div 
                    key={shipment.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedShipment?.id === shipment.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedShipment(shipment)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{shipment.vehicleNumber}</p>
                        <p className="text-sm text-muted-foreground">{shipment.driverName}</p>
                      </div>
                      <Badge className={getStatusBadge(shipment.status)}>
                        {shipment.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm mb-3">
                      <MapPin className="w-3 h-3 text-green-600" />
                      <span className="truncate">{shipment.origin.name}</span>
                      <Navigation className="w-3 h-3" />
                      <MapPin className="w-3 h-3 text-red-600" />
                      <span className="truncate">{shipment.destination.name}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{shipment.progress}%</span>
                      </div>
                      <Progress value={shipment.progress} className="h-2" />
                    </div>

                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ETA: {shipment.eta}
                      </span>
                      <span>{shipment.distance || shipment.route?.distance}</span>
                    </div>
                  </div>
                ))}

                {/* Uploaded deliveries (show as cards) */}
                {uploadedDeliveries.filter(d => d.status !== 'delivered').map((delivery) => (
                  <div 
                    key={delivery.id}
                    className="p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Order #{delivery.orderId}</p>
                        <p className="text-xs text-muted-foreground">From uploaded data</p>
                      </div>
                      <Badge className={getStatusBadge(delivery.status)}>
                        {delivery.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {delivery.progress !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{delivery.progress}%</span>
                        </div>
                        <Progress value={delivery.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shipment Details Modal */}
      <Dialog open={!!selectedShipment} onOpenChange={() => setSelectedShipment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Shipment Details
            </DialogTitle>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{selectedShipment.vehicleNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Driver</p>
                  <p className="font-medium">{selectedShipment.driverName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Type</p>
                  <p className="font-medium">{selectedShipment.vehicleType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order</p>
                  <p className="font-medium text-blue-600 cursor-pointer">
                    {selectedShipment.orderNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge className={`${getStatusBadge(selectedShipment.status)} text-sm px-3 py-1`}>
                  {selectedShipment.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ETA: {selectedShipment.eta}
                </span>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Route Information</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span>{selectedShipment.origin.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>{selectedShipment.destination.name}</span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{selectedShipment.distance || selectedShipment.route?.distance}</span>
                  <span>Savings: {selectedShipment.savings || selectedShipment.route?.savings}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Delivery Progress</span>
                  <span className="text-sm">{selectedShipment.progress}%</span>
                </div>
                <Progress value={selectedShipment.progress} className="h-3" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}