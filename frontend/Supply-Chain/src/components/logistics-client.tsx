"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Loader2, Route, Clock, Wand2, Milestone, MapIcon, AlertTriangle, 
  Check, X, RefreshCw, Edit, Truck, Package 
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
  getAvailableLocations,
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

const optimizationFormSchema = z.object({
  origin: z.string().min(1, "Origin address is required."),
  destination: z.string().min(1, "Destination address is required."),
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

interface Location {
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
}

const initialViewState = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 3.5
};

// Coordinates lookup for route visualization
const locationCoords: Record<string, [number, number]> = {
  "dtdc hub, new york": [-74.006, 40.7128],
  "blue dart warehouse, chicago": [-87.6298, 41.8781],
  "houston, tx": [-95.3698, 29.7604],
  "1600 amphitheatre parkway, mountain view, ca": [-122.084, 37.422],
  "1 apple park way, cupertino, ca": [-122.0322, 37.3318],
  "1124 pike st, seattle, wa": [-122.330, 47.614],
  "13101 harold green road, austin, tx": [-97.620, 30.224],
  "123 customer st, clientville": [-122.4194, 37.7749],
};

function getCoords(address: string): [number, number] {
  const normalized = address.toLowerCase().trim();
  for (const [key, coords] of Object.entries(locationCoords)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }
  return [-98.5795, 39.8283];
}

interface FinalizeOrderDialogProps {
  isOrderDialogOpen: boolean;
  setIsOrderDialogOpen: (open: boolean) => void;
  orderStep: number;
  setOrderStep: (step: number) => void;
  orderDetailsForm: UseFormReturn<z.infer<typeof orderDetailsSchema>>;
  optimizationForm: UseFormReturn<z.infer<typeof optimizationFormSchema>>;
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
  optimizationForm,
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
                    {optimizationForm.getValues('origin')} → {optimizationForm.getValues('destination')}
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  
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
      origin: "",
      destination: "",
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

  // Fetch available locations from backend
  useEffect(() => {
    async function fetchLocations() {
      const response = await getAvailableLocations();
      if (response.success && response.data) {
        setLocations(response.data);
        
        // Set defaults if available
        if (response.data.length >= 2) {
          optimizationForm.setValue('origin', response.data[0].address);
          optimizationForm.setValue('destination', response.data[1].address);
        }
      }
      setLoadingLocations(false);
    }
    fetchLocations();
  }, [optimizationForm]);

  // Handle URL params
  useEffect(() => {
    const originFromQuery = searchParams.get('origin');
    const destinationFromQuery = searchParams.get('destination');
    const productName = searchParams.get('productName');
    const quantity = searchParams.get('quantity');

    if (originFromQuery) {
      optimizationForm.setValue('origin', originFromQuery);
    }
    if (destinationFromQuery) {
      optimizationForm.setValue('destination', destinationFromQuery);
    }
    if (productName && quantity) {
      orderDetailsForm.setValue('packageDescription', `${quantity} units of ${productName}`);
      orderDetailsForm.setValue('packageCount', Math.ceil(parseInt(quantity) / 100));
    }
  }, [searchParams, optimizationForm, orderDetailsForm]);

  // Get theme color
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const style = getComputedStyle(document.body);
      const primaryHsl = style.getPropertyValue("--primary").trim();
      setPrimaryColor(`hsl(${primaryHsl.replace(/ /g, ',')})`);
    }
  }, [theme]);

  async function onOptimizationSubmit(values: z.infer<typeof optimizationFormSchema>) {
    setIsLoading(true);
    setProposedResult(null);
    setConfirmedResult(null);
    setRouteGeoJSON(null);
    setPostRejectionStep('idle');

    const response = await getLogisticsOptimization(values);

    if (response.success && response.data) {
      setProposedResult(response.data);
      toast({ title: "Route Optimized", description: "Please review and confirm the proposed route." });
    } else {
      toast({ variant: "destructive", title: "Error", description: response.error });
    }
    
    setIsLoading(false);
  }

  const handleConfirmRoute = () => {
    const { origin, destination } = optimizationForm.getValues();
    const originCoords = getCoords(origin);
    const destCoords = getCoords(destination);
    
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
    setIsSubmitting(true);
    
    try {
      const orderData = {
        origin: optimizationForm.getValues('origin'),
        destination: optimizationForm.getValues('destination'),
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
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Order Failed", 
        description: error.message || "Could not place order." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const result = confirmedResult || proposedResult;
  const isMapReady = mapboxToken && !mapboxToken.startsWith('sk.') && mapboxToken !== 'pk.YOUR_MAPBOX_API_KEY_HERE';

  if (loadingLocations) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading locations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Panel */}
        <div className="space-y-6">
          {/* Route Form */}
          <Form {...optimizationForm}>
            <form onSubmit={optimizationForm.handleSubmit(onOptimizationSubmit)} className="space-y-6">
              <FormField
                control={optimizationForm.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select origin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map(loc => (
                          <SelectItem key={loc.name} value={loc.address}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={optimizationForm.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map(loc => (
                          <SelectItem key={loc.name} value={loc.address}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={isLoading || confirmedResult !== null || !isMapReady}
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
              <p className="mt-2 text-muted-foreground">Optimizing route...</p>
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
              optimizationForm={optimizationForm}
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