'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp, TrendingDown, BarChart3, Package, RefreshCw, 
  ArrowUpRight, ArrowDownRight, ShoppingCart, Truck, Minus,
  AlertTriangle, CheckCircle, Loader2, ArrowRight
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ProductForecast {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  stockStatus: 'Low' | 'Adequate' | 'Critical';
  predictedDemand: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  recommendedOrder: number | null;
}

// ============================================================================
// DEMO DATA
// ============================================================================

const generateForecasts = (): ProductForecast[] => {
  return [
    {
      id: '1',
      name: 'Premium Widget A',
      sku: 'PWA-001',
      currentStock: 450,
      stockStatus: 'Low',
      predictedDemand: 680,
      trend: 'up',
      confidence: 92,
      recommendedOrder: 300,
    },
    {
      id: '2',
      name: 'Standard Component B',
      sku: 'SCB-002',
      currentStock: 1200,
      stockStatus: 'Adequate',
      predictedDemand: 980,
      trend: 'down',
      confidence: 88,
      recommendedOrder: null,
    },
    {
      id: '3',
      name: 'Industrial Part C',
      sku: 'IPC-003',
      currentStock: 320,
      stockStatus: 'Low',
      predictedDemand: 550,
      trend: 'up',
      confidence: 85,
      recommendedOrder: 280,
    },
    {
      id: '4',
      name: 'Electronic Module D',
      sku: 'EMD-004',
      currentStock: 180,
      stockStatus: 'Critical',
      predictedDemand: 420,
      trend: 'up',
      confidence: 90,
      recommendedOrder: 300,
    },
    {
      id: '5',
      name: 'Packaging Supply E',
      sku: 'PSE-005',
      currentStock: 2500,
      stockStatus: 'Adequate',
      predictedDemand: 2200,
      trend: 'stable',
      confidence: 95,
      recommendedOrder: null,
    },
    {
      id: '6',
      name: 'Raw Material F',
      sku: 'RMF-006',
      currentStock: 800,
      stockStatus: 'Low',
      predictedDemand: 1100,
      trend: 'up',
      confidence: 87,
      recommendedOrder: 400,
    },
  ];
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// ============================================================================
// SUB COMPONENTS
// ============================================================================

const TrendIndicator = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') {
    return <ArrowUpRight className="h-4 w-4 text-green-600" />;
  }
  if (trend === 'down') {
    return <ArrowDownRight className="h-4 w-4 text-red-600" />;
  }
  return <Minus className="h-4 w-4 text-gray-500" />;
};

const StockStatusBadge = ({ status }: { status: 'Low' | 'Adequate' | 'Critical' }) => {
  const config = {
    Low: { className: 'bg-yellow-100 text-yellow-800', label: 'Low' },
    Adequate: { className: 'bg-green-100 text-green-800', label: 'Adequate' },
    Critical: { className: 'bg-red-100 text-red-800', label: 'Critical' },
  };
  const { className, label } = config[status];
  return <Badge className={className}>{label}</Badge>;
};

const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
  const color = confidence >= 90 ? 'text-green-600' : confidence >= 80 ? 'text-yellow-600' : 'text-red-600';
  return <span className={`text-sm font-medium ${color}`}>{confidence}%</span>;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DemandForecasting() {
  const router = useRouter();
  const [forecasts, setForecasts] = useState<ProductForecast[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductForecast | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState<number>(0);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setForecasts(generateForecasts());
      setIsLoading(false);
    }, 800);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setForecasts(generateForecasts());
      setIsLoading(false);
    }, 500);
  };

  const handleProductSelect = (product: ProductForecast) => {
    if (product.recommendedOrder !== null) {
      setSelectedProduct(product);
      setOrderQuantity(product.recommendedOrder);
      setShowOrderDialog(true);
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedProduct) return;
    
    setIsCreatingOrder(true);
    
    // Create order data for logistics page
    const orderData = {
      id: `ORD-${Date.now()}`,
      product: selectedProduct.name,
      sku: selectedProduct.sku,
      quantity: selectedProduct.currentStock,
      recommendedOrder: orderQuantity,
      confidence: selectedProduct.confidence,
      createdAt: new Date().toISOString(),
    };
    
    // Store in sessionStorage for the logistics page
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    // Simulate a small delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsCreatingOrder(false);
    setShowOrderDialog(false);
    
    // Navigate to logistics optimization page
    router.push('/logistics-optimization');
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalDemand = forecasts.reduce((sum, f) => sum + f.predictedDemand, 0);
    const totalStock = forecasts.reduce((sum, f) => sum + f.currentStock, 0);
    const totalRecommended = forecasts
      .filter(f => f.recommendedOrder !== null)
      .reduce((sum, f) => sum + (f.recommendedOrder || 0), 0);
    const avgConfidence = forecasts.length > 0
      ? Math.round(forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length)
      : 0;
    
    return { totalDemand, totalStock, totalRecommended, avgConfidence };
  }, [forecasts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading demand forecasts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Demand Forecasting
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered demand predictions and inventory recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Next 7 Days</SelectItem>
              <SelectItem value="30">Next 30 Days</SelectItem>
              <SelectItem value="90">Next 90 Days</SelectItem>
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
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Predicted Demand</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(summaryStats.totalDemand)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Current Stock</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(summaryStats.totalStock)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">Recommended Orders</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(summaryStats.totalRecommended)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Avg Confidence</span>
            </div>
            <p className="text-2xl font-bold">{summaryStats.avgConfidence}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Product Forecasts Table and Create Order Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Forecasts Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Forecasts</CardTitle>
            <CardDescription>Click a product to create an order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-sm text-muted-foreground">PRODUCT</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">STOCK</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">DEMAND</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">TREND</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">CONFIDENCE</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">RECOMMENDED</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map((product) => (
                    <tr 
                      key={product.id} 
                      className={`border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                        selectedProduct?.id === product.id ? 'bg-muted/70' : ''
                      } ${product.recommendedOrder !== null ? 'hover:bg-blue-50' : ''}`}
                      onClick={() => handleProductSelect(product)}
                    >
                      <td className="py-4">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatNumber(product.currentStock)}</span>
                          <StockStatusBadge status={product.stockStatus} />
                        </div>
                      </td>
                      <td className="py-4 font-medium">{formatNumber(product.predictedDemand)}</td>
                      <td className="py-4">
                        <TrendIndicator trend={product.trend} />
                      </td>
                      <td className="py-4">
                        <ConfidenceBadge confidence={product.confidence} />
                      </td>
                      <td className="py-4">
                        {product.recommendedOrder !== null ? (
                          <span className="text-green-600 font-medium">+{formatNumber(product.recommendedOrder)}</span>
                        ) : (
                          <span className="text-muted-foreground">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Create Order Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Create Order</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProduct ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProduct.sku}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Stock:</span>
                    <span className="font-medium">{formatNumber(selectedProduct.currentStock)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Predicted Demand:</span>
                    <span className="font-medium">{formatNumber(selectedProduct.predictedDemand)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confidence:</span>
                    <ConfidenceBadge confidence={selectedProduct.confidence} />
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Recommended Order:</span>
                    <span className="font-bold text-green-600">+{formatNumber(selectedProduct.recommendedOrder || 0)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => setShowOrderDialog(true)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  Select a product from the table to create an order
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Creation Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Order</DialogTitle>
            <DialogDescription>
              Review the order details and proceed to logistics for route optimization.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium">{selectedProduct.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedProduct.sku}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="quantity">Order Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                    min={1}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: {selectedProduct.recommendedOrder} units
                  </p>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm">
                  <Truck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-700">
                    You'll be redirected to Logistics to optimize the delivery route before confirming the order.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrder} disabled={isCreatingOrder || orderQuantity <= 0}>
              {isCreatingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Logistics
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}