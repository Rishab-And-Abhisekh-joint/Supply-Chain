
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Route, Clock, Wand2, Milestone, MapIcon, AlertTriangle } from "lucide-react";
import Map, { Source, Layer } from 'react-map-gl';
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

const formSchema = z.object({
  origin: z.string().min(1, "Origin address is required."),
  destination: z.string().min(1, "Destination address is required."),
});

const initialViewState = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 3.5
};

// A very basic approximation to get a "route" for the map.
// In a real app, you would use a directions API.
const getRouteGeoJSON = (origin: string, destination: string): GeoJSON.Feature<GeoJSON.LineString> => {
    // Super simplified geocoding for common US cities for demo purposes
    const locations: {[key: string]: [number, number]} = {
        "new york, ny": [-74.0060, 40.7128],
        "los angeles, ca": [-118.2437, 34.0522],
        "chicago, il": [-87.6298, 41.8781],
        "houston, tx": [-95.3698, 29.7604],
        "phoenix, az": [-112.0740, 33.4484],
        "1600 Amphitheatre Parkway, Mountain View, CA": [-122.084, 37.422],
        "1 Infinite Loop, Cupertino, CA": [-122.0322, 37.3318]
    }
    const originCoords = locations[origin.toLowerCase()] || [-98.5795, 39.8283];
    const destinationCoords = locations[destination.toLowerCase()] || [-98.5795, 39.8283];

    return {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: [originCoords, destinationCoords]
        }
    };
}


export default function LogisticsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OptimizeLogisticsDecisionsOutput | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const { toast } = useToast();
  const { theme } = useTheme();
  const [primaryColor, setPrimaryColor] = useState("");
  
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const style = getComputedStyle(document.body);
      const primaryHsl = style.getPropertyValue("--primary").trim();
      setPrimaryColor(`hsl(${primaryHsl})`);
    }
  }, [theme]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: "1600 Amphitheatre Parkway, Mountain View, CA",
      destination: "1 Infinite Loop, Cupertino, CA",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setRouteGeoJSON(null);

    const aiResponse = await getLogisticsOptimization(values);

    if (aiResponse.success && aiResponse.data) {
      setResult(aiResponse.data);
      toast({ title: "Optimization Complete", description: "Logistics plan has been generated." });
      setRouteGeoJSON(getRouteGeoJSON(values.origin, values.destination));
    } else {
      toast({ variant: "destructive", title: "Error", description: aiResponse.error });
    }
    
    setIsLoading(false);
  }

  const renderMap = () => {
    if (!mapboxToken || mapboxToken === 'YOUR_MAPBOX_API_KEY_HERE') {
      return (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Mapbox API Key Missing</AlertTitle>
            <AlertDescription>
              Please add your Mapbox API key to your `.env` file as `NEXT_PUBLIC_MAPBOX_API_KEY=YOUR_API_KEY_HERE`. You can get a key from the Mapbox website.
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
                mapboxAccessToken={mapboxToken}
                initialViewState={initialViewState}
                mapStyle="mapbox://styles/mapbox/streets-v11"
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter starting address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter ending address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading || !mapboxToken || mapboxToken === 'YOUR_MAPBOX_API_KEY_HERE'}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Optimize Route
              </Button>
            </form>
          </Form>

          {isLoading && (
            <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">Finding optimal route...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 pt-6">
              <h3 className="text-lg font-semibold">Optimization Results</h3>
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
              {routeGeoJSON ? "Preview of the optimized route." : "The route preview will appear here after optimization."}
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
