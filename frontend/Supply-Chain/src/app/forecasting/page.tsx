'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp, TrendingDown, BarChart3, Target, AlertTriangle,
  CheckCircle2, Package, RefreshCw, ArrowUpRight, ArrowDownRight, Zap,
  ShoppingCart, Truck, LineChart, Loader2, ArrowRight
} from 'lucide-react';
import { 
  pendingOrdersApi, 
  storePendingOrderInSession,
  notificationsApi 
} from '@/lib/services/supplychain-api';

interface DemandForecast {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  historicalAvgDaily: number;
  forecastedDemand: { next7Days: number; next30Days: number; next90Days: number };
  demandRange: { min: number; max: number };
  confidenceScore: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  seasonalFactor: number;
  reorderRecommendation: {
    shouldReorder: boolean;
    recommendedQuantity: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    estimatedStockoutDate?: Date;
  };
  factors: string[];
  unitPrice: number;
}

interface MarketTrend {
  category: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  insight: string;
}

const categories = ['Electronics', 'Clothing', 'Food & Beverages', 'Healthcare', 'Automotive'];

const generateForecasts = (): DemandForecast[] => {
  const products = [
    { id: 'prod-1', name: 'iPhone 15 Pro', category: 'Electronics', unitPrice: 129900 },
    { id: 'prod-2', name: 'Samsung Galaxy S24', category: 'Electronics', unitPrice: 79999 },
    { id: 'prod-3', name: 'Sony WH-1000XM5', category: 'Electronics', unitPrice: 29990 },
    { id: 'prod-4', name: 'Nike Air Max', category: 'Clothing', unitPrice: 12995 },
    { id: 'prod-5', name: 'Levis 501 Jeans', category: 'Clothing', unitPrice: 4999 },
    { id: 'prod-6', name: 'Organic Honey', category: 'Food & Beverages', unitPrice: 599 },
    { id: 'prod-7', name: 'Whey Protein Powder', category: 'Healthcare', unitPrice: 2499 },
    { id: 'prod-8', name: 'Multivitamin Tablets', category: 'Healthcare', unitPrice: 799 },
    { id: 'prod-9', name: 'Car Engine Oil', category: 'Automotive', unitPrice: 1299 },
    { id: 'prod-10', name: 'Brake Pads Set', category: 'Automotive', unitPrice: 2999 },
  ];

  return products.map(product => {
    const historicalAvgDaily = Math.floor(50 + Math.random() * 200);
    const trend = Math.random() > 0.6 ? 'increasing' : Math.random() > 0.3 ? 'stable' : 'decreasing';
    const trendMultiplier = trend === 'increasing' ? 1.15 : trend === 'decreasing' ? 0.85 : 1;
    const confidenceScore = Math.floor(60 + Math.random() * 35);
    const currentStock = Math.floor(500 + Math.random() * 2000);
    const next30Days = Math.floor(historicalAvgDaily * 30 * trendMultiplier);
    
    const daysOfStock = currentStock / historicalAvgDaily;
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (daysOfStock < 7) urgency = 'critical';
    else if (daysOfStock < 14) urgency = 'high';
    else if (daysOfStock < 30) urgency = 'medium';

    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      currentStock,
      historicalAvgDaily,
      forecastedDemand: {
        next7Days: Math.floor(historicalAvgDaily * 7 * trendMultiplier),
        next30Days,
        next90Days: Math.floor(historicalAvgDaily * 90 * trendMultiplier),
      },
      demandRange: { min: Math.floor(next30Days * 0.8), max: Math.floor(next30Days * 1.2) },
      confidenceScore,
      trend,
      seasonalFactor: 0.8 + Math.random() * 0.4,
      reorderRecommendation: {
        shouldReorder: daysOfStock < 30,
        recommendedQuantity: Math.max(0, Math.floor(next30Days * 1.5 - currentStock)),
        urgency,
        estimatedStockoutDate: daysOfStock < 30 ? new Date(Date.now() + daysOfStock * 24 * 60 * 60 * 1000) : undefined,
      },
      factors: [
        trend === 'increasing' ? '📈 Growing demand' : trend === 'decreasing' ? '📉 Declining' : '➡️ Stable',
        Math.random() > 0.5 ? '🎯 Competitor pricing' : '⚡ New product launch',
        Math.random() > 0.5 ? '📅 Seasonal' : '🌐 Regional growth',
      ],
      unitPrice: product.unitPrice,
    };
  });
};

const generateMarketTrends = (): MarketTrend[] => {
  return categories.map(category => ({
    category,
    trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
    changePercent: Math.random() * 30 - 10,
    insight: ['Strong demand', 'Price competition', 'New entrants', 'Seasonal factors', 'Supply disruptions'][Math.floor(Math.random() * 5)],
  }));
};

const formatCurrency = (value: number): string => {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
  if (value >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
  return `₹${value.toLocaleString()}`;
};

const formatQuantity = (qty: number): string => {
  if (qty >= 1e6) return `${(qty / 1e6).toFixed(1)}M`;
  if (qty >= 1e3) return `${(qty / 1e3).toFixed(1)}K`;
  return qty.toLocaleString();
};

const ConfidenceMeter = ({ score }: { score: number }) => {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>Confidence</span>
        <span className="font-medium">{score}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
};

const TrendIndicator = ({ trend, value }: { trend: string; value?: number }) => {
  const isUp = trend === 'up' || trend === 'increasing';
  const isDown = trend === 'down' || trend === 'decreasing';
  return (
    <div className={`flex items-center gap-1 ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-500'}`}>
      {isUp ? <ArrowUpRight className="h-4 w-4" /> : isDown ? <ArrowDownRight className="h-4 w-4" /> : <span>→</span>}
      {value !== undefined && <span className="text-sm font-medium">{Math.abs(value).toFixed(1)}%</span>}
    </div>
  );
};

const UrgencyBadge = ({ urgency }: { urgency: string }) => {
  const config: Record<string, { label: string; className: string }> = {
    low: { label: 'Low', className: 'bg-gray-100 text-gray-800' },
    medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'High', className: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Critical', className: 'bg-red-100 text-red-800' },
  };
  const { label, className } = config[urgency] || config.low;
  return <Badge className={className}>{label}</Badge>;
};

export default function DemandForecasting() {
  const router = useRouter();
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');
  const [isLoading, setIsLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<DemandForecast | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(0);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setForecasts(generateForecasts());
      setMarketTrends(generateMarketTrends());
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredForecasts = useMemo(() => {
    if (selectedCategory === 'all') return forecasts;
    return forecasts.filter(f => f.category === selectedCategory);
  }, [forecasts, selectedCategory]);

  const summaryStats = useMemo(() => {
    const needsReorder = forecasts.filter(f => f.reorderRecommendation.shouldReorder).length;
    const critical = forecasts.filter(f => f.reorderRecommendation.urgency === 'critical').length;
    const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidenceScore, 0) / (forecasts.length || 1);
    const totalForecastedDemand = forecasts.reduce((sum, f) => sum + f.forecastedDemand.next30Days, 0);
    return { needsReorder, critical, avgConfidence, totalForecastedDemand };
  }, [forecasts]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setForecasts(generateForecasts());
      setMarketTrends(generateMarketTrends());
      setIsLoading(false);
    }, 500);
  };

  const handleOpenOrderModal = (forecast: DemandForecast) => {
    setSelectedForecast(forecast);
    setOrderQuantity(forecast.reorderRecommendation.recommendedQuantity);
    setOrderSuccess(false);
    setShowOrderModal(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedForecast || orderQuantity <= 0) return;
    setIsCreatingOrder(true);
    
    try {
      const totalAmount = orderQuantity * selectedForecast.unitPrice;
      
      const result = await pendingOrdersApi.create({
        productId: selectedForecast.productId,
        productName: selectedForecast.productName,
        quantity: orderQuantity,
        unitPrice: selectedForecast.unitPrice,
        total: totalAmount,
        recommendation: `Reorder - ${selectedForecast.reorderRecommendation.urgency} urgency`,
        source: 'demand_forecasting',
      });

      if (result.success) {
        storePendingOrderInSession({
          productId: selectedForecast.productId,
          productName: selectedForecast.productName,
          quantity: orderQuantity,
          unitPrice: selectedForecast.unitPrice,
          total: totalAmount,
          recommendation: `From Forecast - ${selectedForecast.reorderRecommendation.urgency}`,
        });

        await notificationsApi.create({
          type: 'order',
          title: 'Order Created from Forecast',
          message: `Order for ${orderQuantity} units of ${selectedForecast.productName} ready for route optimization.`,
        });

        setOrderSuccess(true);
        setTimeout(() => {
          setShowOrderModal(false);
          router.push('/logistics-optimization');
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LineChart className="h-6 w-6" />
            Demand Forecasting
          </h1>
          <p className="text-sm text-muted-foreground">Create orders to send to Logistics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2"><Target className="h-5 w-5 text-blue-500" /><span className="text-sm text-muted-foreground">Forecast</span></div>
          <p className="text-2xl font-bold mt-2">{formatQuantity(summaryStats.totalForecastedDemand)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-green-500" /><span className="text-sm text-muted-foreground">Confidence</span></div>
          <p className="text-2xl font-bold mt-2">{summaryStats.avgConfidence.toFixed(0)}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2"><Package className="h-5 w-5 text-orange-500" /><span className="text-sm text-muted-foreground">Reorder</span></div>
          <p className="text-2xl font-bold mt-2">{summaryStats.needsReorder}</p>
        </CardContent></Card>
        <Card className={summaryStats.critical > 0 ? 'border-red-300 bg-red-50' : ''}><CardContent className="pt-4">
          <div className="flex items-center gap-2"><AlertTriangle className={`h-5 w-5 ${summaryStats.critical > 0 ? 'text-red-500' : 'text-gray-400'}`} /><span className="text-sm text-muted-foreground">Critical</span></div>
          <p className={`text-2xl font-bold mt-2 ${summaryStats.critical > 0 ? 'text-red-600' : ''}`}>{summaryStats.critical}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="forecasts">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="forecasts"><BarChart3 className="h-4 w-4 mr-2" />Forecasts</TabsTrigger>
          <TabsTrigger value="trends"><TrendingUp className="h-4 w-4 mr-2" />Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div><CardTitle>Product Forecasts</CardTitle><CardDescription>Click Create Order to send to Logistics</CardDescription></div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {filteredForecasts.map(forecast => (
                    <Card key={forecast.productId} className="hover:shadow-md">
                      <CardContent className="pt-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold">{forecast.productName}</h3>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline">{forecast.category}</Badge>
                                  <span className="text-sm text-muted-foreground">₹{forecast.unitPrice.toLocaleString()}/unit</span>
                                </div>
                              </div>
                              <TrendIndicator trend={forecast.trend} />
                            </div>
                            <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                              <div><p className="text-xs text-muted-foreground">Stock</p><p className="font-semibold">{formatQuantity(forecast.currentStock)}</p></div>
                              <div><p className="text-xs text-muted-foreground">Daily Avg</p><p className="font-semibold">{forecast.historicalAvgDaily}</p></div>
                              <div><p className="text-xs text-muted-foreground">Forecast</p><p className="font-semibold">{formatQuantity(selectedTimeframe === '7' ? forecast.forecastedDemand.next7Days : selectedTimeframe === '90' ? forecast.forecastedDemand.next90Days : forecast.forecastedDemand.next30Days)}</p></div>
                              <div><p className="text-xs text-muted-foreground">Range</p><p className="font-semibold text-sm">{formatQuantity(forecast.demandRange.min)}-{formatQuantity(forecast.demandRange.max)}</p></div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">{forecast.factors.map((f, i) => <span key={i} className="text-xs bg-muted px-2 py-1 rounded">{f}</span>)}</div>
                          </div>
                          <div className="w-full lg:w-64 space-y-4">
                            <ConfidenceMeter score={forecast.confidenceScore} />
                            {forecast.reorderRecommendation.shouldReorder && (
                              <Card className={forecast.reorderRecommendation.urgency === 'critical' ? 'bg-red-50 border-red-200' : forecast.reorderRecommendation.urgency === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'}>
                                <CardContent className="pt-3 space-y-2">
                                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Reorder</span><UrgencyBadge urgency={forecast.reorderRecommendation.urgency} /></div>
                                  <div className="text-sm">
                                    <p>Qty: <strong>{formatQuantity(forecast.reorderRecommendation.recommendedQuantity)}</strong></p>
                                    <p className="text-xs text-muted-foreground">Value: {formatCurrency(forecast.reorderRecommendation.recommendedQuantity * forecast.unitPrice)}</p>
                                    {forecast.reorderRecommendation.estimatedStockoutDate && <p className="text-red-600 text-xs mt-1">⚠️ Stockout: {forecast.reorderRecommendation.estimatedStockoutDate.toLocaleDateString()}</p>}
                                  </div>
                                  <Button size="sm" className="w-full" onClick={() => handleOpenOrderModal(forecast)}><ShoppingCart className="h-4 w-4 mr-2" />Create Order</Button>
                                </CardContent>
                              </Card>
                            )}
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

        <TabsContent value="trends">
          <Card>
            <CardHeader><CardTitle>Market Trends</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {marketTrends.map(trend => (
                  <Card key={trend.category}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between"><h3 className="font-semibold">{trend.category}</h3><TrendIndicator trend={trend.trend} value={trend.changePercent} /></div>
                      <p className="text-sm text-muted-foreground mt-2">{trend.insight}</p>
                      <Progress value={50 + trend.changePercent} className="h-2 mt-4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent>
          <DialogHeader><DialogTitle><ShoppingCart className="h-5 w-5 inline mr-2" />Create Reorder</DialogTitle><DialogDescription>Send to Logistics for optimization</DialogDescription></DialogHeader>
          {selectedForecast && (
            <div className="space-y-4">
              {orderSuccess ? (
                <div className="text-center py-6"><CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" /><h3 className="text-lg font-semibold text-green-700">Order Created!</h3><p className="text-muted-foreground">Redirecting to Logistics...</p></div>
              ) : (
                <>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold">{selectedForecast.productName}</h4>
                    <p className="text-sm text-muted-foreground">{selectedForecast.category}</p>
                    <div className="flex justify-between mt-2 text-sm"><span>Unit Price:</span><span className="font-medium">₹{selectedForecast.unitPrice.toLocaleString()}</span></div>
                  </div>
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={orderQuantity} onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 0))} min={1} /><p className="text-xs text-muted-foreground">Recommended: {selectedForecast.reorderRecommendation.recommendedQuantity.toLocaleString()}</p></div>
                  <div className="p-4 bg-blue-50 rounded-lg"><div className="flex justify-between"><span className="text-sm">Total:</span><span className="text-xl font-bold text-blue-700">₹{(orderQuantity * selectedForecast.unitPrice).toLocaleString()}</span></div></div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowOrderModal(false)} disabled={isCreatingOrder}>Cancel</Button>
                    <Button className="flex-1" onClick={handleCreateOrder} disabled={isCreatingOrder || orderQuantity <= 0}>{isCreatingOrder ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : <><Truck className="h-4 w-4 mr-2" />Send to Logistics</>}</Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground"><ArrowRight className="h-3 w-3 inline mr-1" />Order appears in Route Optimization</p>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
