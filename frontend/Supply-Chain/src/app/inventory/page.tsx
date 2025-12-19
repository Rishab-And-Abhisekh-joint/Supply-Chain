'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { inventoryApi, warehouseApi, Product, Warehouse } from '@/lib/api';
import {
  Package,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  X,
  ChevronDown,
  ArrowUpDown,
  CheckCircle,
  XCircle,
} from 'lucide-react';

type SortField = 'name' | 'sku' | 'category' | 'quantityInStock' | 'unitPrice';
type SortOrder = 'asc' | 'desc';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    unitPrice: 0,
    quantityInStock: 0,
    reorderLevel: 0,
    warehouseId: '',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [productsData, warehousesData] = await Promise.all([
        inventoryApi.getAll(),
        warehouseApi.getAll(),
      ]);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory data');
      console.error('Error fetching inventory:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && product.quantityInStock <= product.reorderLevel && product.quantityInStock > 0) ||
        (stockFilter === 'out' && product.quantityInStock === 0) ||
        (stockFilter === 'in' && product.quantityInStock > product.reorderLevel);
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newProduct = await inventoryApi.create(formData);
      setProducts([...products, newProduct]);
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmitting(true);

    try {
      const updatedProduct = await inventoryApi.update(selectedProduct.id, formData);
      setProducts(products.map(p => (p.id === selectedProduct.id ? updatedProduct : p)));
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);

    try {
      await inventoryApi.delete(selectedProduct.id);
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      setShowDeleteModal(false);
      setSelectedProduct(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category,
      unitPrice: product.unitPrice,
      quantityInStock: product.quantityInStock,
      reorderLevel: product.reorderLevel,
      warehouseId: product.warehouseId,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: '',
      unitPrice: 0,
      quantityInStock: 0,
      reorderLevel: 0,
      warehouseId: warehouses[0]?.id || '',
    });
  };

  const getStockStatus = (product: Product) => {
    if (product.quantityInStock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    }
    if (product.quantityInStock <= product.reorderLevel) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const exportToCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Quantity', 'Unit Price', 'Reorder Level', 'Status'];
    const rows = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.category,
      p.quantityInStock,
      p.unitPrice,
      p.reorderLevel,
      getStockStatus(p).label,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.quantityInStock <= p.reorderLevel && p.quantityInStock > 0).length;
  const outOfStockCount = products.filter(p => p.quantityInStock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + p.quantityInStock * p.unitPrice, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage your product inventory and stock levels</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Total Products</p>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalProducts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Low Stock</p>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{lowStockCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Out of Stock</p>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{outOfStockCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Total Value</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Stock Levels</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  onClick={() => handleSort('sku')}
                  className="text-left px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    SKU
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="text-left px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Product Name
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="text-left px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Category
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantityInStock')}
                  className="text-left px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Stock
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('unitPrice')}
                  className="text-left px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Unit Price
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const status = getStockStatus(product);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{product.sku}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">{product.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{product.quantityInStock}</span>
                        <span className="text-xs text-gray-500 ml-1">/ {product.reorderLevel} min</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        ₹{product.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(product)}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add New Product</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantityInStock}
                    onChange={e => setFormData({ ...formData, quantityInStock: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.reorderLevel}
                    onChange={e => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                  <select
                    required
                    value={formData.warehouseId}
                    onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Product</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditProduct} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantityInStock}
                    onChange={e => setFormData({ ...formData, quantityInStock: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.reorderLevel}
                    onChange={e => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                  <select
                    required
                    value={formData.warehouseId}
                    onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold">Delete Product</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedProduct.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
