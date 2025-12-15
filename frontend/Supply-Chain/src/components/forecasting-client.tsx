"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertTriangle, PackagePlus, Pencil, TrendingUp, TrendingDown, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getDemandForecast, type ForecastResult } from "@/app/forecasting/actions";
import { useToast } from "@/hooks/use-toast";
import DemandForecastChart from "./demand-forecast-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { inventoryApi, type Product } from "@/lib/api";
import { Badge } from "./ui/badge";

const formSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, "Product name is required."),
  historicalDataRange: z.coerce.number().int().positive("Please select a historical data range."),
  forecastHorizon: z.coerce.number().int().min(1, "Please select a forecast horizon."),
});

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
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentStock, setCurrentStock] = useState<number>(0);
  
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      productName: "",
      historicalDataRange: 12,
      forecastHorizon: 6,
    },
  });

  const isCustomer = searchParams.get('source') === 'customer';

  // Fetch products from API
  useEffect(() => {
    async function fetchProducts() {
      try {
        const fetchedProducts = await inventoryApi.getAll();
        setProducts(fetchedProducts);
        
        // Set default product if available
        if (fetchedProducts.length > 0 && !form.getValues('productName')) {
          const defaultProduct = fetchedProducts[0];
          form.setValue('productId', defaultProduct.id);
          form.setValue('productName', defaultProduct.name);
          setCurrentStock(defaultProduct.quantityInStock);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        // Keep empty array, user can still type product name manually
      } finally {
        setLoadingProducts(false);
      }
    }
    
    fetchProducts();
  }, [form]);

  // Handle URL params (coming from customer inventory page)
  useEffect(() => {
    const productNameFromQuery = searchParams.get('productName');
    const productIdFromQuery = searchParams.get('productId');
    const stockFromQuery = searchParams.get('currentStock');
    
    if (productNameFromQuery) {
      form.setValue('productName', productNameFromQuery);
    }
    if (productIdFromQuery) {
      form.setValue('productId', productIdFromQuery);
    }
    if (stockFromQuery) {
      setCurrentStock(parseInt(stockFromQuery) || 0);
    }
  }, [searchParams, form]);

  // Update stock when product selection changes
  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue('productId', product.id);
      form.setValue('productName', product.name);
      setCurrentStock(product.quantityInStock);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    
    const response = await getDemandForecast(values);
    setIsLoading(false);

    if (response.success && response.data) {
      setResult(response.data);
      toast({ 
        title: "Forecast Generated", 
        description: `Successfully forecasted demand for ${values.productName}.` 
      });
    } else {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: response.error || "Failed to generate forecast." 
      });
    }
  }

  const handlePlaceOrder = (productName: string, quantity: number) => {
    const params = new URLSearchParams({
      productName: productName,
      quantity: String(quantity),
    });

    if (isCustomer) {
      params.append('destination', '123 Customer St, Clientville');
    }

    router.push(`/logistics?${params.toString()}`);
  };

  const handleEditForecast = () => {
    setResult(null);
  };

  // Calculate metrics
  const forecastedDemand = result ? result.forecastedDemand.reduce((a, b) => a + b, 0) : 0;
  const stockDifference = forecastedDemand - currentStock;
  const needsReorder = result && stockDifference > 0;
  
  const TrendIcon = result?.trend === 'increasing' ? TrendingUp : 
                    result?.trend === 'decreasing' ? TrendingDown : Minus;
  const trendColor = result?.trend === 'increasing' ? 'text-green-600' : 
                     result?.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600';

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Product Selection */}
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  {products.length > 0 ? (
                    <Select 
                      onValueChange={handleProductChange} 
                      value={field.value}
                      disabled={!!result}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.quantityInStock} in stock)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input 
                        placeholder="Enter product name"
                        {...form.register('productName')}
                        disabled={!!result}
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Historical Range */}
            <FormField
              control={form.control}
              name="historicalDataRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Historical Data</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={String(field.value)}
                    disabled={!!result}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {historicalRanges.map(range => (
                        <SelectItem key={range.value} value={String(range.value)}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Forecast Horizon */}
            <FormField
              control={form.control}
              name="forecastHorizon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forecast Horizon</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={String(field.value)}
                    disabled={!!result}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a horizon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {forecastHorizons.map(horizon => (
                        <SelectItem key={horizon.value} value={String(horizon.value)}>
                          {horizon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Current Stock Display */}
            <div className="flex flex-col justify-end">
              <p className="text-sm text-muted-foreground mb-2">Current Stock</p>
              <p className="text-2xl font-bold">{currentStock.toLocaleString()} units</p>
            </div>
          </div>

          {!result && (
            <Button type="submit" disabled={isLoading || !form.getValues('productName')}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Forecast
            </Button>
          )}
        </form>
      </Form>

      {isLoading && (
        <div className="text-center py-8">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Analyzing historical data and generating forecast...</p>
        </div>
      )}

      {result && (
        <div className="space-y-6 pt-6">
          {/* Recommendation Card */}
          <Card className={needsReorder 
            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" 
            : "border-green-500 bg-green-50 dark:bg-green-900/20"
          }>
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
                    Based on the forecast, you have a potential shortfall of{' '}
                    <strong>{stockDifference.toLocaleString()} units</strong> for{' '}
                    <strong>{form.getValues('productName')}</strong>.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Forecasted Demand: {forecastedDemand.toLocaleString()} | 
                    Current Stock: {currentStock.toLocaleString()}
                  </p>
                </div>
              ) : (
                <div>
                  <p>
                    Your current inventory for <strong>{form.getValues('productName')}</strong> is 
                    sufficient to meet the forecasted demand.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Forecasted Demand: {forecastedDemand.toLocaleString()} | 
                    Current Stock: {currentStock.toLocaleString()} | 
                    Surplus: {(-stockDifference).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="flex gap-4">
                {needsReorder && (
                  <Button onClick={() => handlePlaceOrder(form.getValues('productName'), stockDifference)}>
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Place Order for {stockDifference.toLocaleString()} units
                  </Button>
                )}
                <Button variant="outline" onClick={handleEditForecast}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Forecast
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Cards */}
          <h3 className="text-lg font-semibold">Forecast Results</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Model Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{result.modelAccuracy.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Mean Absolute Percentage Error</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total Forecasted Demand</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{forecastedDemand.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  Over {form.getValues('forecastHorizon')} months
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendIcon className={`h-8 w-8 ${trendColor}`} />
                  <div>
                    <p className="text-xl font-bold capitalize">{result.trend || 'Stable'}</p>
                    {result.seasonality && (
                      <Badge variant="outline" className="mt-1">Seasonal Pattern Detected</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          {result.insights && result.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Insights</CardTitle>
                <CardDescription>AI-generated analysis of the forecast</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecast Chart</CardTitle>
              <CardDescription>Predicted demand with confidence intervals</CardDescription>
            </CardHeader>
            <CardContent>
              <DemandForecastChart forecastData={{
                forecastedDemand: result.forecastedDemand,
                modelAccuracy: result.modelAccuracy,
                confidenceIntervals: result.confidenceIntervals,
              }} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}