'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Package, Truck, Plane, Train, Ship, MapPin, Clock, 
  ArrowRight, ArrowDown, ArrowUp, RefreshCw, Filter,
  Building2, Warehouse, Store, Shield, Users, Eye,
  CheckCircle2, AlertTriangle, XCircle, Loader2,
  Navigation, Route, Calendar, DollarSign
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type UserRole = 'owner' | 'ceo' | 'regional_manager' | 'warehouse_manager' | 'retail_seller';
type GoodsDirection = 'incoming' | 'outgoing';
type TransportMode = 'truck' | 'flight' | 'train' | 'ship';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authorizedWarehouseIds: string[];
  authorizedShopIds: string[];
  region?: string;
}

interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'shop' | 'supplier' | 'distributor';
  address: string;
  city: string;
  state: string;
  coordinates: { lat: number; lng: number };
  capacity?: number;
  currentStock?: number;
  region: string;
}

interface Shipment {
  id: string;
  originId: string;
  originName: string;
  destinationId: string;
  destinationName: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed';
  transportMode: TransportMode;
  vehicleId: string;
  driverName?: string;
  driverPhone?: string;
  departureTime: Date;
  estimatedArrival: Date;
  actualArrival?: Date;
  currentLocation?: { lat: number; lng: number };
  progress: number;
  items: { sku: string; name: string; quantity: number; value: number }[];
  totalValue: number;
  direction: GoodsDirection;
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
}

interface RouteLeg {
  from: string;
  to: string;
  mode: TransportMode;
  distance: number;
  duration: number;
  cost: number;
  carrier?: string;
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const generateMockUser = (): User => ({
  id: 'user-001',
  name: 'Rajesh Kumar',
  email: 'rajesh@company.com',
  role: 'regional_manager',
  authorizedWarehouseIds: ['wh-001', 'wh-002', 'wh-003'],
  authorizedShopIds: ['shop-001', 'shop-002', 'shop-003', 'shop-004'],
  region: 'North India',
});

const generateMockLocations = (): Location[] => [
  { id: 'wh-001', name: 'Delhi Central Warehouse', type: 'warehouse', address: '123 Industrial Area', city: 'Delhi', state: 'Delhi', coordinates: { lat: 28.6139, lng: 77.2090 }, capacity: 50000, currentStock: 35000, region: 'North India' },
  { id: 'wh-002', name: 'Gurgaon Distribution Hub', type: 'warehouse', address: '456 Logistics Park', city: 'Gurgaon', state: 'Haryana', coordinates: { lat: 28.4595, lng: 77.0266 }, capacity: 75000, currentStock: 52000, region: 'North India' },
  { id: 'wh-003', name: 'Noida Fulfillment Center', type: 'warehouse', address: '789 Sector 62', city: 'Noida', state: 'UP', coordinates: { lat: 28.6273, lng: 77.3714 }, capacity: 40000, currentStock: 28000, region: 'North India' },
  { id: 'wh-004', name: 'Mumbai Port Warehouse', type: 'warehouse', address: '101 Nhava Sheva', city: 'Mumbai', state: 'Maharashtra', coordinates: { lat: 19.0760, lng: 72.8777 }, capacity: 100000, currentStock: 78000, region: 'West India' },
  { id: 'wh-005', name: 'Chennai Logistics Center', type: 'warehouse', address: '202 Industrial Estate', city: 'Chennai', state: 'Tamil Nadu', coordinates: { lat: 13.0827, lng: 80.2707 }, capacity: 60000, currentStock: 41000, region: 'South India' },
  { id: 'shop-001', name: 'Connaught Place Store', type: 'shop', address: 'Block A, CP', city: 'Delhi', state: 'Delhi', coordinates: { lat: 28.6315, lng: 77.2167 }, region: 'North India' },
  { id: 'shop-002', name: 'Cyber Hub Retail', type: 'shop', address: 'DLF Cyber City', city: 'Gurgaon', state: 'Haryana', coordinates: { lat: 28.4948, lng: 77.0886 }, region: 'North India' },
  { id: 'shop-003', name: 'Sector 18 Mall Store', type: 'shop', address: 'Atta Market', city: 'Noida', state: 'UP', coordinates: { lat: 28.5700, lng: 77.3219 }, region: 'North India' },
  { id: 'shop-004', name: 'Karol Bagh Outlet', type: 'shop', address: 'Ajmal Khan Road', city: 'Delhi', state: 'Delhi', coordinates: { lat: 28.6519, lng: 77.1909 }, region: 'North India' },
  { id: 'supplier-001', name: 'Tata Steel Supplier', type: 'supplier', address: 'Jamshedpur Works', city: 'Jamshedpur', state: 'Jharkhand', coordinates: { lat: 22.8046, lng: 86.2029 }, region: 'East India' },
  { id: 'supplier-002', name: 'Reliance Industries', type: 'supplier', address: 'Jamnagar Refinery', city: 'Jamnagar', state: 'Gujarat', coordinates: { lat: 22.4707, lng: 70.0577 }, region: 'West India' },
];

const generateMockShipments = (direction: GoodsDirection): Shipment[] => {
  const now = new Date();
  const modes: TransportMode[] = ['truck', 'flight', 'train', 'ship'];
  const statuses: Shipment['status'][] = ['pending', 'in_transit', 'delivered', 'delayed'];
  
  return Array.from({ length: 15 }, (_, i) => {
    const isIncoming = direction === 'incoming';
    return {
      id: `ship-${direction}-${i + 1}`,
      originId: isIncoming ? `supplier-00${(i % 2) + 1}` : `wh-00${(i % 3) + 1}`,
      originName: isIncoming ? ['Tata Steel Supplier', 'Reliance Industries'][i % 2] : ['Delhi Central Warehouse', 'Gurgaon Distribution Hub', 'Noida Fulfillment Center'][i % 3],
      destinationId: isIncoming ? `wh-00${(i % 3) + 1}` : `shop-00${(i % 4) + 1}`,
      destinationName: isIncoming ? ['Delhi Central Warehouse', 'Gurgaon Distribution Hub', 'Noida Fulfillment Center'][i % 3] : ['Connaught Place Store', 'Cyber Hub Retail', 'Sector 18 Mall Store', 'Karol Bagh Outlet'][i % 4],
      status: statuses[i % 4],
      transportMode: modes[i % 4],
      vehicleId: `VH-${String(1000 + i).padStart(4, '0')}`,
      driverName: ['Amit Singh', 'Ravi Sharma', 'Suresh Kumar', 'Vijay Patel'][i % 4],
      driverPhone: `+91 98765${String(43210 + i).slice(-5)}`,
      departureTime: new Date(now.getTime() - (i * 3600000)),
      estimatedArrival: new Date(now.getTime() + ((24 - i) * 3600000)),
      progress: Math.min(100, (i * 15) % 100),
      currentLocation: { lat: 28.6139 + (Math.random() * 2 - 1), lng: 77.2090 + (Math.random() * 2 - 1) },
      items: [
        { sku: `SKU-${1000 + i}`, name: `Product ${i + 1}`, quantity: 100 + (i * 50), value: 5000 + (i * 1000) },
        { sku: `SKU-${2000 + i}`, name: `Product ${i + 10}`, quantity: 200 + (i * 30), value: 8000 + (i * 500) },
      ],
      totalValue: 13000 + (i * 1500),
      direction,
    };
  });
};

// ============================================================================
// AUTHORITY-BASED FILTERING
// ============================================================================

const getLocationsForGoodsFlow = (
  user: User,
  direction: GoodsDirection,
  allLocations: Location[]
): { origins: Location[]; destinations: Location[] } => {
  // Owner/CEO sees all locations
  if (user.role === 'owner' || user.role === 'ceo') {
    if (direction === 'incoming') {
      return {
        origins: allLocations.filter(l => l.type === 'supplier' || l.type === 'distributor'),
        destinations: allLocations.filter(l => l.type === 'warehouse'),
      };
    } else {
      return {
        origins: allLocations.filter(l => l.type === 'warehouse'),
        destinations: allLocations.filter(l => l.type === 'shop' || l.type === 'distributor'),
      };
    }
  }

  // Regional Manager sees only assigned locations
  if (user.role === 'regional_manager') {
    const authorizedWarehouses = allLocations.filter(
      l => l.type === 'warehouse' && user.authorizedWarehouseIds.includes(l.id)
    );
    const authorizedShops = allLocations.filter(
      l => l.type === 'shop' && user.authorizedShopIds.includes(l.id)
    );
    
    if (direction === 'incoming') {
      return {
        origins: allLocations.filter(l => l.type === 'supplier' || l.type === 'distributor'),
        destinations: authorizedWarehouses,
      };
    } else {
      return {
        origins: authorizedWarehouses,
        destinations: authorizedShops,
      };
    }
  }

  // Warehouse Manager sees only their warehouse
  if (user.role === 'warehouse_manager') {
    const myWarehouse = allLocations.filter(
      l => l.type === 'warehouse' && user.authorizedWarehouseIds.includes(l.id)
    );
    
    if (direction === 'incoming') {
      return {
        origins: allLocations.filter(l => l.type === 'supplier'),
        destinations: myWarehouse,
      };
    } else {
      return {
        origins: myWarehouse,
        destinations: allLocations.filter(l => l.type === 'shop'),
      };
    }
  }

  // Retail Seller sees only their shops
  if (user.role === 'retail_seller') {
    const myShops = allLocations.filter(
      l => l.type === 'shop' && user.authorizedShopIds.includes(l.id)
    );
    
    return {
      origins: allLocations.filter(l => l.type === 'warehouse'),
      destinations: myShops,
    };
  }

  return { origins: [], destinations: [] };
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

const TransportIcon = ({ mode, className }: { mode: TransportMode; className?: string }) => {
  const icons = {
    truck: Truck,
    flight: Plane,
    train: Train,
    ship: Ship,
  };
  const Icon = icons[mode];
  return <Icon className={className} />;
};

const StatusBadge = ({ status }: { status: Shipment['status'] }) => {
  const variants: Record<Shipment['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    in_transit: { variant: 'default', icon: <Truck className="h-3 w-3" /> },
    delivered: { variant: 'outline', icon: <CheckCircle2 className="h-3 w-3 text-green-500" /> },
    delayed: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
  };
  const { variant, icon } = variants[status];
  return (
    <Badge variant={variant} className="gap-1">
      {icon}
      {status.replace('_', ' ')}
    </Badge>
  );
};

const RoleBadge = ({ role }: { role: UserRole }) => {
  const config: Record<UserRole, { label: string; color: string }> = {
    owner: { label: 'Owner', color: 'bg-purple-100 text-purple-800' },
    ceo: { label: 'CEO', color: 'bg-blue-100 text-blue-800' },
    regional_manager: { label: 'Regional Manager', color: 'bg-green-100 text-green-800' },
    warehouse_manager: { label: 'Warehouse Manager', color: 'bg-orange-100 text-orange-800' },
    retail_seller: { label: 'Retail Seller', color: 'bg-pink-100 text-pink-800' },
  };
  const { label, color } = config[role];
  return <Badge className={color}>{label}</Badge>;
};

const formatCurrency = (value: number): string => {
  if (value >= 1e9) return `₹${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
  if (value >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
  return `₹${value}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LogisticsClient() {
  const [user] = useState<User>(generateMockUser());
  const [allLocations] = useState<Location[]>(generateMockLocations());
  const [direction, setDirection] = useState<GoodsDirection>('incoming');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [transportFilter, setTransportFilter] = useState<string>('all');

  // Get filtered locations based on user authority and direction
  const { origins, destinations } = useMemo(
    () => getLocationsForGoodsFlow(user, direction, allLocations),
    [user, direction, allLocations]
  );

  // Load shipments when direction changes
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setShipments(generateMockShipments(direction));
      setIsLoading(false);
    }, 500);
  }, [direction]);

  // Filter shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (transportFilter !== 'all' && s.transportMode !== transportFilter) return false;
      if (selectedOrigin && s.originId !== selectedOrigin) return false;
      if (selectedDestination && s.destinationId !== selectedDestination) return false;
      return true;
    });
  }, [shipments, statusFilter, transportFilter, selectedOrigin, selectedDestination]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredShipments.length;
    const inTransit = filteredShipments.filter(s => s.status === 'in_transit').length;
    const delayed = filteredShipments.filter(s => s.status === 'delayed').length;
    const totalValue = filteredShipments.reduce((sum, s) => sum + s.totalValue, 0);
    return { total, inTransit, delayed, totalValue };
  }, [filteredShipments]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Logistics Management
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>Welcome, {user.name}</span>
            <RoleBadge role={user.role} />
            {user.region && <Badge variant="outline">{user.region}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShipments(generateMockShipments(direction))}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Authority Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Shield className="h-4 w-4" />
            <span>
              <strong>Access Level:</strong> You can view {origins.length} origin(s) and {destinations.length} destination(s) based on your role.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Direction Tabs */}
      <Tabs value={direction} onValueChange={(v) => setDirection(v as GoodsDirection)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="incoming" className="gap-2">
            <ArrowDown className="h-4 w-4" />
            Incoming Goods
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="gap-2">
            <ArrowUp className="h-4 w-4" />
            Outgoing Goods
          </TabsTrigger>
        </TabsList>

        <TabsContent value={direction} className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total Shipments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">{stats.inTransit}</div>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-600">{stats.delayed}</div>
                <p className="text-sm text-muted-foreground">Delayed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</div>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Filter Shipments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Origin</Label>
                    <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Origins" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Origins</SelectItem>
                        {origins.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Destination</Label>
                    <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Destinations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Destinations</SelectItem>
                        {destinations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Transport Mode</Label>
                    <Select value={transportFilter} onValueChange={setTransportFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modes</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="flight">Flight</SelectItem>
                        <SelectItem value="train">Train</SelectItem>
                        <SelectItem value="ship">Ship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipments List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredShipments.map(shipment => (
                  <Card key={shipment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        {/* Route Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <TransportIcon mode={shipment.transportMode} className="h-5 w-5" />
                            <span className="font-semibold">{shipment.id}</span>
                            <StatusBadge status={shipment.status} />
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span>{shipment.originName}</span>
                            <ArrowRight className="h-4 w-4" />
                            <MapPin className="h-4 w-4 text-red-500" />
                            <span>{shipment.destinationName}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              {shipment.vehicleId}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {shipment.driverName}
                            </span>
                          </div>
                        </div>

                        {/* Progress & Value */}
                        <div className="w-full md:w-48 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{shipment.progress}%</span>
                          </div>
                          <Progress value={shipment.progress} />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Value:</span>
                            <span className="font-semibold">{formatCurrency(shipment.totalValue)}</span>
                          </div>
                        </div>

                        {/* Time Info */}
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Departed: {shipment.departureTime.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>ETA: {shipment.estimatedArrival.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <Separator className="my-3" />
                      <div className="flex flex-wrap gap-2">
                        {shipment.items.slice(0, 3).map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {item.name} × {item.quantity}
                          </Badge>
                        ))}
                        {shipment.items.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{shipment.items.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Create New Shipment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Create New Shipment
          </CardTitle>
          <CardDescription>
            Plan a new shipment from available origins to destinations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Origin</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select origin" />
                </SelectTrigger>
                <SelectContent>
                  {origins.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>
                      <div className="flex items-center gap-2">
                        {loc.type === 'warehouse' ? <Warehouse className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                        {loc.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>
                      <div className="flex items-center gap-2">
                        {loc.type === 'warehouse' ? <Warehouse className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                        {loc.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transport Mode</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck"><Truck className="h-4 w-4 inline mr-2" />Truck</SelectItem>
                  <SelectItem value="flight"><Plane className="h-4 w-4 inline mr-2" />Flight</SelectItem>
                  <SelectItem value="train"><Train className="h-4 w-4 inline mr-2" />Train</SelectItem>
                  <SelectItem value="ship"><Ship className="h-4 w-4 inline mr-2" />Ship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="mt-4">
            <Navigation className="h-4 w-4 mr-2" />
            Find Optimal Route
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}