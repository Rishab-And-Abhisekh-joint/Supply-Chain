"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { getDemandForecast } from "@/app/forecasting/actions";
import { useToast } from "@/hooks/use-toast";
import type { PredictProductDemandOutput } from "@/ai/flows/predict-product-demand";
import DemandForecastChart from "./demand-forecast-chart";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const formSchema = z.object({
  productName: z.string().min(1, "Product name is required."),
  historicalData: z
    .string()
    .min(1, "Historical data is required.")
    .refine((data) => /^\d+(,\s*\d+)*$/.test(data), "Data must be a comma-separated list of numbers."),
  forecastHorizon: z.coerce.number().int().min(1, "Forecast horizon must be at least 1.").max(100, "Forecast horizon cannot exceed 100."),
});

export default function ForecastingClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictProductDemandOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "Laptops",
      historicalData: "150, 155, 160, 162, 165, 170, 168, 175, 180, 185, 190, 188",
      forecastHorizon: 12,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    const response = await getDemandForecast(values);
    setIsLoading(false);

    if (response.success && response.data) {
      setResult(response.data);
      toast({ title: "Forecast Generated", description: `Successfully forecasted demand for ${values.productName}.` });
    } else {
      toast({ variant: "destructive", title: "Error", description: response.error });
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Laptops" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="forecastHorizon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forecast Horizon (periods)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="historicalData"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Historical Sales Data</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter comma-separated values, e.g., 150, 155, 160..."
                    className="h-24"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Forecast
          </Button>
        </form>
      </Form>

      {isLoading && (
         <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Generating forecast...</p>
        </div>
      )}

      {result && (
        <div className="space-y-6 pt-6">
            <h3 className="text-lg font-semibold">Forecast Results</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Model Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{result.modelAccuracy.toFixed(2)}%</p>
                        <p className="text-sm text-muted-foreground">Mean Absolute Percentage Error</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Forecasted Units</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{result.forecastedDemand.reduce((a, b) => a + b, 0).toLocaleString()}</p>
                         <p className="text-sm text-muted-foreground">Total units over {form.getValues('forecastHorizon')} periods</p>
                    </CardContent>
                </Card>
            </div>
          <Card>
            <CardHeader>
                <CardTitle>Demand Forecast Chart</CardTitle>
            </CardHeader>
            <CardContent>
                <DemandForecastChart forecastData={result} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
