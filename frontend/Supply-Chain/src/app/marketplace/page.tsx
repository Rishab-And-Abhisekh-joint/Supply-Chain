'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, MapPin, Truck, Plane, Train, Ship, Clock, 
  DollarSign, Star, Award, Route, Navigation, Filter,
  ChevronRight, TrendingUp, Zap, Shield, Package,
  Building2, ArrowRight, Check, X, RefreshCw, Target,
  BarChart3, Leaf, Timer, IndianRupee
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type TransportMode = 'truck' | 'flight' | 'train' | 'ship';

interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  coordinates: { lat: number; lng: number };
  products: { sku: string; name: string; quantity: number; price: number }[];
  rating: number;
  responseTime: string;
  fulfillmentRate: number;
}

interface Carrier {
  id: string;
  name: string;
  modes: TransportMode[];
  rating: number;
  totalDeliveries: number;
  onTimeRate: number;
  pricePerKm: number;
  insuranceIncluded: boolean;
  gpsTracking: boolean;
  logo?: string;
}

interface RouteLeg {
  from: string;
  fromCoords: { lat: number; lng: number };
  to: string;
  toCoords: { lat: number; lng: number };
  mode: TransportMode;
  distance: number;
  duration: number;
  cost: number;
  carrier?: Carrier;
}

interface RouteOption {
  id: string;
  legs: RouteLeg[];
  totalDistance: number;
  totalDuration: number;
  totalCost: number;
  aiScore: number;
  carbonFootprint: number;
  reliability: number;
  isRecommended: boolean;
}

interface Bid {
  id: string;
  carrierId: string;
  carrierName: string;
  routeId: string;
  amount: number;
  estimatedDuration: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  submittedAt: Date;
  validUntil: Date;
  notes?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockWarehouses: Warehouse[] = [
  {
    id: 'wh-001',
    name: 'Delhi Central Warehouse',
    address: '123 Industrial Area, Okhla',
    city: 'Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.6139, lng: 77.2090 },
    products: [
      { sku: 'SKU-001', name: 'Electronics - Smartphones', quantity: 5000, price: 15000 },
      { sku: 'SKU-002', name: 'Electronics - Laptops', quantity: 2000, price: 45000 },
      { sku: 'SKU-003', name: 'Electronics - Tablets', quantity: 3000, price: 25000 },
    ],
    rating: 4.8,
    responseTime: '< 2 hours',
    fulfillmentRate: 98.5,
  },
  {
    id: 'wh-002',
    name: 'Mumbai Port Warehouse',
    address: '456 Nhava Sheva, JNPT',
    city: 'Mumbai',
    state: 'Maharashtra',
    coordinates: { lat: 19.0760, lng: 72.8777 },
    products: [
      { sku: 'SKU-004', name: 'Textiles - Cotton Fabric', quantity: 10000, price: 500 },
      { sku: 'SKU-005', name: 'Textiles - Silk Fabric', quantity: 5000, price: 2000 },
    ],
    rating: 4.6,
    responseTime: '< 4 hours',
    fulfillmentRate: 96.2,
  },
  {
    id: 'wh-003',
    name: 'Chennai Distribution Center',
    address: '789 SIPCOT Industrial Park',
    city: 'Chennai',
    state: 'Tamil Nadu',
    coordinates: { lat: 13.0827, lng: 80.2707 },
    products: [
      { sku: 'SKU-006', name: 'Auto Parts - Engine Components', quantity: 8000, price: 5000 },
      { sku: 'SKU-007', name: 'Auto Parts - Brake Systems', quantity: 6000, price: 3000 },
    ],
    rating: 4.7,
    responseTime: '< 3 hours',
    fulfillmentRate: 97.8,
  },
  {
    id: 'wh-004',
    name: 'Bangalore Tech Hub',
    address: '101 Electronic City',
    city: 'Bangalore',
    state: 'Karnataka',
    coordinates: { lat: 12.9716, lng: 77.5946 },
    products: [
      { sku: 'SKU-008', name: 'IT Hardware - Servers', quantity: 500, price: 150000 },
      { sku: 'SKU-009', name: 'IT Hardware - Networking', quantity: 2000, price: 25000 },
    ],
    rating: 4.9,
    responseTime: '< 1 hour',
    fulfillmentRate: 99.1,
  },
];

const mockCarriers: Carrier[] = [
  { id: 'car-001', name: 'BlueDart Express', modes: ['truck', 'flight'], rating: 4.7, totalDeliveries: 125000, onTimeRate: 95.5, pricePerKm: 12, insuranceIncluded: true, gpsTracking: true },
  { id: 'car-002', name: 'Delhivery', modes: ['truck'], rating: 4.5, totalDeliveries: 200000, onTimeRate: 92.3, pricePerKm: 8, insuranceIncluded: true, gpsTracking: true },
  { id: 'car-003', name: 'GATI-KWE', modes: ['truck', 'train'], rating: 4.4, totalDeliveries: 180000, onTimeRate: 91.8, pricePerKm: 9, insuranceIncluded: true, gpsTracking: true },
  { id: 'car-004', name: 'FedEx India', modes: ['truck', 'flight'], rating: 4.8, totalDeliveries: 95000, onTimeRate: 97.2, pricePerKm: 15, insuranceIncluded: true, gpsTracking: true },
  { id: 'car-005', name: 'Indian Railways Cargo', modes: ['train'], rating: 4.2, totalDeliveries: 500000, onTimeRate: 88.5, pricePerKm: 5, insuranceIncluded: false, gpsTracking: false },
  { id: 'car-006', name: 'Maersk Line', modes: ['ship'], rating: 4.6, totalDeliveries: 50000, onTimeRate: 94.1, pricePerKm: 3, insuranceIncluded: true, gpsTracking: true },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatCurrency = (value: number): string => {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
  if (value >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
  return `₹${value.toLocaleString()}`;
};

const formatDuration = (hours: number): string => {
  if (hours < 1) return `${Math.round(hours * 60)} mins`;
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}d ${remainingHours}h`;
};

const generateRouteOptions = (origin: Warehouse, destination: { lat: number; lng: number; name: string }): RouteOption[] => {
  const distance = calculateDistance(
    origin.coordinates.lat, origin.coordinates.lng,
    destination.lat, destination.lng
  );

  const routes: RouteOption[] = [
    // Direct truck route
    {
      id: 'route-1',
      legs: [{
        from: origin.name,
        fromCoords: origin.coordinates,
        to: destination.name,
        toCoords: destination,
        mode: 'truck',
        distance: distance * 1.3, // Road distance is longer
        duration: (distance * 1.3) / 60, // 60 km/h average
        cost: distance * 1.3 * 10,
        carrier: mockCarriers[1],
      }],
      totalDistance: distance * 1.3,
      totalDuration: (distance * 1.3) / 60,
      totalCost: distance * 1.3 * 10,
      aiScore: 75,
      carbonFootprint: distance * 0.15,
      reliability: 92,
      isRecommended: false,
    },
    // Flight + truck route
    {
      id: 'route-2',
      legs: [
        {
          from: origin.name,
          fromCoords: origin.coordinates,
          to: `${origin.city} Airport`,
          toCoords: { lat: origin.coordinates.lat + 0.1, lng: origin.coordinates.lng + 0.1 },
          mode: 'truck',
          distance: 30,
          duration: 1,
          cost: 300,
          carrier: mockCarriers[0],
        },
        {
          from: `${origin.city} Airport`,
          fromCoords: { lat: origin.coordinates.lat + 0.1, lng: origin.coordinates.lng + 0.1 },
          to: 'Destination Airport',
          toCoords: { lat: destination.lat - 0.1, lng: destination.lng - 0.1 },
          mode: 'flight',
          distance: distance,
          duration: distance / 800 + 1, // 800 km/h + 1 hour processing
          cost: distance * 25,
          carrier: mockCarriers[3],
        },
        {
          from: 'Destination Airport',
          fromCoords: { lat: destination.lat - 0.1, lng: destination.lng - 0.1 },
          to: destination.name,
          toCoords: destination,
          mode: 'truck',
          distance: 20,
          duration: 0.5,
          cost: 200,
          carrier: mockCarriers[0],
        },
      ],
      totalDistance: distance + 50,
      totalDuration: distance / 800 + 2.5,
      totalCost: distance * 25 + 500,
      aiScore: 92,
      carbonFootprint: distance * 0.25,
      reliability: 97,
      isRecommended: true,
    },
    // Train route
    {
      id: 'route-3',
      legs: [{
        from: origin.name,
        fromCoords: origin.coordinates,
        to: destination.name,
        toCoords: destination,
        mode: 'train',
        distance: distance * 1.1,
        duration: (distance * 1.1) / 80 + 4, // 80 km/h + loading time
        cost: distance * 1.1 * 5,
        carrier: mockCarriers[4],
      }],
      totalDistance: distance * 1.1,
      totalDuration: (distance * 1.1) / 80 + 4,
      totalCost: distance * 1.1 * 5,
      aiScore: 68,
      carbonFootprint: distance * 0.05,
      reliability: 88,
      isRecommended: false,
    },
  ];

  return routes;
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

const TransportIcon = ({ mode, className }: { mode: TransportMode; className?: string }) => {
  const icons = { truck: Truck, flight: Plane, train: Train, ship: Ship };
  const Icon = icons[mode];
  return <Icon className={className} />;
};

const ScoreBadge = ({ score, label }: { score: number; label: string }) => {
  const color = score >= 90 ? 'bg-green-100 text-green-800' :
                score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800';
  return (
    <div className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
      {label}: {score}
    </div>
  );
};

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ))}
    <span className="text-sm ml-1">{rating.toFixed(1)}</span>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MarketplaceBidding() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [destinationCity, setDestinationCity] = useState('');
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bids, setBids] = useState<Bid[]>([]);
  const [activeTab, setActiveTab] = useState('search');

  // Search warehouses
  const filteredWarehouses = useMemo(() => {
    if (!searchQuery) return mockWarehouses;
    const query = searchQuery.toLowerCase();
    return mockWarehouses.filter(wh => 
      wh.name.toLowerCase().includes(query) ||
      wh.city.toLowerCase().includes(query) ||
      wh.products.some(p => p.name.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Find routes
  const handleFindRoutes = () => {
    if (!selectedWarehouse || !destinationCity) return;
    
    // Mock destination coordinates based on city
    const destinations: Record<string, { lat: number; lng: number; name: string }> = {
      'delhi': { lat: 28.6139, lng: 77.2090, name: 'Delhi Destination' },
      'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai Destination' },
      'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bangalore Destination' },
      'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai Destination' },
      'kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata Destination' },
      'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad Destination' },
    };
    
    const dest = destinations[destinationCity.toLowerCase()] || destinations['mumbai'];
    const routes = generateRouteOptions(selectedWarehouse, dest);
    setRouteOptions(routes);
    setActiveTab('routes');
  };

  // Submit bid
  const handleSubmitBid = () => {
    if (!selectedRoute || !bidAmount) return;
    
    const newBid: Bid = {
      id: `bid-${Date.now()}`,
      carrierId: 'user-carrier',
      carrierName: 'Your Company',
      routeId: selectedRoute.id,
      amount: parseFloat(bidAmount),
      estimatedDuration: selectedRoute.totalDuration,
      status: 'pending',
      submittedAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    
    setBids(prev => [newBid, ...prev]);
    setShowBidDialog(false);
    setBidAmount('');
    setActiveTab('bids');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Marketplace & Bidding
          </h1>
          <p className="text-sm text-muted-foreground">
            Find warehouses, optimize routes, and place bids
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="routes" className="gap-2">
            <Route className="h-4 w-4" />
            Routes
          </TabsTrigger>
          <TabsTrigger value="carriers" className="gap-2">
            <Truck className="h-4 w-4" />
            Carriers
          </TabsTrigger>
          <TabsTrigger value="bids" className="gap-2">
            <DollarSign className="h-4 w-4" />
            My Bids
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Warehouses by Product
              </CardTitle>
              <CardDescription>
                Find warehouses that have the products you need
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by product, warehouse name, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {filteredWarehouses.map(warehouse => (
                    <Card 
                      key={warehouse.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedWarehouse?.id === warehouse.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedWarehouse(warehouse)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{warehouse.name}</h3>
                              {selectedWarehouse?.id === warehouse.id && (
                                <Badge variant="default">Selected</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {warehouse.address}, {warehouse.city}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <StarRating rating={warehouse.rating} />
                              <span className="text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {warehouse.responseTime}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                <Check className="h-3 w-3 inline mr-1" />
                                {warehouse.fulfillmentRate}% fulfillment
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Available Products:</p>
                          <div className="flex flex-wrap gap-2">
                            {warehouse.products.map(product => (
                              <Badge key={product.sku} variant="outline" className="text-xs">
                                {product.name} ({product.quantity.toLocaleString()} units)
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Route Planner */}
          {selectedWarehouse && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Plan Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Origin</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{selectedWarehouse.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedWarehouse.city}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Destination City</Label>
                    <Select value={destinationCity} onValueChange={setDestinationCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delhi">Delhi</SelectItem>
                        <SelectItem value="mumbai">Mumbai</SelectItem>
                        <SelectItem value="bangalore">Bangalore</SelectItem>
                        <SelectItem value="chennai">Chennai</SelectItem>
                        <SelectItem value="kolkata">Kolkata</SelectItem>
                        <SelectItem value="hyderabad">Hyderabad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleFindRoutes} className="w-full">
                      <Route className="h-4 w-4 mr-2" />
                      Find Best Routes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI-Optimized Routes
              </CardTitle>
              <CardDescription>
                Routes ranked by AI scoring (0-100) considering time, cost, and reliability
              </CardDescription>
            </CardHeader>
            <CardContent>
              {routeOptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No routes generated yet.</p>
                  <p className="text-sm">Select a warehouse and destination to find routes.</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {routeOptions
                      .sort((a, b) => b.aiScore - a.aiScore)
                      .map((route, idx) => (
                        <Card 
                          key={route.id}
                          className={`transition-all hover:shadow-md ${route.isRecommended ? 'border-green-500 bg-green-50/50' : ''}`}
                        >
                          <CardContent className="pt-4">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              {/* Route Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {route.isRecommended && (
                                    <Badge className="bg-green-500">
                                      <Award className="h-3 w-3 mr-1" />
                                      AI Recommended
                                    </Badge>
                                  )}
                                  <Badge variant="outline">Route #{idx + 1}</Badge>
                                </div>
                                
                                {/* Route Legs */}
                                <div className="space-y-2">
                                  {route.legs.map((leg, legIdx) => (
                                    <div key={legIdx} className="flex items-center gap-2 text-sm">
                                      <TransportIcon mode={leg.mode} className="h-4 w-4" />
                                      <span>{leg.from}</span>
                                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                      <span>{leg.to}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {leg.distance.toFixed(0)} km • {formatDuration(leg.duration)}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Scores */}
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <div className={`text-2xl font-bold ${
                                    route.aiScore >= 90 ? 'text-green-600' :
                                    route.aiScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {route.aiScore}
                                  </div>
                                  <span className="text-xs text-muted-foreground">AI Score</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <ScoreBadge score={route.reliability} label="Reliability" />
                                </div>
                              </div>

                              {/* Stats */}
                              <div className="text-right space-y-1">
                                <div className="flex items-center justify-end gap-2">
                                  <IndianRupee className="h-4 w-4" />
                                  <span className="font-bold">{formatCurrency(route.totalCost)}</span>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                                  <Timer className="h-4 w-4" />
                                  {formatDuration(route.totalDuration)}
                                </div>
                                <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  {route.totalDistance.toFixed(0)} km
                                </div>
                                <div className="flex items-center justify-end gap-2 text-sm text-green-600">
                                  <Leaf className="h-4 w-4" />
                                  {route.carbonFootprint.toFixed(1)} kg CO₂
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-col gap-2">
                                <Button 
                                  onClick={() => {
                                    setSelectedRoute(route);
                                    setShowBidDialog(true);
                                  }}
                                >
                                  Place Bid
                                </Button>
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carriers Tab */}
        <TabsContent value="carriers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Available Carriers
              </CardTitle>
              <CardDescription>
                Browse and compare logistics partners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockCarriers.map(carrier => (
                    <Card key={carrier.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{carrier.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {carrier.modes.map(mode => (
                                <TransportIcon key={mode} mode={mode} className="h-4 w-4" />
                              ))}
                            </div>
                          </div>
                          <StarRating rating={carrier.rating} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Deliveries</p>
                            <p className="font-medium">{carrier.totalDeliveries.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">On-Time Rate</p>
                            <p className="font-medium">{carrier.onTimeRate}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Price/km</p>
                            <p className="font-medium">₹{carrier.pricePerKm}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Features</p>
                            <div className="flex gap-1">
                              {carrier.insuranceIncluded && <Badge variant="outline" className="text-xs">Insurance</Badge>}
                              {carrier.gpsTracking && <Badge variant="outline" className="text-xs">GPS</Badge>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bids Tab */}
        <TabsContent value="bids" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                My Bids
              </CardTitle>
              <CardDescription>
                Track your submitted bids and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bids.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bids submitted yet.</p>
                  <p className="text-sm">Find a route and place your first bid!</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {bids.map(bid => (
                      <Card key={bid.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{bid.id}</p>
                              <p className="text-sm text-muted-foreground">
                                Submitted: {bid.submittedAt.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">{formatCurrency(bid.amount)}</p>
                              <Badge variant={
                                bid.status === 'accepted' ? 'default' :
                                bid.status === 'rejected' ? 'destructive' :
                                bid.status === 'expired' ? 'secondary' : 'outline'
                              }>
                                {bid.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bid Dialog */}
      <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Your Bid</DialogTitle>
            <DialogDescription>
              Submit a competitive bid for this route
            </DialogDescription>
          </DialogHeader>
          {selectedRoute && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Route Summary</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRoute.totalDistance.toFixed(0)} km • {formatDuration(selectedRoute.totalDuration)} • AI Score: {selectedRoute.aiScore}
                </p>
                <p className="text-sm mt-2">
                  Suggested Price: <strong>{formatCurrency(selectedRoute.totalCost)}</strong>
                </p>
              </div>
              <div className="space-y-2">
                <Label>Your Bid Amount (₹)</Label>
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter your bid amount"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBidDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitBid}>
              Submit Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}