"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Route, Clock, Wand2, Milestone, MapIcon } from "lucide-react";
import { GoogleMap, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';

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

const formSchema = z.object({
  origin: z.string().min(1, "Origin address is required."),
  destination: z.string().min(1, "Destination address is required."),
});

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: 'var(--radius)',
};

const center = {
  lat: 40.7128,
  lng: -74.0060
};

export default function LogisticsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OptimizeLogisticsDecisionsOutput | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const { toast } = useToast();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

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
    setDirections(null);

    const aiResponse = await getLogisticsOptimization(values);

    if (aiResponse.success && aiResponse.data) {
      setResult(aiResponse.data);
      toast({ title: "Optimization Complete", description: "Logistics plan has been generated." });
      
      if (isLoaded) {
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: values.origin,
            destination: values.destination,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
              setDirections(result);
            } else {
              console.error(`error fetching directions ${result}`);
              toast({ variant: "destructive", title: "Map Error", description: "Could not fetch route preview from Google Maps." });
            }
          }
        );
      }

    } else {
      toast({ variant: "destructive", title: "Error", description: aiResponse.error });
    }
    
    setIsLoading(false);
  }

  const renderMap = () => {
    if (loadError) {
      return <div className="p-4 text-center text-destructive">Error loading maps. Please ensure your Google Maps API key is valid and added to your .env.local file.</div>;
    }
    if (!isLoaded) {
      return <Skeleton className="h-[400px] w-full" />;
    }
    return (
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={10}
      >
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
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
              <Button type="submit" disabled={isLoading || !isLoaded}>
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
              {directions ? "Preview of the optimized route." : "The route preview will appear here after optimization."}
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
