'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Loader2, Pencil, BarChart, RefreshCw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import InventoryChart, { type InventoryData } from '@/components/inventory-chart';
import { inventoryApi, type Product as ApiProduct, type CreateProductDto } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  previousQuantity: number;
  weight: string;
  dimensions: string;
  reorderLevel: number;
  unitPrice: number;
  category: string;
  warehouseId: string;
}

type StatusVariant = "default" | "secondary" | "outline" | "destructive";

const statusVariantMap: Record<string, StatusVariant> = {
  'In Stock': 'secondary',
  'Low Stock': 'default',
  'Out of Stock': 'destructive',
};

const getStatus = (quantity: number, reorderLevel: number = 10): string => {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= reorderLevel) return 'Low Stock';
  return 'In Stock';
};

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Product name is required.'),
  sku: z.string().min(1, 'SKU is required.'),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative.'),
  weight: z.string().min(1, 'Weight is required (e.g., 2.5 kg).'),
  dimensions: z.string().min(1, 'Dimensions are required (e.g., 40x30x10 cm).'),
  category: z.string().min(1, 'Category is required.'),
  unitPrice: z.coerce.number().min(0, 'Price cannot be negative.'),
  reorderLevel: z.coerce.number().int().min(0, 'Reorder level cannot be negative.'),
});

// Transform API product to UI format
const transformApiProduct = (apiProduct: ApiProduct): Product => ({
  id: apiProduct.id,
  name: apiProduct.name,
  sku: apiProduct.sku,
  quantity: apiProduct.quantityInStock,
  previousQuantity: apiProduct.quantityInStock,
  weight: apiProduct.description?.match(/Weight:\s*([^,]+)/)?.[1] || 'N/A',
  dimensions: apiProduct.description?.match(/Dimensions:\s*([^,]+)/)?.[1] || 'N/A',
  reorderLevel: apiProduct.reorderLevel,
  unitPrice: apiProduct.unitPrice,
  category: apiProduct.category,
  warehouseId: apiProduct.warehouseId,
});

export default function CustomerInventoryPage() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: '',
      name: '',
      sku: '',
      quantity: 0,
      weight: '',
      dimensions: '',
      category: 'General',
      unitPrice: 0,
      reorderLevel: 10,
    },
  });

  // Fetch inventory from API
  const fetchInventory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    
    try {
      const products = await inventoryApi.getAll();
      const transformedProducts = products.map(transformApiProduct);
      
      // Preserve previous quantities for existing items
      setInventory(prev => {
        const prevMap = new Map(prev.map(p => [p.id, p.quantity]));
        return transformedProducts.map(p => ({
          ...p,
          previousQuantity: prevMap.get(p.id) ?? p.quantity,
        }));
      });
      
      if (isRefresh) {
        toast({ title: "Inventory Refreshed", description: "Data updated successfully." });
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load inventory. Please try again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (dialogMode === 'edit' && selectedProduct) {
      form.reset({
        id: selectedProduct.id,
        name: selectedProduct.name,
        sku: selectedProduct.sku,
        quantity: selectedProduct.quantity,
        weight: selectedProduct.weight,
        dimensions: selectedProduct.dimensions,
        category: selectedProduct.category,
        unitPrice: selectedProduct.unitPrice,
        reorderLevel: selectedProduct.reorderLevel,
      });
    } else if (!isDialogOpen) {
      form.reset({
        id: '',
        name: '',
        sku: '',
        quantity: 0,
        weight: '',
        dimensions: '',
        category: 'General',
        unitPrice: 0,
        reorderLevel: 10,
      });
    }
  }, [dialogMode, selectedProduct, form, isDialogOpen]);

  // Convert inventory to chart format
  const chartData: InventoryData[] = inventory.map(item => ({
    name: item.name,
    warehouses: [{
      name: "My Warehouse",
      total: item.quantity,
      previous: item.previousQuantity,
    }]
  }));

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    setIsSubmitting(true);
    
    try {
      if (dialogMode === 'add') {
        // Create new product via API
        const createDto: CreateProductDto = {
          sku: values.sku,
          name: values.name,
          description: `Weight: ${values.weight}, Dimensions: ${values.dimensions}`,
          category: values.category,
          unitPrice: values.unitPrice,
          quantityInStock: values.quantity,
          reorderLevel: values.reorderLevel,
          warehouseId: 'default', // You might want to make this configurable
        };
        
        const newProduct = await inventoryApi.create(createDto);
        const transformed = transformApiProduct(newProduct);
        
        setInventory(prev => [...prev, transformed]);
        toast({
          title: "Product Added",
          description: `Successfully added "${values.name}" to your inventory.`,
        });
      } else if (values.id) {
        // Update existing product
        const updateDto: Partial<CreateProductDto> = {
          sku: values.sku,
          name: values.name,
          description: `Weight: ${values.weight}, Dimensions: ${values.dimensions}`,
          category: values.category,
          unitPrice: values.unitPrice,
          quantityInStock: values.quantity,
          reorderLevel: values.reorderLevel,
        };
        
        const updatedProduct = await inventoryApi.update(values.id, updateDto);
        const transformed = transformApiProduct(updatedProduct);
        
        setInventory(prev => prev.map(p => 
          p.id === values.id ? { ...transformed, previousQuantity: p.quantity } : p
        ));
        toast({
          title: "Product Updated",
          description: `Successfully updated "${values.name}".`,
        });
      }
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to save product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save product. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await inventoryApi.delete(productToDelete.id);
      setInventory(prev => prev.filter(p => p.id !== productToDelete.id));
      toast({
        title: "Product Deleted",
        description: `Successfully deleted "${productToDelete.name}".`,
      });
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete product. Please try again.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const openDialog = (mode: 'add' | 'edit', product: Product | null = null) => {
    setDialogMode(mode);
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleForecastDemand = (product: Product) => {
    const params = new URLSearchParams({
      productName: product.name,
      productId: product.id,
      source: 'customer',
      currentStock: String(product.quantity)
    });
    router.push(`/forecasting?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading inventory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchInventory(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Chart Card */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
          <CardDescription>A summary of your current product stock levels.</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <InventoryChart data={chartData} view="customer" />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No inventory data. Add your first product below.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Your Inventory</CardTitle>
            <CardDescription>Add, edit, and view your product stock levels.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog('add')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{dialogMode === 'add' ? 'Add New Product' : 'Edit Product'}</DialogTitle>
                <DialogDescription>
                  {dialogMode === 'add' 
                    ? "Enter the details for the new inventory item."
                    : "Update the product details."
                  }
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Premium Laptop" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., LP-PREM-01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="99.99" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reorderLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reorder Level</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2.1 kg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dimensions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dimensions (LxWxH)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 35x25x2 cm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Electronics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {dialogMode === 'add' ? 'Add Product' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {inventory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const status = getStatus(item.quantity, item.reorderLevel);
                  return (
                    <TableRow key={item.id} className="transition-all hover:bg-muted/50">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[status] || 'outline'}>{status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {(status === 'Low Stock' || status === 'Out of Stock') && (
                          <Button variant="outline" size="sm" onClick={() => handleForecastDemand(item)}>
                            <BarChart className="h-4 w-4 mr-2" />
                            Forecast
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openDialog('edit', item)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit Product</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setProductToDelete(item);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete Product</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No products in inventory. Click "Add Product" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}