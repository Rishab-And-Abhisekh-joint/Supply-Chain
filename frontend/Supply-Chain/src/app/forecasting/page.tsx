'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp, TrendingDown, BarChart3, Target, AlertTriangle,
  CheckCircle2, Clock, Package, DollarSign, Users, Building2,
  RefreshCw, ArrowUpRight, ArrowDownRight, Zap, Eye, Calendar,
  ShoppingCart, Truck, Percent, Info, ChevronRight, LineChart
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface HistoricalSale {
  date: Date;
  productId: string;
  quantity: number;
  revenue: number;
  region: string;
}

interface CompetitorInsight {
  competitorId: string;
  competitorName: string;
  productCategory: string;
  avgPrice: number;
  priceChange: number;
  estimatedSales: number;
  marketShare: number;
  lastUpdated: Date;
}

interface DemandForecast {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  historicalAvgDaily: number;
  forecastedDemand: {
    next7Days: number;
    next30Days: number;
    next90Days: number;
  };
  demandRange: {
    min: number;
    max: number;
  };
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
}

interface MarketTrend {
  category: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  insight: string;
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const categories = ['Electronics', 'Clothing', 'Food & Beverages', 'Healthcare', 'Automotive'];
const competitors = [
  { id: 'comp-1', name: 'Amazon India' },
  { id: 'comp-2', name: 'Flipkart' },
  { id: 'comp-3', name: 'Reliance Retail' },
  { id: 'comp-4', name: 'DMart' },
  { id: 'comp-5', name: 'BigBasket' },
];

const generateHistoricalSales = (): HistoricalSale[] => {
  const sales: HistoricalSale[] = [];
  const now = new Date();
  
  for (let i = 0; i < 90; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const baseQuantity = 100 + Math.sin(i / 7) * 30; // Weekly seasonality
    
    sales.push({
      date,
      productId: `prod-${(i % 10) + 1}`,
      quantity: Math.floor(baseQuantity + Math.random() * 50),
      revenue: Math.floor((baseQuantity + Math.random() * 50) * (500 + Math.random() * 1000)),
      region: ['North', 'South', 'East', 'West'][i % 4],
    });
  }
  
  return sales;
};

const generateCompetitorInsights = (): CompetitorInsight[] => {
  return competitors.flatMap(comp => 
    categories.map(cat => ({
      competitorId: comp.id,
      competitorName: comp.name,
      productCategory: cat,
      avgPrice: Math.floor(500 + Math.random() * 5000),
      priceChange: Math.random() * 20 - 10,
      estimatedSales: Math.floor(10000 + Math.random() * 100000),
      marketShare: Math.random() * 30,
      lastUpdated: new Date(Date.now() - Math.random() * 86400000),
    }))
  );
};

const generateForecasts = (): DemandForecast[] => {
  const products = [
    { id: 'prod-1', name: 'iPhone 15 Pro', category: 'Electronics' },
    { id: 'prod-2', name: 'Samsung Galaxy S24', category: 'Electronics' },
    { id: 'prod-3', name: 'Sony WH-1000XM5', category: 'Electronics' },
    { id: 'prod-4', name: 'Nike Air Max', category: 'Clothing' },
    { id: 'prod-5', name: 'Levi\'s 501 Jeans', category: 'Clothing' },
    { id: 'prod-6', name: 'Organic Honey', category: 'Food & Beverages' },
    { id: 'prod-7', name: 'Whey Protein Powder', category: 'Healthcare' },
    { id: 'prod-8', name: 'Multivitamin Tablets', category: 'Healthcare' },
    { id: 'prod-9', name: 'Car Engine Oil', category: 'Automotive' },
    { id: 'prod-10', name: 'Brake Pads Set', category: 'Automotive' },
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
      demandRange: {
        min: Math.floor(next30Days * 0.8),
        max: Math.floor(next30Days * 1.2),
      },
      confidenceScore,
      trend,
      seasonalFactor: 0.8 + Math.random() * 0.4,
      reorderRecommendation: {
        shouldReorder: daysOfStock < 30,
        recommendedQuantity: Math.max(0, Math.floor(next30Days * 1.5 - currentStock)),
        urgency,
        estimatedStockoutDate: daysOfStock < 30 
          ? new Date(Date.now() + daysOfStock * 24 * 60 * 60 * 1000) 
          : undefined,
      },
      factors: [
        trend === 'increasing' ? '📈 Growing market demand' : trend === 'decreasing' ? '📉 Market contraction' : '➡️ Stable demand',
        Math.random() > 0.5 ? '🎯 Competitor price increase' : '⚡ New product launch nearby',
        Math.random() > 0.5 ? '📅 Seasonal demand expected' : '🌐 Regional growth trend',
      ],
    };
  });
};

const generateMarketTrends = (): MarketTrend[] => {
  return categories.map(category => ({
    category,
    trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
    changePercent: Math.random() * 30 - 10,
    insight: [
      'Strong consumer demand driving growth',
      'Price competition intensifying',
      'New market entrants increasing supply',
      'Seasonal factors affecting demand',
      'Supply chain disruptions impacting availability',
    ][Math.floor(Math.random() * 5)],
  }));
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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

// ============================================================================
// UI COMPONENTS
// ============================================================================

const ConfidenceMeter = ({ score }: { score: number }) => {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>Confidence</span>
        <span className="font-medium">{score}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
};

const TrendIndicator = ({ trend, value }: { trend: 'up' | 'down' | 'stable' | 'increasing' | 'decreasing'; value?: number }) => {
  const isUp = trend === 'up' || trend === 'increasing';
  const isDown = trend === 'down' || trend === 'decreasing';
  
  return (
    <div className={`flex items-center gap-1 ${
      isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-500'
    }`}>
      {isUp ? <ArrowUpRight className="h-4 w-4" /> : 
       isDown ? <ArrowDownRight className="h-4 w-4" /> : 
       <span className="text-sm">→</span>}
      {value !== undefined && <span className="text-sm font-medium">{Math.abs(value).toFixed(1)}%</span>}
    </div>
  );
};

const UrgencyBadge = ({ urgency }: { urgency: 'low' | 'medium' | 'high' | 'critical' }) => {
  const config = {
    low: { label: 'Low', className: 'bg-gray-100 text-gray-800' },
    medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'High', className: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Critical', className: 'bg-red-100 text-red-800' },
  };
  const { label, className } = config[urgency];
  return <Badge className={className}>{label}</Badge>;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DemandForecasting() {
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [competitorInsights, setCompetitorInsights] = useState<CompetitorInsight[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [historicalSales, setHistoricalSales] = useState<HistoricalSale[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setForecasts(generateForecasts());
      setCompetitorInsights(generateCompetitorInsights());
      setMarketTrends(generateMarketTrends());
      setHistoricalSales(generateHistoricalSales());
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
    const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidenceScore, 0) / forecasts.length;
    const totalForecastedDemand = forecasts.reduce((sum, f) => sum + f.forecastedDemand.next30Days, 0);
    
    return { needsReorder, critical, avgConfidence, totalForecastedDemand };
  }, [forecasts]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setForecasts(generateForecasts());
      setCompetitorInsights(generateCompetitorInsights());
      setMarketTrends(generateMarketTrends());
      setIsLoading(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Analyzing demand patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LineChart className="h-6 w-6" />
            Demand Forecasting
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered demand predictions with competitor insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Forecasted Demand</span>
            </div>
            <p className="text-2xl font-bold mt-2">{formatQuantity(summaryStats.totalForecastedDemand)}</p>
            <p className="text-xs text-muted-foreground">Next {selectedTimeframe} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Avg Confidence</span>
            </div>
            <p className="text-2xl font-bold mt-2">{summaryStats.avgConfidence.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Forecast accuracy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">Needs Reorder</span>
            </div>
            <p className="text-2xl font-bold mt-2">{summaryStats.needsReorder}</p>
            <p className="text-xs text-muted-foreground">Products below threshold</p>
          </CardContent>
        </Card>
        <Card className={summaryStats.critical > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${summaryStats.critical > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              <span className="text-sm text-muted-foreground">Critical</span>
            </div>
            <p className={`text-2xl font-bold mt-2 ${summaryStats.critical > 0 ? 'text-red-600' : ''}`}>
              {summaryStats.critical}
            </p>
            <p className="text-xs text-muted-foreground">Stockout risk</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forecasts">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="forecasts" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Forecasts
          </TabsTrigger>
          <TabsTrigger value="competitors" className="gap-2">
            <Users className="h-4 w-4" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Market Trends
          </TabsTrigger>
        </TabsList>

        {/* Forecasts Tab */}
        <TabsContent value="forecasts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Product Demand Forecasts</CardTitle>
                  <CardDescription>AI-generated predictions with confidence scores</CardDescription>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {filteredForecasts.map(forecast => (
                    <Card key={forecast.productId} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                          {/* Product Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold">{forecast.productName}</h3>
                                <Badge variant="outline" className="mt-1">{forecast.category}</Badge>
                              </div>
                              <TrendIndicator trend={forecast.trend} />
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Current Stock</p>
                                <p className="font-semibold">{formatQuantity(forecast.currentStock)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Daily Avg</p>
                                <p className="font-semibold">{forecast.historicalAvgDaily}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Forecast ({selectedTimeframe}d)</p>
                                <p className="font-semibold">
                                  {formatQuantity(
                                    selectedTimeframe === '7' ? forecast.forecastedDemand.next7Days :
                                    selectedTimeframe === '90' ? forecast.forecastedDemand.next90Days :
                                    forecast.forecastedDemand.next30Days
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Demand Range</p>
                                <p className="font-semibold text-sm">
                                  {formatQuantity(forecast.demandRange.min)} - {formatQuantity(forecast.demandRange.max)}
                                </p>
                              </div>
                            </div>

                            {/* Factors */}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {forecast.factors.map((factor, idx) => (
                                <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                                  {factor}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Confidence & Recommendation */}
                          <div className="w-full lg:w-64 space-y-4">
                            <ConfidenceMeter score={forecast.confidenceScore} />
                            
                            {forecast.reorderRecommendation.shouldReorder && (
                              <Card className={`${
                                forecast.reorderRecommendation.urgency === 'critical' ? 'bg-red-50 border-red-200' :
                                forecast.reorderRecommendation.urgency === 'high' ? 'bg-orange-50 border-orange-200' :
                                'bg-yellow-50 border-yellow-200'
                              }`}>
                                <CardContent className="pt-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Reorder Alert</span>
                                    <UrgencyBadge urgency={forecast.reorderRecommendation.urgency} />
                                  </div>
                                  <div className="text-sm">
                                    <p>Recommended: <strong>{formatQuantity(forecast.reorderRecommendation.recommendedQuantity)} units</strong></p>
                                    {forecast.reorderRecommendation.estimatedStockoutDate && (
                                      <p className="text-red-600 text-xs mt-1">
                                        ⚠️ Stockout by: {forecast.reorderRecommendation.estimatedStockoutDate.toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                  <Button size="sm" className="w-full">
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Create Order
                                  </Button>
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

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Competitor Analysis
              </CardTitle>
              <CardDescription>
                Market intelligence and competitor pricing insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-6">
                  {competitors.map(competitor => {
                    const insights = competitorInsights.filter(i => i.competitorId === competitor.id);
                    const avgMarketShare = insights.reduce((sum, i) => sum + i.marketShare, 0) / insights.length;
                    
                    return (
                      <Card key={competitor.id}>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{competitor.name}</CardTitle>
                            <Badge variant="outline">
                              Avg Market Share: {avgMarketShare.toFixed(1)}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {insights.slice(0, 3).map((insight, idx) => (
                              <div key={idx} className="p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium">{insight.productCategory}</p>
                                <div className="mt-2 space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Avg Price:</span>
                                    <span className="flex items-center gap-1">
                                      {formatCurrency(insight.avgPrice)}
                                      <TrendIndicator trend={insight.priceChange >= 0 ? 'up' : 'down'} value={insight.priceChange} />
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Est. Sales:</span>
                                    <span>{formatQuantity(insight.estimatedSales)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Market Share:</span>
                                    <span>{insight.marketShare.toFixed(1)}%</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Trends by Category
              </CardTitle>
              <CardDescription>
                Industry-wide demand patterns and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketTrends.map(trend => (
                  <Card key={trend.category} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{trend.category}</h3>
                        <TrendIndicator trend={trend.trend} value={trend.changePercent} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {trend.insight}
                      </p>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Market Movement</span>
                          <span className={
                            trend.changePercent > 0 ? 'text-green-600' :
                            trend.changePercent < 0 ? 'text-red-600' : ''
                          }>
                            {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={50 + trend.changePercent} 
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Historical Analysis Summary */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Historical Sales Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {formatQuantity(historicalSales.reduce((sum, s) => sum + s.quantity, 0))}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Units Sold</p>
                      <p className="text-xs text-muted-foreground">(Last 90 days)</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {formatCurrency(historicalSales.reduce((sum, s) => sum + s.revenue, 0))}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-xs text-muted-foreground">(Last 90 days)</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {formatQuantity(Math.floor(historicalSales.reduce((sum, s) => sum + s.quantity, 0) / 90))}
                      </p>
                      <p className="text-sm text-muted-foreground">Daily Average</p>
                      <p className="text-xs text-muted-foreground">(Units)</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {new Set(historicalSales.map(s => s.region)).size}
                      </p>
                      <p className="text-sm text-muted-foreground">Active Regions</p>
                      <p className="text-xs text-muted-foreground">(With sales)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}