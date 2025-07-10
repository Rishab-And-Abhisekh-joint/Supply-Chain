
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Loader2, Pencil } from 'lucide-react';

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Product {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    weight: string;
    dimensions: string;
}

const initialInventory: Product[] = [
    { id: 'PROD001', name: 'Premium Laptop', sku: 'LP-PREM-01', quantity: 45, weight: '2.1 kg', dimensions: '35x25x2 cm' },
    { id: 'PROD002', name: 'Wireless Mouse', sku: 'MS-WRLS-05', quantity: 150, weight: '0.1 kg', dimensions: '10x6x4 cm' },
    { id: 'PROD003', name: 'Mechanical Keyboard', sku: 'KB-MECH-02', quantity: 0, weight: '1.2 kg', dimensions: '45x15x4 cm' },
    { id: 'PROD004', name: '4K Monitor', sku: 'MN-4K-27', quantity: 22, weight: '7.5 kg', dimensions: '62x45x20 cm' },
    { id: 'PROD005', name: 'USB-C Hub', sku: 'HUB-USBC-8P', quantity: 5, weight: '0.2 kg', dimensions: '12x5x2 cm' },
];

type StatusVariant = "default" | "secondary" | "outline" | "destructive";

const statusVariantMap: Record<string, StatusVariant> = {
    'In Stock': 'secondary',
    'Low Stock': 'default',
    'Out of Stock': 'destructive',
};

const getStatus = (quantity: number): string => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= 10) return 'Low Stock';
    return 'In Stock';
}

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Product name is required.'),
  sku: z.string().min(1, 'SKU is required.'),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative.'),
  weight: z.string().min(1, 'Weight is required (e.g., 2.5 kg).'),
  dimensions: z.string().min(1, 'Dimensions are required (e.g., 40x30x10 cm).'),
});


export default function CustomerInventoryPage() {
    const [inventory, setInventory] = useState<Product[]>(initialInventory);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            id: '',
            name: '',
            sku: '',
            quantity: 0,
            weight: '',
            dimensions: '',
        },
    });

    useEffect(() => {
        if (dialogMode === 'edit' && selectedProduct) {
            form.reset(selectedProduct);
        } else {
            form.reset({
                id: '',
                name: '',
                sku: '',
                quantity: 0,
                weight: '',
                dimensions: '',
            });
        }
    }, [dialogMode, selectedProduct, form, isDialogOpen]);

    const onSubmit = (values: z.infer<typeof productSchema>) => {
        setIsSubmitting(true);
        
        // Simulate an API call
        setTimeout(() => {
            if (dialogMode === 'add') {
                const newProduct = {
                    ...values,
                    id: `PROD${String(inventory.length + 1).padStart(3, '0')}`,
                };
                setInventory(prev => [...prev, newProduct]);
                toast({
                    title: "Product Added",
                    description: `Successfully added "${values.name}" to your inventory.`,
                });
            } else {
                 setInventory(prev => prev.map(p => p.id === values.id ? { ...p, ...values } : p));
                 toast({
                    title: "Product Updated",
                    description: `Successfully updated "${values.name}".`,
                });
            }

            setIsSubmitting(false);
            setIsDialogOpen(false);
        }, 1000);
    }
    
    const openDialog = (mode: 'add' | 'edit', product: Product | null = null) => {
        setDialogMode(mode);
        setSelectedProduct(product);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Your Inventory</CardTitle>
                        <CardDescription>Manage your products and view their stock levels.</CardDescription>
                    </div>
                     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                           <Button onClick={() => openDialog('add')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{dialogMode === 'add' ? 'Add New Product' : 'Edit Product'}</DialogTitle>
                                <DialogDescription>
                                    {dialogMode === 'add' 
                                        ? "Enter the details for the new inventory item. Click save when you're done."
                                        : "Update the product details. Click save when you're done."
                                    }
                                </DialogDescription>
                            </DialogHeader>
                             <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
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
                                     <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quantity</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="e.g., 50" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
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
                                     <DialogFooter>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Weight</TableHead>
                                <TableHead>Dimensions</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inventory.map((item) => {
                                const status = getStatus(item.quantity);
                                return (
                                    <TableRow key={item.id} className="transition-all hover:bg-muted/50">
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.sku}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.weight}</TableCell>
                                        <TableCell>{item.dimensions}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariantMap[status] || 'outline'}>{status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openDialog('edit', item)}>
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit Product</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
