
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
import { getDemandForecast } from "@/app/forecasting/actions";
import { useToast } from "@/hooks/use-toast";
import type { PredictProductDemandOutput } from "@/ai/flows/predict-product-demand";
import DemandForecastChart from "./demand-forecast-chart";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  productName: z.string().min(1, "Product name is required."),
  historicalDataRange: z.coerce.number().int().positive("Please select a historical data range."),
  forecastHorizon: z.coerce.number().int().min(1, "Please select a forecast horizon."),
});

const products = ["Laptops", "Monitors", "Keyboards", "Mice"];
const historicalRanges = [
    { label: "Last 6 Months", value: 6 },
    { label: "Last 12 Months", value: 12 },
    { label: "Last 24 Months", value: 24 },
];
const forecastHorizons = [
    { label: "Next 3 Months", value: 3 },
    { label: "Next 6 Months", value: 6 },
    { label: "Next 12 Months", value: 12 },
];

export default function ForecastingClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictProductDemandOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "Laptops",
      historicalDataRange: 12,
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product} value={product}>{product}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="historicalDataRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Historical Data</FormLabel>
                   <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                     <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {historicalRanges.map(range => (
                        <SelectItem key={range.value} value={String(range.value)}>{range.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="forecastHorizon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forecast Horizon</FormLabel>
                   <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a horizon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {forecastHorizons.map(horizon => (
                        <SelectItem key={horizon.value} value={String(horizon.value)}>{horizon.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
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
                         <p className="text-sm text-muted-foreground">Total units over {form.getValues('forecastHorizon')} months</p>
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
