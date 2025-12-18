'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  BarChart3,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ShoppingCart,
  Loader2
} from 'lucide-react';

interface ForecastData {
  product: string;
  sku: string;
  currentStock: number;
  predictedDemand: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  recommendedOrder: number;
  leadTime: number;
}

interface PendingOrder {
  id: string;
  product: string;
  sku: string;
  quantity: number;
  predictedDemand: number;
  confidence: number;
  createdAt: string;
  status: 'pending_route';
}

const mockForecasts: ForecastData[] = [
  { product: 'Premium Widget A', sku: 'PWA-001', currentStock: 450, predictedDemand: 680, confidence: 92, trend: 'up', recommendedOrder: 300, leadTime: 5 },
  { product: 'Standard Component B', sku: 'SCB-002', currentStock: 1200, predictedDemand: 980, confidence: 88, trend: 'down', recommendedOrder: 0, leadTime: 3 },
  { product: 'Industrial Part C', sku: 'IPC-003', currentStock: 320, predictedDemand: 550, confidence: 85, trend: 'up', recommendedOrder: 280, leadTime: 7 },
  { product: 'Electronic Module D', sku: 'EMD-004', currentStock: 180, predictedDemand: 420, confidence: 90, trend: 'up', recommendedOrder: 300, leadTime: 4 },
  { product: 'Packaging Supply E', sku: 'PSE-005', currentStock: 2500, predictedDemand: 2200, confidence: 95, trend: 'stable', recommendedOrder: 0, leadTime: 2 },
  { product: 'Raw Material F', sku: 'RMF-006', currentStock: 800, predictedDemand: 1100, confidence: 87, trend: 'up', recommendedOrder: 400, leadTime: 6 },
];

export default function DemandForecasting() {
  const router = useRouter();
  const [forecasts, setForecasts] = useState<ForecastData[]>(mockForecasts);
  const [selectedForecast, setSelectedForecast] = useState<ForecastData | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setForecasts([...mockForecasts].map(f => ({
        ...f,
        predictedDemand: f.predictedDemand + Math.floor(Math.random() * 50 - 25),
        confidence: Math.min(99, Math.max(70, f.confidence + Math.floor(Math.random() * 6 - 3)))
      })));
      setIsRefreshing(false);
    }, 1000);
  };

  const handleCreateOrder = () => {
    if (!selectedForecast || selectedForecast.recommendedOrder === 0) return;

    setIsCreatingOrder(true);

    // Calculate order details based on forecast
    const orderQuantity = selectedForecast.recommendedOrder;
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Create pending order object
    const pendingOrder: PendingOrder = {
      id: orderId,
      product: selectedForecast.product,
      sku: selectedForecast.sku,
      quantity: orderQuantity,
      predictedDemand: selectedForecast.predictedDemand,
      confidence: selectedForecast.confidence,
      createdAt: new Date().toISOString(),
      status: 'pending_route'
    };

    // Store in sessionStorage for logistics optimization page
    sessionStorage.setItem('pendingOrder', JSON.stringify(pendingOrder));

    // Show success state briefly
    setTimeout(() => {
      setIsCreatingOrder(false);
      setOrderCreated(true);

      // Navigate to logistics optimization after showing success
      setTimeout(() => {
        router.push('/logistics-optimization');
      }, 1500);
    }, 1000);
  };

  const getTrendIcon = (trend: ForecastData['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <ArrowRight className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStockStatus = (current: number, predicted: number) => {
    const ratio = current / predicted;
    if (ratio < 0.5) return { status: 'Critical', color: 'text-red-600 bg-red-100' };
    if (ratio < 0.8) return { status: 'Low', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'Adequate', color: 'text-green-600 bg-green-100' };
  };

  // Summary stats
  const totalPredictedDemand = forecasts.reduce((sum, f) => sum + f.predictedDemand, 0);
  const totalCurrentStock = forecasts.reduce((sum, f) => sum + f.currentStock, 0);
  const totalRecommendedOrders = forecasts.reduce((sum, f) => sum + f.recommendedOrder, 0);
  const avgConfidence = Math.round(forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demand Forecasting</h1>
          <p className="text-gray-500">AI-powered demand predictions and inventory recommendations</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Next 7 Days</option>
            <option value="30d">Next 30 Days</option>
            <option value="90d">Next 90 Days</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Predicted Demand</p>
              <p className="text-xl font-bold">{totalPredictedDemand.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Stock</p>
              <p className="text-xl font-bold">{totalCurrentStock.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Recommended Orders</p>
              <p className="text-xl font-bold">{totalRecommendedOrders.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Confidence</p>
              <p className="text-xl font-bold">{avgConfidence}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold">Product Forecasts</h2>
            <p className="text-sm text-gray-500">Click a product to create an order</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Demand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommended</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {forecasts.map((forecast) => {
                  const stockStatus = getStockStatus(forecast.currentStock, forecast.predictedDemand);
                  return (
                    <tr
                      key={forecast.sku}
                      onClick={() => setSelectedForecast(forecast)}
                      className={`cursor-pointer transition-colors ${
                        selectedForecast?.sku === forecast.sku
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{forecast.product}</p>
                          <p className="text-xs text-gray-500">{forecast.sku}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{forecast.currentStock}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{forecast.predictedDemand}</td>
                      <td className="px-4 py-3">{getTrendIcon(forecast.trend)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(forecast.confidence)}`}>
                          {forecast.confidence}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {forecast.recommendedOrder > 0 ? (
                          <span className="font-medium text-orange-600">+{forecast.recommendedOrder}</span>
                        ) : (
                          <span className="text-gray-400">No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold mb-4">Create Order</h2>
          
          {!selectedForecast ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a product from the table to create an order</p>
            </div>
          ) : orderCreated ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg text-green-600">Order Created!</h3>
              <p className="text-gray-500 mt-2">Redirecting to logistics optimization...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Product Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">{selectedForecast.product}</h3>
                <p className="text-sm text-gray-500">{selectedForecast.sku}</p>
              </div>

              {/* Forecast Details */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Stock</span>
                  <span className="font-medium">{selectedForecast.currentStock} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Predicted Demand</span>
                  <span className="font-medium">{selectedForecast.predictedDemand} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lead Time</span>
                  <span className="font-medium">{selectedForecast.leadTime} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">AI Confidence</span>
                  <span className={`font-medium ${selectedForecast.confidence >= 85 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {selectedForecast.confidence}%
                  </span>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Recommended Order */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">AI Recommendation</span>
                </div>
                {selectedForecast.recommendedOrder > 0 ? (
                  <p className="text-2xl font-bold text-blue-700">
                    Order {selectedForecast.recommendedOrder} units
                  </p>
                ) : (
                  <p className="text-gray-600">Stock levels are adequate. No order needed.</p>
                )}
              </div>

              {/* Create Order Button */}
              <button
                onClick={handleCreateOrder}
                disabled={selectedForecast.recommendedOrder === 0 || isCreatingOrder}
                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                  selectedForecast.recommendedOrder === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isCreatingOrder
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Create Order & Optimize Route
                  </>
                )}
              </button>

              {selectedForecast.recommendedOrder === 0 && (
                <p className="text-xs text-center text-gray-500">
                  No order recommended for this product
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}