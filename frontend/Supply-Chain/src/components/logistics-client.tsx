"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Loader2, Route, Clock, Wand2, Milestone, MapIcon, AlertTriangle, 
  Check, X, RefreshCw, Edit, Truck, Package, Building2, Warehouse as WarehouseIcon,
  MapPin, ArrowRight
} from "lucide-react";
import Map, { Source, Layer, Marker, type MapRef } from 'react-map-gl';
import type { LngLatBoundsLike } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  getLogisticsOptimization, 
  createShipmentOrder,
  type OptimizedRoute 
} from "@/app/logistics/actions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { suppliersApi, warehouseApiWithFallback, type Supplier, type Warehouse } from "@/lib/api";

const optimizationFormSchema = z.object({
  originId: z.string().min(1, "Please select an origin."),
  destinationId: z.string().min(1, "Please select a destination."),
});

const manualRouteFormSchema = z.object({
  optimalRouteSummary: z.string().min(1, "Route summary is required."),
  estimatedTime: z.string().min(1, "Estimated time is required."),
  estimatedDistance: z.string().min(1, "Estimated distance is required."),
});

const orderDetailsSchema = z.object({
  packageCount: z.coerce.number().int().min(1, "At least one package is required."),
  packageSize: z.string().min(1, "Package size is required (e.g., Medium)"),
  packageDescription: z.string().optional(),
});

const initialViewState = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 3.5
};

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format duration from hours to readable string
function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  } else if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h} hours ${m} min` : `${h} hours`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 
      ? `${days} days ${remainingHours} hours` 
      : `${days} days`;
  }
}

interface FinalizeOrderDialogProps {
  isOrderDialogOpen: boolean;
  setIsOrderDialogOpen: (open: boolean) => void;
  orderStep: number;
  setOrderStep: (step: number) => void;
  orderDetailsForm: UseFormReturn<z.infer<typeof orderDetailsSchema>>;
  selectedOrigin: Supplier | null;
  selectedDestination: Warehouse | null;
  handlePlaceOrder: () => void;
  confirmedResult: OptimizedRoute | null;
  isSubmitting: boolean;
}

function FinalizeOrderDialog({
  isOrderDialogOpen,
  setIsOrderDialogOpen,
  orderStep,
  setOrderStep,
  orderDetailsForm,
  selectedOrigin,
  selectedDestination,
  handlePlaceOrder,
  confirmedResult,
  isSubmitting,
}: FinalizeOrderDialogProps) {
  const packageCount = orderDetailsForm.watch('packageCount') || 1;
  const estimatedCost = (packageCount * 25.50).toFixed(2);
  const totalCost = (parseFloat(estimatedCost) * 1.08).toFixed(2);
  const advancePayment = (parseFloat(totalCost) * 0.20).toFixed(2);

  return (
    <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Truck className="mr-2 h-4 w-4" />
          Finalize and Place Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place Your Order</DialogTitle>
          <DialogDescription>
            {orderStep === 1
              ? 'Confirm package details to get an estimated cost.'
              : 'Review the final details and confirm your order.'}
          </DialogDescription>
        </DialogHeader>

        {orderStep === 1 && (
          <Form {...orderDetailsForm}>
            <form
              onSubmit={orderDetailsForm.handleSubmit(() => setOrderStep(2))}
              className="space-y-4"
            >
              <FormField
                control={orderDetailsForm.control}
                name="packageDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Contents</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2,500 Laptops" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={orderDetailsForm.control}
                  name="packageCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. of Packages</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={orderDetailsForm.control}
                  name="packageSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avg. Package Size</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Card className="bg-muted/50">
                <CardContent className="pt-6 text-sm space-y-2">
                  <p>
                    <strong>Route:</strong>{' '}
                    {selectedOrigin?.name} → {selectedDestination?.name}
                  </p>
                  <p><strong>Distance:</strong> {confirmedResult?.estimatedDistance}</p>
                  <p><strong>Est. Time:</strong> {confirmedResult?.estimatedTime}</p>
                  <p><strong>Est. Cost:</strong> ${estimatedCost}</p>
                </CardContent>
              </Card>
              <DialogFooter>
                <Button type="submit">Continue to Payment</Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {orderStep === 2 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between">
                  <span>Shipping Cost</span>
                  <span>${estimatedCost}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax (8%)</span>
                  <span>${(parseFloat(estimatedCost) * 0.08).toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${totalCost}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-primary text-lg">
                  <span>Advance Payment (20%)</span>
                  <span>${advancePayment}</span>
                </div>
              </CardContent>
            </Card>
            <DialogFooter className="sm:justify-between">
              <Button variant="ghost" onClick={() => setOrderStep(1)}>
                Back
              </Button>
              <Button onClick={handlePlaceOrder} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Pay ${advancePayment}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LogisticsClientContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposedResult, setProposedResult] = useState<OptimizedRoute | null>(null);
  const [confirmedResult, setConfirmedResult] = useState<OptimizedRoute | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const [postRejectionStep, setPostRejectionStep] = useState<'idle' | 'prompt' | 'manual_entry'>('idle');
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderStep, setOrderStep] = useState(1);
  
  // Separate state for suppliers (origins) and warehouses (destinations)
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [selectedOrigin, setSelectedOrigin] = useState<Supplier | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Warehouse | null>(null);
  
  const { toast } = useToast();
  const { theme } = useTheme();
  const [primaryColor, setPrimaryColor] = useState("");
  const mapRef = useRef<MapRef>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

  const optimizationForm = useForm<z.infer<typeof optimizationFormSchema>>({
    resolver: zodResolver(optimizationFormSchema),
    defaultValues: {
      originId: "",
      destinationId: "",
    },
  });

  const manualRouteForm = useForm<z.infer<typeof manualRouteFormSchema>>({
    resolver: zodResolver(manualRouteFormSchema),
    defaultValues: {
      optimalRouteSummary: "",
      estimatedTime: "",
      estimatedDistance: "",
    },
  });

  const orderDetailsForm = useForm<z.infer<typeof orderDetailsSchema>>({
    resolver: zodResolver(orderDetailsSchema),
    defaultValues: {
      packageCount: 1,
      packageSize: "Medium",
      packageDescription: "",
    },
  });

  // Fetch suppliers (origins) from API
  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const data = await suppliersApi.getActive();
        setSuppliers(data);
        
        // Set default if available
        if (data.length > 0) {
          setSelectedOrigin(data[0]);
          optimizationForm.setValue('originId', data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch suppliers:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load suppliers. Using demo data.",
        });
      } finally {
        setLoadingSuppliers(false);
      }
    }
    fetchSuppliers();
  }, [optimizationForm, toast]);

  // Fetch warehouses (destinations) from API
  useEffect(() => {
    async function fetchWarehouses() {
      try {
        const data = await warehouseApiWithFallback.getActive();
        setWarehouses(data);
        
        // Set default if available
        if (data.length > 0) {
          setSelectedDestination(data[0]);
          optimizationForm.setValue('destinationId', data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch warehouses:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load warehouses. Using demo data.",
        });
      } finally {
        setLoadingWarehouses(false);
      }
    }
    fetchWarehouses();
  }, [optimizationForm, toast]);

  // Handle URL params
  useEffect(() => {
    const productName = searchParams.get('productName');
    const quantity = searchParams.get('quantity');

    if (productName && quantity) {
      orderDetailsForm.setValue('packageDescription', `${quantity} units of ${productName}`);
      orderDetailsForm.setValue('packageCount', Math.ceil(parseInt(quantity) / 100));
    }
  }, [searchParams, orderDetailsForm]);

  // Get theme color
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const style = getComputedStyle(document.body);
      const primaryHsl = style.getPropertyValue("--primary").trim();
      setPrimaryColor(`hsl(${primaryHsl.replace(/ /g, ',')})`);
    }
  }, [theme]);

  // Handle origin selection
  const handleOriginChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setSelectedOrigin(supplier);
      optimizationForm.setValue('originId', supplierId);
    }
  };

  // Handle destination selection
  const handleDestinationChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    if (warehouse) {
      setSelectedDestination(warehouse);
      optimizationForm.setValue('destinationId', warehouseId);
    }
  };

  async function onOptimizationSubmit(values: z.infer<typeof optimizationFormSchema>) {
    if (!selectedOrigin || !selectedDestination) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select both origin and destination.",
      });
      return;
    }

    setIsLoading(true);
    setProposedResult(null);
    setConfirmedResult(null);
    setRouteGeoJSON(null);
    setPostRejectionStep('idle');

    // Build origin and destination strings for the action
    const originStr = `${selectedOrigin.name}, ${selectedOrigin.city}, ${selectedOrigin.state}`;
    const destStr = `${selectedDestination.name}, ${selectedDestination.city}, ${selectedDestination.state}`;

    const response = await getLogisticsOptimization({
      origin: originStr,
      destination: destStr,
    });

    if (response.success && response.data) {
      // Enhance the response with calculated distance if coordinates are available
      const enhancedResult = { ...response.data };
      
      if (selectedOrigin.latitude && selectedOrigin.longitude && 
          selectedDestination.latitude && selectedDestination.longitude) {
        const distance = calculateDistance(
          selectedOrigin.latitude,
          selectedOrigin.longitude,
          selectedDestination.latitude!,
          selectedDestination.longitude!
        );
        
        // Update with calculated values
        enhancedResult.estimatedDistance = `${Math.round(distance)} miles`;
        const hours = distance / 50; // 50 mph average
        enhancedResult.estimatedTime = formatDuration(hours);
      }
      
      setProposedResult(enhancedResult);
      toast({ title: "Route Optimized", description: "Please review and confirm the proposed route." });
    } else {
      toast({ variant: "destructive", title: "Error", description: response.error });
    }
    
    setIsLoading(false);
  }

  const handleConfirmRoute = () => {
    if (!selectedOrigin || !selectedDestination) return;
    
    const originCoords: [number, number] = [selectedOrigin.longitude, selectedOrigin.latitude];
    const destCoords: [number, number] = [
      selectedDestination.longitude || -98.5795, 
      selectedDestination.latitude || 39.8283
    ];
    
    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [originCoords, destCoords]
      }
    };
    
    setRouteGeoJSON(geojson);
    
    const bounds: LngLatBoundsLike = [
      [Math.min(originCoords[0], destCoords[0]) - 1, Math.min(originCoords[1], destCoords[1]) - 1],
      [Math.max(originCoords[0], destCoords[0]) + 1, Math.max(originCoords[1], destCoords[1]) + 1]
    ];
    
    setTimeout(() => mapRef.current?.fitBounds(bounds, { padding: 80, duration: 1000 }), 100);
  };

  function onManualSubmit(values: z.infer<typeof manualRouteFormSchema>) {
    const manualResult: OptimizedRoute = {
      ...values,
      reasoning: "Manually entered by user.",
      confirmation: true,
    };
    setConfirmedResult(manualResult);
    handleConfirmRoute();
    setPostRejectionStep('idle');
    toast({ title: "Route Confirmed", description: "Manual route has been accepted." });
  }

  const handleAccept = () => {
    if (proposedResult) {
      setConfirmedResult({ ...proposedResult, confirmation: true });
      handleConfirmRoute();
      setProposedResult(null);
      toast({ title: "Route Confirmed", description: "The logistics plan is ready." });
    }
  };

  const handleReject = () => {
    setProposedResult(null);
    setPostRejectionStep('prompt');
    toast({ variant: "destructive", title: "Route Rejected" });
  };

  const handleTryAiAgain = () => {
    setPostRejectionStep('idle');
    onOptimizationSubmit(optimizationForm.getValues());
  };

  const handlePlaceOrder = async () => {
    if (!selectedOrigin || !selectedDestination) return;
    
    setIsSubmitting(true);
    
    try {
      const orderData = {
        origin: `${selectedOrigin.name}, ${selectedOrigin.city}, ${selectedOrigin.state}`,
        destination: `${selectedDestination.name}, ${selectedDestination.city}, ${selectedDestination.state}`,
        packageCount: orderDetailsForm.getValues('packageCount'),
        packageSize: orderDetailsForm.getValues('packageSize'),
        packageDescription: orderDetailsForm.getValues('packageDescription'),
        estimatedCost: orderDetailsForm.getValues('packageCount') * 25.50 * 1.08,
        advancePayment: orderDetailsForm.getValues('packageCount') * 25.50 * 1.08 * 0.20,
      };
      
      const response = await createShipmentOrder(orderData);
      
      if (response.success && response.data) {
        setIsOrderDialogOpen(false);
        toast({ 
          title: "Order Placed Successfully!", 
          description: `Order ID: ${response.data.orderId}. Tracking: ${response.data.trackingNumber}` 
        });
        router.push('/dashboard?newOrder=true');
      } else {
        throw new Error(response.error);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Could not place order.";
      toast({ 
        variant: "destructive", 
        title: "Order Failed", 
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const result = confirmedResult || proposedResult;
  const isMapReady = mapboxToken && !mapboxToken.startsWith('sk.') && mapboxToken !== 'pk.YOUR_MAPBOX_API_KEY_HERE';
  const isDataLoading = loadingSuppliers || loadingWarehouses;

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading suppliers and warehouses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Suppliers</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <WarehouseIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warehouses</p>
                <p className="text-2xl font-bold">{warehouses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Wand2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Optimization</p>
                <p className="text-2xl font-bold">24/7</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Panel */}
        <div className="space-y-6">
          {/* Route Form */}
          <Form {...optimizationForm}>
            <form onSubmit={optimizationForm.handleSubmit(onOptimizationSubmit)} className="space-y-6">
              {/* Origin Dropdown (Suppliers) */}
              <FormField
                control={optimizationForm.control}
                name="originId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Origin (Supplier/Distributor)
                    </FormLabel>
                    <Select 
                      onValueChange={handleOriginChange} 
                      value={field.value}
                      disabled={!!confirmedResult}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select origin supplier..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{supplier.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {supplier.city}, {supplier.state} • {supplier.type}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Destination Dropdown (Warehouses) */}
              <FormField
                control={optimizationForm.control}
                name="destinationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <WarehouseIcon className="h-4 w-4 text-green-600" />
                      Destination (Warehouse)
                    </FormLabel>
                    <Select 
                      onValueChange={handleDestinationChange} 
                      value={field.value}
                      disabled={!!confirmedResult}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination warehouse..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map(warehouse => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{warehouse.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {warehouse.city}, {warehouse.state} {warehouse.code && `• ${warehouse.code}`}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selection Summary */}
              {selectedOrigin && selectedDestination && !confirmedResult && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span>{selectedOrigin.city}, {selectedOrigin.state}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span>{selectedDestination.city}, {selectedDestination.state}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                type="submit" 
                disabled={isLoading || confirmedResult !== null || !isMapReady || !selectedOrigin || !selectedDestination}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Route className="mr-2 h-4 w-4" />
                Optimize Route
              </Button>
            </form>
          </Form>

          {/* Post-Rejection Options */}
          {postRejectionStep === 'prompt' && !isLoading && (
            <Card className="bg-muted dark:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Route Rejected</CardTitle>
                <CardDescription>How would you like to proceed?</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleTryAiAgain} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
                <Button onClick={() => setPostRejectionStep('manual_entry')} variant="outline" className="flex-1">
                  <Edit className="mr-2 h-4 w-4" /> Enter Manually
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Manual Entry Form */}
          {postRejectionStep === 'manual_entry' && !isLoading && (
            <Card>
              <CardHeader>
                <CardTitle>Manual Route Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...manualRouteForm}>
                  <form onSubmit={manualRouteForm.handleSubmit(onManualSubmit)} className="space-y-4">
                    <FormField
                      control={manualRouteForm.control}
                      name="optimalRouteSummary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Route Summary</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the route..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={manualRouteForm.control}
                        name="estimatedTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Est. Time</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 2 hours" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={manualRouteForm.control}
                        name="estimatedDistance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Est. Distance</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 50 miles" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setPostRejectionStep('prompt')}>
                        Back
                      </Button>
                      <Button type="submit">Confirm Route</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Optimizing route with AI...</p>
            </div>
          )}

          {/* Route Results */}
          {result && postRejectionStep === 'idle' && (
            <div className="space-y-6 pt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {proposedResult ? "Proposed Route" : "Confirmed Route"}
                </h3>
                {confirmedResult && (
                  <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                )}
              </div>

              {/* Accept/Reject for proposed */}
              {proposedResult && (
                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                  <CardContent className="pt-6 flex gap-4">
                    <Button onClick={handleAccept} className="flex-1">
                      <Check className="mr-2 h-4 w-4" /> Accept
                    </Button>
                    <Button onClick={handleReject} variant="destructive" className="flex-1">
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Route Details */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{result.estimatedTime}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Milestone className="h-4 w-4" /> Distance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{result.estimatedDistance}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Route className="h-4 w-4" /> Route Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{result.optimalRouteSummary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wand2 className="h-4 w-4" /> AI Reasoning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{result.reasoning}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Panel - Map & Order */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-primary" />
                Route Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isMapReady ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Mapbox Key Missing</AlertTitle>
                  <AlertDescription>
                    Add NEXT_PUBLIC_MAPBOX_API_KEY to your .env file.
                  </AlertDescription>
                </Alert>
              ) : !primaryColor ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="relative h-[400px] w-full overflow-hidden rounded-md">
                  <Map
                    ref={mapRef}
                    mapboxAccessToken={mapboxToken}
                    initialViewState={initialViewState}
                    mapStyle={theme === 'dark' 
                      ? "mapbox://styles/mapbox/dark-v11" 
                      : "mapbox://styles/mapbox/streets-v11"
                    }
                  >
                    {routeGeoJSON && (
                      <Source id="route" type="geojson" data={routeGeoJSON}>
                        <Layer
                          id="route-line"
                          type="line"
                          paint={{
                            'line-color': primaryColor,
                            'line-width': 4,
                            'line-opacity': 0.8
                          }}
                        />
                      </Source>
                    )}
                    
                    {/* Origin Marker */}
                    {selectedOrigin && (
                      <Marker 
                        longitude={selectedOrigin.longitude} 
                        latitude={selectedOrigin.latitude}
                        anchor="bottom"
                      >
                        <div className="p-2 bg-blue-600 rounded-full shadow-lg">
                          <Building2 className="h-4 w-4 text-white" />
                        </div>
                      </Marker>
                    )}
                    
                    {/* Destination Marker */}
                    {selectedDestination && selectedDestination.longitude && selectedDestination.latitude && (
                      <Marker 
                        longitude={selectedDestination.longitude} 
                        latitude={selectedDestination.latitude}
                        anchor="bottom"
                      >
                        <div className="p-2 bg-green-600 rounded-full shadow-lg">
                          <WarehouseIcon className="h-4 w-4 text-white" />
                        </div>
                      </Marker>
                    )}
                  </Map>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Place Order Button */}
          {confirmedResult && (
            <FinalizeOrderDialog
              isOrderDialogOpen={isOrderDialogOpen}
              setIsOrderDialogOpen={setIsOrderDialogOpen}
              orderStep={orderStep}
              setOrderStep={setOrderStep}
              orderDetailsForm={orderDetailsForm}
              selectedOrigin={selectedOrigin}
              selectedDestination={selectedDestination}
              handlePlaceOrder={handlePlaceOrder}
              confirmedResult={confirmedResult}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function LogisticsClient() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    }>
      <LogisticsClientContent />
    </React.Suspense>
  );
}