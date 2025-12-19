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
  TrendingDown, AlertCircle, X
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  ordersApi, shipmentsApi, routesApi,
  Order, Shipment, OptimizedRoute 
} from '@/lib/services/supplychain-api';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || 'pk.eyJ1IjoicmlzaGFiLWFjaGFyamVlIiwiYSI6ImNtY3gwNW9lejA1bWgyanNhNTh4MGMyc3UifQ.ioMV5nbcBFh3VpvDMzEzIg';

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

export default function Dashboard() {
  const searchParams = useSearchParams();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
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
      // Auto-hide after 5 seconds
      setTimeout(() => setShowOrderBanner(false), 5000);
    }
  }, [searchParams]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

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
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [78.9629, 20.5937], // Center of India
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

    // Wait for map to load
    const updateMap = () => {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Remove existing layers and sources
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

        // Add route endpoint markers
        routes.forEach(route => {
          // Origin marker (green)
          const originEl = document.createElement('div');
          originEl.className = 'w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow';
          const originMarker = new mapboxgl.Marker(originEl)
            .setLngLat([route.fromCoords.lng, route.fromCoords.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<b>${route.from}</b><br/>Origin`))
            .addTo(mapInstance);
          markersRef.current.push(originMarker);

          // Destination marker (red)
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
          properties: { 
            id: shipment.id,
            status: shipment.status,
          },
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

        // Add truck markers
        shipments.forEach(shipment => {
          // Truck marker
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

          // Origin marker
          const originEl = document.createElement('div');
          originEl.className = 'w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow';
          const originMarker = new mapboxgl.Marker(originEl)
            .setLngLat([shipment.origin.lng, shipment.origin.lat])
            .addTo(mapInstance);
          markersRef.current.push(originMarker);

          // Destination marker
          const destEl = document.createElement('div');
          destEl.className = 'w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow';
          const destMarker = new mapboxgl.Marker(destEl)
            .setLngLat([shipment.destination.lng, shipment.destination.lat])
            .addTo(mapInstance);
          markersRef.current.push(destMarker);
        });
      }
    };

    if (mapInstance.isStyleLoaded()) {
      updateMap();
    } else {
      mapInstance.on('load', updateMap);
    }
  }, [routes, shipments, showRoutes, showShipments]);

  // Simulate shipment movement (update every 10 seconds)
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

        // Calculate new position
        const route = shipment.route?.coordinates;
        let newLat = shipment.currentLocation.lat;
        let newLng = shipment.currentLocation.lng;

        if (route && route.length > 0) {
          const index = Math.floor((newProgress / 100) * (route.length - 1));
          newLat = route[index].lat;
          newLng = route[index].lng;
        } else {
          // Interpolate between origin and destination
          newLat = shipment.origin.lat + (shipment.destination.lat - shipment.origin.lat) * (newProgress / 100);
          newLng = shipment.origin.lng + (shipment.destination.lng - shipment.origin.lng) * (newProgress / 100);
        }

        // Update in database
        await shipmentsApi.update(shipment.id, {
          progress: Math.round(newProgress),
          status: newStatus,
          currentLat: newLat,
          currentLng: newLng,
        });
      }

      // Refresh data
      fetchData();
    }, 10000);

    return () => clearInterval(interval);
  }, [shipments, fetchData]);

  // Stats
  const stats = {
    totalOrders: orders.length,
    activeShipments: shipments.filter(s => s.status !== 'delivered').length,
    optimizedRoutes: routes.length,
    avgSavings: routes.length > 0 
      ? Math.round(routes.reduce((sum, r) => sum + parseInt(r.savings || '0'), 0) / routes.length) 
      : 0,
  };

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

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time shipment tracking and route overview
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
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
              <p className="text-2xl font-bold">{stats.activeShipments}</p>
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
              <p className="text-2xl font-bold">{stats.optimizedRoutes}</p>
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
              <p className="text-2xl font-bold">{stats.avgSavings}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
            
            {/* Map Legend */}
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
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
            ) : shipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active shipments</p>
                <p className="text-sm">Place an order to see shipments here</p>
              </div>
            ) : (
              shipments.map((shipment) => (
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
              ))
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
              {/* Vehicle Info */}
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

              {/* Status */}
              <div className="flex items-center gap-4">
                <Badge className={`${getStatusBadge(selectedShipment.status)} text-sm px-3 py-1`}>
                  {selectedShipment.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ETA: {selectedShipment.eta}
                </span>
              </div>

              {/* Route Info */}
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

              {/* Progress */}
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
