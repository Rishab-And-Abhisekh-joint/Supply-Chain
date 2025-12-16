'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package, Truck, Plane, Train, Ship, MapPin, Clock, 
  TrendingUp, TrendingDown, DollarSign, Search, Filter,
  RefreshCw, Eye, ChevronRight, Navigation, Warehouse,
  ShoppingCart, AlertTriangle, CheckCircle2, Activity,
  BarChart3, Globe, Zap, Box, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type TransportMode = 'truck' | 'flight' | 'train' | 'ship';
type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'delayed';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderLevel: number;
  unitPrice: number;
  totalValue: number;
  lastUpdated: Date;
  warehouseId: string;
  warehouseName: string;
}

interface TransitItem {
  id: string;
  shipmentId: string;
  productName: string;
  quantity: number;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  transportMode: TransportMode;
  vehicleId: string;
  driverName: string;
  driverPhone: string;
  departureTime: Date;
  estimatedArrival: Date;
  currentLocation: { lat: number; lng: number };
  progress: number;
  value: number;
}

interface DashboardStats {
  totalProducts: number;
  displayedProducts: number;
  totalInventoryValue: number;
  itemsInTransit: number;
  transitValue: number;
  delayedShipments: number;
  lowStockItems: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatValue = (value: number): string => {
  if (value >= 1e10) return `₹${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e9) return `₹${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
  if (value >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
  return `₹${value.toLocaleString()}`;
};

const formatQuantity = (qty: number): string => {
  if (qty >= 1e6) return `${(qty / 1e6).toFixed(1)}M`;
  if (qty >= 1e3) return `${(qty / 1e3).toFixed(1)}K`;
  return qty.toLocaleString();
};

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const categories = ['Electronics', 'Clothing', 'Food & Beverages', 'Furniture', 'Automotive', 'Healthcare', 'Sports', 'Home & Garden'];
const warehouses = [
  { id: 'wh-001', name: 'Delhi Central' },
  { id: 'wh-002', name: 'Mumbai Hub' },
  { id: 'wh-003', name: 'Chennai Center' },
  { id: 'wh-004', name: 'Bangalore Depot' },
  { id: 'wh-005', name: 'Kolkata Facility' },
];

const generateProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, i) => {
    const currentStock = Math.floor(Math.random() * 10000);
    const reservedStock = Math.floor(currentStock * Math.random() * 0.3);
    const unitPrice = Math.floor(Math.random() * 50000) + 100;
    const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
    
    return {
      id: `prod-${i + 1}`,
      sku: `SKU-${String(100000 + i).padStart(6, '0')}`,
      name: `Product ${i + 1} - ${categories[i % categories.length]}`,
      category: categories[i % categories.length],
      currentStock,
      reservedStock,
      availableStock: currentStock - reservedStock,
      reorderLevel: Math.floor(Math.random() * 500) + 100,
      unitPrice,
      totalValue: currentStock * unitPrice,
      lastUpdated: new Date(Date.now() - Math.random() * 86400000),
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
    };
  });
};

const generateTransitItems = (): TransitItem[] => {
  const modes: TransportMode[] = ['truck', 'flight', 'train', 'ship'];
  const statuses: ShipmentStatus[] = ['pending', 'in_transit', 'delivered', 'delayed'];
  const origins = ['Delhi Central', 'Mumbai Hub', 'Chennai Center'];
  const destinations = ['Bangalore Store', 'Hyderabad Outlet', 'Pune Retail', 'Ahmedabad Shop'];
  
  return Array.from({ length: 25 }, (_, i) => ({
    id: `transit-${i + 1}`,
    shipmentId: `SHP-${String(10000 + i).padStart(5, '0')}`,
    productName: `Product Batch ${i + 1}`,
    quantity: Math.floor(Math.random() * 1000) + 50,
    origin: origins[i % origins.length],
    destination: destinations[i % destinations.length],
    status: statuses[i % statuses.length],
    transportMode: modes[i % modes.length],
    vehicleId: `VH-${String(1000 + i).padStart(4, '0')}`,
    driverName: ['Amit Singh', 'Ravi Sharma', 'Suresh Kumar', 'Vijay Patel', 'Mohan Das'][i % 5],
    driverPhone: `+91 98765${String(43210 + i).slice(-5)}`,
    departureTime: new Date(Date.now() - Math.random() * 86400000),
    estimatedArrival: new Date(Date.now() + Math.random() * 172800000),
    currentLocation: {
      lat: 20 + Math.random() * 10,
      lng: 75 + Math.random() * 10,
    },
    progress: Math.floor(Math.random() * 100),
    value: Math.floor(Math.random() * 5000000) + 100000,
  }));
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

const TransportIcon = ({ mode, className }: { mode: TransportMode; className?: string }) => {
  const icons = { truck: Truck, flight: Plane, train: Train, ship: Ship };
  const colors = { truck: 'text-blue-500', flight: 'text-purple-500', train: 'text-green-500', ship: 'text-cyan-500' };
  const Icon = icons[mode];
  return <Icon className={`${className} ${colors[mode]}`} />;
};

const StatusBadge = ({ status }: { status: ShipmentStatus }) => {
  const config: Record<ShipmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    pending: { label: 'Pending', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    in_transit: { label: 'In Transit', variant: 'default', icon: <Truck className="h-3 w-3" /> },
    delivered: { label: 'Delivered', variant: 'outline', icon: <CheckCircle2 className="h-3 w-3 text-green-500" /> },
    delayed: { label: 'Delayed', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
  };
  const { label, variant, icon } = config[status];
  return <Badge variant={variant} className="gap-1">{icon}{label}</Badge>;
};

const StatCard = ({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'blue'
}: { 
  title: string; 
  value: string | number; 
  subValue?: string;
  icon: React.ElementType; 
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className={`bg-gradient-to-r ${colorClasses[color]} p-4 text-white`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-80">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {subValue && <p className="text-xs opacity-70">{subValue}</p>}
            </div>
            <Icon className="h-8 w-8 opacity-80" />
          </div>
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2 text-sm">
              {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// LIVE MAP COMPONENT (SIMPLIFIED)
// ============================================================================

const LiveMap = ({ transitItems }: { transitItems: TransitItem[] }) => {
  const inTransit = transitItems.filter(t => t.status === 'in_transit');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Live Tracking Map
        </CardTitle>
        <CardDescription>{inTransit.length} vehicles currently in transit</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Simplified map representation */}
        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg h-[300px] overflow-hidden">
          {/* India outline placeholder */}
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Globe className="h-16 w-16 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Interactive map would render here</p>
              <p className="text-xs">Showing {inTransit.length} live vehicle positions</p>
            </div>
          </div>
          
          {/* Vehicle markers */}
          {inTransit.slice(0, 10).map((item, idx) => (
            <div
              key={item.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
              style={{
                left: `${20 + (idx * 8)}%`,
                top: `${30 + (idx * 5)}%`,
              }}
            >
              <div className="bg-white rounded-full p-1 shadow-lg">
                <TransportIcon mode={item.transportMode} className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          {(['truck', 'flight', 'train', 'ship'] as TransportMode[]).map(mode => {
            const count = inTransit.filter(t => t.transportMode === mode).length;
            return (
              <div key={mode} className="flex items-center gap-1">
                <TransportIcon mode={mode} className="h-4 w-4" />
                <span className="capitalize">{mode}: {count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MAX_DISPLAY_PRODUCTS = 1000;
const TOTAL_PRODUCTS = 2500000; // 2.5 million

export default function EnhancedDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transitItems, setTransitItems] = useState<TransitItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setProducts(generateProducts(MAX_DISPLAY_PRODUCTS));
      setTransitItems(generateTransitItems());
      setIsLoading(false);
    }, 1000);
  }, []);

  // Real-time updates for transit items
  useEffect(() => {
    const interval = setInterval(() => {
      setTransitItems(prev => prev.map(item => ({
        ...item,
        progress: Math.min(100, item.progress + Math.random() * 2),
        currentLocation: {
          lat: item.currentLocation.lat + (Math.random() * 0.1 - 0.05),
          lng: item.currentLocation.lng + (Math.random() * 0.1 - 0.05),
        },
      })));
      setLastRefresh(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !p.sku.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (warehouseFilter !== 'all' && p.warehouseId !== warehouseFilter) return false;
      return true;
    });
  }, [products, searchQuery, categoryFilter, warehouseFilter]);

  // Calculate stats
  const stats: DashboardStats = useMemo(() => {
    const totalInventoryValue = products.reduce((sum, p) => sum + p.totalValue, 0);
    const transitValue = transitItems.reduce((sum, t) => sum + t.value, 0);
    const lowStockItems = products.filter(p => p.availableStock <= p.reorderLevel).length;
    const delayedShipments = transitItems.filter(t => t.status === 'delayed').length;
    
    return {
      totalProducts: TOTAL_PRODUCTS,
      displayedProducts: filteredProducts.length,
      totalInventoryValue: totalInventoryValue * (TOTAL_PRODUCTS / MAX_DISPLAY_PRODUCTS),
      itemsInTransit: transitItems.filter(t => t.status === 'in_transit').length,
      transitValue,
      delayedShipments,
      lowStockItems: Math.floor(lowStockItems * (TOTAL_PRODUCTS / MAX_DISPLAY_PRODUCTS)),
    };
  }, [products, transitItems, filteredProducts]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setProducts(generateProducts(MAX_DISPLAY_PRODUCTS));
      setTransitItems(generateTransitItems());
      setLastRefresh(new Date());
      setIsLoading(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Supply Chain Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time overview of inventory and logistics • Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard 
          title="Total Products" 
          value={formatQuantity(stats.totalProducts)}
          subValue={`Showing ${formatQuantity(stats.displayedProducts)}`}
          icon={Package}
          color="blue"
        />
        <StatCard 
          title="Inventory Value" 
          value={formatValue(stats.totalInventoryValue)}
          icon={DollarSign}
          trend="up"
          trendValue="+12.5% this month"
          color="green"
        />
        <StatCard 
          title="In Transit" 
          value={stats.itemsInTransit}
          subValue={formatValue(stats.transitValue)}
          icon={Truck}
          color="purple"
        />
        <StatCard 
          title="Delayed" 
          value={stats.delayedShipments}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard 
          title="Low Stock" 
          value={formatQuantity(stats.lowStockItems)}
          icon={Box}
          color="orange"
        />
        <StatCard 
          title="Warehouses" 
          value={warehouses.length}
          icon={Warehouse}
          color="blue"
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="inventory">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="transit" className="gap-2">
            <Truck className="h-4 w-4" />
            Transit
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-2">
            <Globe className="h-4 w-4" />
            Live Map
          </TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search products or SKU..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehouses.map(wh => (
                      <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notice about limited display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Note:</strong> Displaying first {formatQuantity(MAX_DISPLAY_PRODUCTS)} of {formatQuantity(TOTAL_PRODUCTS)} products. 
            Use filters to narrow down results.
          </div>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
              <CardDescription>Showing {filteredProducts.length} products</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredProducts.slice(0, 50).map(product => (
                    <div 
                      key={product.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.name}</span>
                          <Badge variant="outline" className="text-xs">{product.sku}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{product.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Warehouse className="h-3 w-3" />
                            {product.warehouseName}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatQuantity(product.availableStock)} units</div>
                        <div className="text-sm text-muted-foreground">{formatValue(product.totalValue)}</div>
                        {product.availableStock <= product.reorderLevel && (
                          <Badge variant="destructive" className="text-xs mt-1">Low Stock</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transit Tab */}
        <TabsContent value="transit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipments in Transit</CardTitle>
              <CardDescription>Real-time tracking of all shipments</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {transitItems.map(item => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          {/* Shipment Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <TransportIcon mode={item.transportMode} className="h-5 w-5" />
                              <span className="font-semibold">{item.shipmentId}</span>
                              <StatusBadge status={item.status} />
                            </div>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-green-500" />
                                <span>{item.origin}</span>
                                <ChevronRight className="h-4 w-4" />
                                <MapPin className="h-4 w-4 text-red-500" />
                                <span>{item.destination}</span>
                              </div>
                              <div className="flex items-center gap-4 text-muted-foreground">
                                <span>🚛 {item.vehicleId}</span>
                                <span>👤 {item.driverName}</span>
                                <span>📦 {item.quantity} units</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress & ETA */}
                          <div className="w-full md:w-48 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{item.progress.toFixed(0)}%</span>
                            </div>
                            <Progress value={item.progress} />
                            <div className="text-xs text-muted-foreground">
                              <div>📍 {item.currentLocation.lat.toFixed(4)}, {item.currentLocation.lng.toFixed(4)}</div>
                              <div>🕐 ETA: {item.estimatedArrival.toLocaleString()}</div>
                            </div>
                          </div>

                          {/* Value */}
                          <div className="text-right">
                            <div className="text-lg font-bold">{formatValue(item.value)}</div>
                            <Button size="sm" variant="outline" className="mt-2">
                              <Eye className="h-4 w-4 mr-1" />
                              Track
                            </Button>
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

        {/* Map Tab */}
        <TabsContent value="map">
          <LiveMap transitItems={transitItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
}