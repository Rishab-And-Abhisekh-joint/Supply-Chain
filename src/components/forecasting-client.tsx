
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertTriangle, PackagePlus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getDemandForecast } from "@/app/forecasting/actions";
import { useToast } from "@/hooks/use-toast";
import type { PredictProductDemandOutput } from "@/ai/flows/predict-product-demand";
import DemandForecastChart from "./demand-forecast-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  productName: z.string().min(1, "Product name is required."),
  historicalDataRange: z.coerce.number().int().positive("Please select a historical data range."),
  forecastHorizon: z.coerce.number().int().min(1, "Please select a forecast horizon."),
});

const products = ["Laptops", "Monitors", "Keyboards", "Mice", "Premium Laptop", "Wireless Mouse", "Mechanical Keyboard", "4K Monitor", "USB-C Hub"];
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

// Mock current inventory levels for ADMIN
const adminInventory: { [key: string]: number } = {
    "Laptops": 1250,
    "Monitors": 2000,
    "Keyboards": 4800,
    "Mice": 5500,
};

export default function ForecastingClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictProductDemandOutput | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "Laptops",
      historicalDataRange: 12,
      forecastHorizon: 12,
    },
  });

  const isCustomer = searchParams.get('source') === 'customer';

  useEffect(() => {
    const productNameFromQuery = searchParams.get('productName');
    if (isCustomer && productNameFromQuery) {
        form.setValue('productName', productNameFromQuery);
    }
  }, [searchParams, form, isCustomer]);


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

  const handlePlaceOrder = (productName: string, quantity: number) => {
    const params = new URLSearchParams({
        productName: productName,
        quantity: String(quantity),
    });

    if (isCustomer) {
        // Assume customer's address is their destination
        params.append('destination', '123 Customer St, Clientville');
    }

    router.push(`/logistics?${params.toString()}`);
  };

  const handleEditForecast = () => {
    setResult(null);
  };
  
  const forecastedDemand = result ? result.forecastedDemand.reduce((a, b) => a + b, 0) : 0;
  
  const getStockLevel = () => {
    if (isCustomer) {
        return parseInt(searchParams.get('currentStock') || '0');
    }
    return adminInventory[form.getValues('productName')] || 0;
  }

  const currentStock = getStockLevel();
  const stockDifference = forecastedDemand - currentStock;
  const needsReorder = result && stockDifference > 0;

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
                   <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!!result}>
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
                   <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)} disabled={!!result}>
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
                   <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)} disabled={!!result}>
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
          
          {!result && (
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Forecast
            </Button>
          )}
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
            <Card className={needsReorder ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" : "border-green-500 bg-green-50 dark:bg-green-900/20"}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className={needsReorder ? "text-amber-600" : "text-green-600"} />
                        Replenishment Recommendation
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {needsReorder ? (
                        <div>
                            <p>
                                Based on the forecast, you have a potential shortfall of <strong>{stockDifference.toLocaleString()} units</strong> for <strong>{form.getValues('productName')}</strong>.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Forecasted Demand: {forecastedDemand.toLocaleString()} | Current Stock: {currentStock.toLocaleString()}
                            </p>
                        </div>
                    ) : (
                        <div>
                             <p>
                                Your current inventory for <strong>{form.getValues('productName')}</strong> is sufficient to meet the forecasted demand.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Forecasted Demand: {forecastedDemand.toLocaleString()} | Current Stock: {currentStock.toLocaleString()} | Surplus: {(-stockDifference).toLocaleString()}
                            </p>
                        </div>
                    )}
                    <div className="flex gap-4">
                        {needsReorder && (
                            <Button onClick={() => handlePlaceOrder(form.getValues('productName'), stockDifference)}>
                                <PackagePlus />
                                Place Order for {stockDifference.toLocaleString()} units
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleEditForecast}>
                            <Pencil />
                            Edit Forecast
                        </Button>
                    </div>
                </CardContent>
            </Card>
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
                        <p className="text-3xl font-bold">{forecastedDemand.toLocaleString()}</p>
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
