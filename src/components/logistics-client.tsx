
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Route, Clock, Wand2, Milestone, MapIcon, AlertTriangle, Check, X, RefreshCw, Edit } from "lucide-react";
import Map, { Source, Layer, type MapRef } from 'react-map-gl';
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
import { getLogisticsOptimization } from "@/app/logistics/actions";
import { useToast } from "@/hooks/use-toast";
import type { OptimizeLogisticsDecisionsOutput } from "@/ai/flows/optimize-logistics-decisions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const mockLocations = [
    { name: "DTDC Hub, New York", address: "New York, NY" },
    { name: "Blue Dart Warehouse, Chicago", address: "Chicago, IL" },
    { name: "FedEx Center, Houston", address: "Houston, TX" },
    { name: "Googleplex, Mountain View", address: "1600 Amphitheatre Parkway, Mountain View, CA" },
    { name: "Apple Park, Cupertino", address: "1 Apple Park Way, Cupertino, CA" },
    { name: "Starbucks Reserve, Seattle", address: "1124 Pike St, Seattle, WA" },
    { name: "Tesla Gigafactory, Austin", address: "13101 Harold Green Road, Austin, TX" },
]

const optimizationFormSchema = z.object({
  origin: z.string().min(1, "Origin address is required."),
  destination: z.string().min(1, "Destination address is required."),
});

const manualRouteFormSchema = z.object({
  optimalRouteSummary: z.string().min(1, "Route summary is required."),
  estimatedTime: z.string().min(1, "Estimated time is required."),
  estimatedDistance: z.string().min(1, "Estimated distance is required."),
})

const initialViewState = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 3.5
};

// A very basic approximation to get a "route" for the map.
// In a real app, you would use a directions API.
const getRouteData = (origin: string, destination: string): { geojson: GeoJSON.Feature<GeoJSON.LineString>, bounds: LngLatBoundsLike } => {
    // Super simplified geocoding for common US cities for demo purposes
    const locations: {[key: string]: [number, number]} = {
        "new york, ny": [-74.0060, 40.7128],
        "chicago, il": [-87.6298, 41.8781],
        "houston, tx": [-95.3698, 29.7604],
        "1600 amphitheatre parkway, mountain view, ca": [-122.084, 37.422],
        "1 apple park way, cupertino, ca": [-122.0322, 37.3318],
        "1124 pike st, seattle, wa": [-122.330, 47.614],
        "13101 harold green road, austin, tx": [-97.620, 30.224],
    }
    const originCoords = locations[origin.toLowerCase()] || [-98.5795, 39.8283];
    const destinationCoords = locations[destination.toLowerCase()] || [-98.5795, 39.8283];
    
    const bounds: LngLatBoundsLike = [
        [Math.min(originCoords[0], destinationCoords[0]), Math.min(originCoords[1], destinationCoords[1])],
        [Math.max(originCoords[0], destinationCoords[0]), Math.max(originCoords[1], destinationCoords[1])]
    ];

    return {
        geojson: {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: [originCoords, destinationCoords]
            }
        },
        bounds,
    };
}


export default function LogisticsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [proposedResult, setProposedResult] = useState<OptimizeLogisticsDecisionsOutput | null>(null);
  const [confirmedResult, setConfirmedResult] = useState<OptimizeLogisticsDecisionsOutput | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const [postRejectionStep, setPostRejectionStep] = useState<'idle' | 'prompt' | 'manual_entry'>('idle');
  const { toast } = useToast();
  const { theme } = useTheme();
  const [primaryColor, setPrimaryColor] = useState("");
  const mapRef = useRef<MapRef>(null);
  
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const style = getComputedStyle(document.body);
      const primaryHsl = style.getPropertyValue("--primary").trim();
      const formattedHsl = primaryHsl.replace(/ /g, ',');
      setPrimaryColor(`hsl(${formattedHsl})`);
    }
  }, [theme]);

  const optimizationForm = useForm<z.infer<typeof optimizationFormSchema>>({
    resolver: zodResolver(optimizationFormSchema),
    defaultValues: {
      origin: "1600 Amphitheatre Parkway, Mountain View, CA",
      destination: "1 Apple Park Way, Cupertino, CA",
    },
  });

  const manualRouteForm = useForm<z.infer<typeof manualRouteFormSchema>>({
    resolver: zodResolver(manualRouteFormSchema),
    defaultValues: {
      optimalRouteSummary: "",
      estimatedTime: "",
      estimatedDistance: "",
    },
  })

  async function onOptimizationSubmit(values: z.infer<typeof optimizationFormSchema>) {
    setIsLoading(true);
    setProposedResult(null);
    setConfirmedResult(null);
    setRouteGeoJSON(null);
    setPostRejectionStep('idle');

    const aiResponse = await getLogisticsOptimization(values);

    if (aiResponse.success && aiResponse.data) {
      setProposedResult(aiResponse.data);
      toast({ title: "Route Proposed", description: "Please review and confirm the optimized route." });
    } else {
      toast({ variant: "destructive", title: "Error", description: aiResponse.error });
    }
    
    setIsLoading(false);
  }

  const handleConfirmRoute = () => {
      const { origin, destination } = optimizationForm.getValues();
      const { geojson, bounds } = getRouteData(origin, destination);
      setRouteGeoJSON(geojson);
      mapRef.current?.fitBounds(bounds, { padding: 40, duration: 1000 });
  };


  function onManualSubmit(values: z.infer<typeof manualRouteFormSchema>) {
    const manualResult: OptimizeLogisticsDecisionsOutput = {
      ...values,
      reasoning: "Manually entered by user.",
      confirmation: true,
    }
    handleConfirmRoute();
    setConfirmedResult(manualResult);
    setPostRejectionStep('idle');
    toast({ title: "Route Confirmed", description: "The manual logistics plan has been finalized." });
  }

  const handleAccept = () => {
    if (proposedResult) {
      handleConfirmRoute();
      setConfirmedResult({ ...proposedResult, confirmation: true });
      setProposedResult(null);
      toast({ title: "Route Confirmed", description: "The logistics plan has been finalized." });
    }
  }

  const handleReject = () => {
    setProposedResult(null);
    setPostRejectionStep('prompt');
    toast({ variant: "destructive", title: "Route Rejected", description: "The proposed route was rejected." });
  }

  const handleTryAiAgain = () => {
    setPostRejectionStep('idle');
    onOptimizationSubmit(optimizationForm.getValues());
  }

  const result = confirmedResult || proposedResult;

  const renderMap = () => {
    if (!mapboxToken || mapboxToken === 'pk.YOUR_MAPBOX_API_KEY_HERE' || mapboxToken.startsWith('sk.')) {
      return (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Mapbox Public Key Missing</AlertTitle>
            <AlertDescription>
              Please add your public Mapbox API key (it should start with `pk.`) to your `.env` file as `NEXT_PUBLIC_MAPBOX_API_KEY=YOUR_API_KEY_HERE`. You can get a key from the Mapbox website.
            </AlertDescription>
          </Alert>
      )
    }

    if (!primaryColor) {
        return <Skeleton className="h-[400px] w-full" />;
    }

    return (
        <div className="relative h-[400px] w-full overflow-hidden rounded-md">
            <Map
                ref={mapRef}
                mapboxAccessToken={mapboxToken}
                initialViewState={initialViewState}
                mapStyle={theme === 'dark' ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v11"}
            >
                {routeGeoJSON && (
                    <Source id="route-source" type="geojson" data={routeGeoJSON}>
                        <Layer
                            id="route-layer"
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
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Form {...optimizationForm}>
            <form onSubmit={optimizationForm.handleSubmit(onOptimizationSubmit)} className="space-y-6">
               <FormField
                control={optimizationForm.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a starting location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockLocations.map(location => (
                           <SelectItem key={location.name} value={location.address}>
                            {location.name}
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
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a destination location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockLocations.map(location => (
                           <SelectItem key={location.name} value={location.address}>
                            {location.name}
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading || !mapboxToken || mapboxToken === 'pk.YOUR_MAPBOX_API_KEY_HERE' || mapboxToken.startsWith('sk.')}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Optimize Route
              </Button>
            </form>
          </Form>
          
          {postRejectionStep === 'prompt' && !isLoading && (
            <Card className="bg-muted dark:bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-base">What's Next?</CardTitle>
                    <CardDescription>The AI's suggestion was rejected. How would you like to proceed?</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleTryAiAgain} className="w-full">
                        <RefreshCw className="mr-2 h-4 w-4" /> Try AI Again
                    </Button>
                    <Button onClick={() => setPostRejectionStep('manual_entry')} variant="outline" className="w-full">
                        <Edit className="mr-2 h-4 w-4" /> Enter Manually
                    </Button>
                </CardContent>
            </Card>
          )}

          {postRejectionStep === 'manual_entry' && !isLoading && (
             <Card>
                <CardHeader>
                    <CardTitle>Enter Manual Route</CardTitle>
                    <CardDescription>Please provide the details for your custom route.</CardDescription>
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
                                    <Textarea placeholder="e.g., Take I-280 S to N De Anza Blvd..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="flex gap-4">
                                <FormField
                                    control={manualRouteForm.control}
                                    name="estimatedTime"
                                    render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Estimated Time</FormLabel>
                                        <FormControl>
                                        <Input placeholder="e.g., 25 mins" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={manualRouteForm.control}
                                    name="estimatedDistance"
                                    render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Estimated Distance</FormLabel>
                                        <FormControl>
                                        <Input placeholder="e.g., 10.5 miles" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setPostRejectionStep('prompt')}>Back</Button>
                                <Button type="submit">Confirm Manual Route</Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
          )}

          {isLoading && (
            <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">Finding optimal route...</p>
            </div>
          )}

          {result && postRejectionStep === 'idle' && (
            <div className="space-y-6 pt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                    {proposedResult ? "Proposed Route" : "Confirmed Route"}
                </h3>
                {confirmedResult && <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Route Confirmed</Badge>}
              </div>

              {proposedResult && (
                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <CardHeader>
                    <CardTitle className="text-base">Confirm Optimal Route</CardTitle>
                    <CardDescription>Does this route meet your requirements?</CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                      <Button onClick={handleAccept} className="w-full">
                        <Check className="mr-2 h-4 w-4" /> Yes, Accept Route
                      </Button>
                      <Button onClick={handleReject} variant="destructive" className="w-full">
                        <X className="mr-2 h-4 w-4" /> No, Reject
                      </Button>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Est. Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{result.estimatedTime}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <Milestone className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Est. Distance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{result.estimatedDistance}</p>
                    </CardContent>
                </Card>
              </div>
              <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Route className="h-5 w-5 text-primary" />
                        <CardTitle>Route Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">{result.optimalRouteSummary}</p>
                    </CardContent>
                </Card>
              <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Wand2 className="h-5 w-5 text-primary" />
                        <CardTitle>AI Reasoning</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">{result.reasoning}</p>
                    </CardContent>
                </Card>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-primary" />
              Route Preview
            </CardTitle>
            <CardDescription>
              {routeGeoJSON ? "Preview of the confirmed route." : "The route preview will appear here after confirmation."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderMap()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
