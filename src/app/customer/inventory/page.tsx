import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";

const customerInventory = [
    { id: 'PROD001', name: 'Premium Laptop', sku: 'LP-PREM-01', quantity: 45, status: 'In Stock' },
    { id: 'PROD002', name: 'Wireless Mouse', sku: 'MS-WRLS-05', quantity: 150, status: 'In Stock' },
    { id: 'PROD003', name: 'Mechanical Keyboard', sku: 'KB-MECH-02', quantity: 0, status: 'Out of Stock' },
    { id: 'PROD004', name: '4K Monitor', sku: 'MN-4K-27', quantity: 22, status: 'In Stock' },
    { id: 'PROD005', name: 'USB-C Hub', sku: 'HUB-USBC-8P', quantity: 5, status: 'Low Stock' },
];

type StatusVariant = "default" | "secondary" | "outline" | "destructive";

const statusVariantMap: Record<string, StatusVariant> = {
    'In Stock': 'secondary',
    'Low Stock': 'default',
    'Out of Stock': 'destructive',
};


export default function CustomerInventoryPage() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Your Inventory</CardTitle>
                        <CardDescription>Manage your products and view their stock levels.</CardDescription>
                    </div>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Product
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customerInventory.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.sku}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariantMap[item.status] || 'outline'}>{item.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
