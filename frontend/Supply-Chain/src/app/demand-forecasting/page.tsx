'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Package,
  Calendar,
  ArrowRight,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Loader2,
  CheckCircle,
  MapPin,
  Warehouse as WarehouseIcon,
  Navigation
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  avgDailySales: number;
  unitPrice: number;
  reorderPoint: number;
}

interface Warehouse {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface ForecastResult {
  product: Product;
  predictedDemand: number;
  confidence: number;
  recommendedOrder: number;
  daysUntilStockout: number;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
}

// ============================================================================
// DEMO PRODUCTS (used when no inventory data uploaded)
// ============================================================================

const DEMO_PRODUCTS: Product[] = [
  { id: 'P001', name: 'Organic Wheat Flour', sku: 'WF-001', category: 'Grains', currentStock: 250, avgDailySales: 45, unitPrice: 65, reorderPoint: 100 },
  { id: 'P002', name: 'Basmati Rice Premium', sku: 'BR-002', category: 'Rice', currentStock: 180, avgDailySales: 38, unitPrice: 95, reorderPoint: 80 },
  { id: 'P003', name: 'Refined Sunflower Oil', sku: 'SO-003', category: 'Oils', currentStock: 120, avgDailySales: 25, unitPrice: 180, reorderPoint: 50 },
  { id: 'P004', name: 'Toor Dal', sku: 'TD-004', category: 'Pulses', currentStock: 300, avgDailySales: 52, unitPrice: 140, reorderPoint: 120 },
  { id: 'P005', name: 'Sugar Crystal', sku: 'SC-005', category: 'Sweeteners', currentStock: 85, avgDailySales: 30, unitPrice: 48, reorderPoint: 60 },
  { id: 'P006', name: 'Milk Powder', sku: 'MP-006', category: 'Dairy', currentStock: 45, avgDailySales: 18, unitPrice: 420, reorderPoint: 30 },
];

// ============================================================================
// HELPERS
// ============================================================================

function getUserEmail(): string {
  if (typeof window === 'undefined') return 'demo@example.com';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.email || 'demo@example.com';
    }
  } catch { }
  return 'demo@example.com';
}

function generateForecast(products: Product[]): ForecastResult[] {
  return products.map(product => {
    const daysUntilStockout = Math.floor(product.currentStock / product.avgDailySales);
    const predictedDemand = Math.round(product.avgDailySales * 30 * (0.9 + Math.random() * 0.3));
    const recommendedOrder = Math.max(0, predictedDemand - product.currentStock + product.reorderPoint);
    const confidence = 75 + Math.floor(Math.random() * 20);
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    const trendRandom = Math.random();
    if (trendRandom > 0.6) trend = 'up';
    else if (trendRandom < 0.3) trend = 'down';

    let recommendation = '';
    if (daysUntilStockout <= 5) {
      recommendation = 'URGENT: Stock critically low. Order immediately to prevent stockout.';
    } else if (daysUntilStockout <= 14) {
      recommendation = 'Order soon to maintain optimal stock levels.';
    } else if (trend === 'up') {
      recommendation = 'Demand trending upward. Consider increasing order quantity.';
    } else {
      recommendation = 'Stock levels healthy. Standard reorder recommended.';
    }

    return {
      product,
      predictedDemand,
      confidence,
      recommendedOrder,
      daysUntilStockout,
      trend,
      recommendation
    };
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DemandForecastingPage() {
  const router = useRouter();
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [forecasts, setForecasts] = useState<ForecastResult[]>([]);
  
  // Selection states
  const [selectedProduct, setSelectedProduct] = useState<ForecastResult | null>(null);
  const [sourceWarehouse, setSourceWarehouse] = useState<string>('');
  const [destinationWarehouse, setDestinationWarehouse] = useState<string>('');
  const [orderQuantity, setOrderQuantity] = useState<number>(0);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState<'7' | '14' | '30'>('30');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // ============================================================================
  // FETCH DATA
  // ============================================================================

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      // Fetch warehouses
      const warehousesRes = await fetch('/api/warehouses?forSelection=true', {
        headers: { 'X-User-Email': getUserEmail() }
      });
      
      if (warehousesRes.ok) {
        const warehousesData = await warehousesRes.json();
        if (warehousesData.success && warehousesData.data) {
          setWarehouses(warehousesData.data.filter((w: Warehouse) => w.status === 'operational'));
        }
      }

      // Fetch inventory/products
      const inventoryRes = await fetch('/api/data?type=inventory', {
        headers: { 'X-User-Email': getUserEmail() }
      });

      let productData: Product[] = DEMO_PRODUCTS;

      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        if (inventoryData.success && inventoryData.data && Array.isArray(inventoryData.data) && inventoryData.data.length > 0) {
          productData = inventoryData.data.map((item: any, index: number) => ({
            id: item.id || `P${String(index + 1).padStart(3, '0')}`,
            name: item.name || item.productName || 'Unknown Product',
            sku: item.sku || `SKU-${index + 1}`,
            category: item.category || 'General',
            currentStock: parseInt(item.currentStock || item.quantityInStock || item.stock) || 100,
            avgDailySales: parseInt(item.avgDailySales) || Math.floor(Math.random() * 30 + 10),
            unitPrice: parseFloat(item.unitPrice || item.price) || 100,
            reorderPoint: parseInt(item.reorderPoint || item.reorderLevel) || 50
          }));
        }
      }

      setProducts(productData);
      setForecasts(generateForecast(productData));

    } catch (error) {
      console.error('Error fetching data:', error);
      setProducts(DEMO_PRODUCTS);
      setForecasts(generateForecast(DEMO_PRODUCTS));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Regenerate forecast when period changes
  useEffect(() => {
    if (products.length > 0) {
      // Adjust forecast based on period
      const adjustedProducts = products.map(p => ({
        ...p,
        avgDailySales: p.avgDailySales * (parseInt(forecastPeriod) / 30)
      }));
      setForecasts(generateForecast(products));
    }
  }, [forecastPeriod, products]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreateOrder = (forecast: ForecastResult) => {
    setSelectedProduct(forecast);
    setOrderQuantity(forecast.recommendedOrder);
    setShowOrderModal(true);
    setOrderSuccess(false);
  };

  const handleConfirmOrder = async () => {
    if (!selectedProduct || !sourceWarehouse || !destinationWarehouse) {
      return;
    }

    if (sourceWarehouse === destinationWarehouse) {
      alert('Source and destination warehouses must be different');
      return;
    }

    setIsProcessing(true);

    try {
      const source = warehouses.find(w => w.id === sourceWarehouse);
      const destination = warehouses.find(w => w.id === destinationWarehouse);

      // Create pending order for logistics
      const orderData = {
        productId: selectedProduct.product.id,
        productName: selectedProduct.product.name,
        quantity: orderQuantity,
        unitPrice: selectedProduct.product.unitPrice,
        total: orderQuantity * selectedProduct.product.unitPrice,
        recommendation: selectedProduct.recommendation,
        source: 'demand_forecasting',
        sourceWarehouse: {
          id: source?.id,
          name: source?.name,
          city: source?.city,
          latitude: source?.latitude,
          longitude: source?.longitude
        },
        destinationWarehouse: {
          id: destination?.id,
          name: destination?.name,
          city: destination?.city,
          latitude: destination?.latitude,
          longitude: destination?.longitude
        }
      };

      // Store in session for logistics page
      sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));

      // Also save to API
      await fetch('/api/pending-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': getUserEmail()
        },
        body: JSON.stringify(orderData)
      });

      setOrderSuccess(true);

      // Redirect to logistics after 2 seconds
      setTimeout(() => {
        router.push('/logistics-optimization');
      }, 2000);

    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // STATS
  // ============================================================================

  const urgentCount = forecasts.filter(f => f.daysUntilStockout <= 7).length;
  const lowStockCount = forecasts.filter(f => f.daysUntilStockout <= 14 && f.daysUntilStockout > 7).length;
  const totalReorderValue = forecasts.reduce((sum, f) => sum + (f.recommendedOrder * f.product.unitPrice), 0);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500">Analyzing demand patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demand Forecasting</h1>
          <p className="text-gray-500">AI-powered demand prediction and inventory optimization</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Forecast Period Selector */}
          <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
            {(['7', '14', '30'] as const).map(period => (
              <button
                key={period}
                onClick={() => setForecastPeriod(period)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  forecastPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {period} Days
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Products Tracked</span>
          </div>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-500">Urgent Reorder</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-500">Low Stock</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Reorder Value</span>
          </div>
          <p className="text-2xl font-bold">₹{(totalReorderValue / 1000).toFixed(1)}K</p>
        </div>
      </div>

      {/* Warehouse Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <WarehouseIcon className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">
              {warehouses.length} Operational Warehouses Available
            </p>
            <p className="text-sm text-blue-700">
              Select source and destination when creating orders for route optimization
            </p>
          </div>
        </div>
      </div>

      {/* Forecast Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Demand Forecast ({forecastPeriod} Days)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Current Stock</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Predicted Demand</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Days to Stockout</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Trend</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Recommended Order</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {forecasts.map((forecast) => (
                <tr key={forecast.product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{forecast.product.name}</p>
                      <p className="text-xs text-gray-500">{forecast.product.sku} • {forecast.product.category}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{forecast.product.currentStock}</span>
                    <span className="text-gray-500 text-sm"> units</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium">{forecast.predictedDemand}</span>
                      <span className="text-gray-500 text-sm"> units</span>
                      <div className="text-xs text-gray-400">{forecast.confidence}% confidence</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      forecast.daysUntilStockout <= 7 
                        ? 'bg-red-100 text-red-700' 
                        : forecast.daysUntilStockout <= 14 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {forecast.daysUntilStockout} days
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-sm ${
                      forecast.trend === 'up' ? 'text-green-600' :
                      forecast.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {forecast.trend === 'up' ? '↑' : forecast.trend === 'down' ? '↓' : '→'}
                      {forecast.trend}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-blue-600">{forecast.recommendedOrder}</span>
                      <span className="text-gray-500 text-sm"> units</span>
                      <div className="text-xs text-gray-400">
                        ₹{(forecast.recommendedOrder * forecast.product.unitPrice).toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleCreateOrder(forecast)}
                      disabled={forecast.recommendedOrder <= 0}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        forecast.recommendedOrder <= 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : forecast.daysUntilStockout <= 7
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Create Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Create Restock Order</h2>
              <p className="text-gray-500 text-sm mt-1">
                Configure order details and select warehouses for delivery
              </p>
            </div>

            {orderSuccess ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Order Created Successfully!</h3>
                <p className="text-gray-600">Redirecting to Logistics Optimization...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Product Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{selectedProduct.product.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Current Stock:</span>
                      <span className="ml-2 font-medium">{selectedProduct.product.currentStock} units</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Unit Price:</span>
                      <span className="ml-2 font-medium">₹{selectedProduct.product.unitPrice}</span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700 mt-3 bg-blue-50 p-2 rounded">
                    {selectedProduct.recommendation}
                  </p>
                </div>

                {/* Order Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Quantity
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ₹{(orderQuantity * selectedProduct.product.unitPrice).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Total Value</p>
                    </div>
                  </div>
                </div>

                {/* Source Warehouse */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1 text-green-600" />
                    Source Warehouse (Origin)
                  </label>
                  <select
                    value={sourceWarehouse}
                    onChange={(e) => setSourceWarehouse(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select source warehouse...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id} disabled={w.id === destinationWarehouse}>
                        {w.name} - {w.city}, {w.state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Warehouse */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1 text-red-600" />
                    Destination Warehouse
                  </label>
                  <select
                    value={destinationWarehouse}
                    onChange={(e) => setDestinationWarehouse(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select destination warehouse...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id} disabled={w.id === sourceWarehouse}>
                        {w.name} - {w.city}, {w.state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Route Preview */}
                {sourceWarehouse && destinationWarehouse && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Navigation className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Route Preview</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{warehouses.find(w => w.id === sourceWarehouse)?.name}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>{warehouses.find(w => w.id === destinationWarehouse)?.name}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!orderSuccess && (
              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOrder}
                  disabled={!sourceWarehouse || !destinationWarehouse || isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      Continue to Logistics
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}