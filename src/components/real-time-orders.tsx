
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Order {
  id: string;
  customerName: string;
  customerId: string;
  orderDate: string;
  expectedDate: string;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  deliveryType: "Truck" | "Train" | "Flight";
  totalAmount: number;
  amountPaid: number;
  transitId: string | null;
}

interface RealTimeOrdersProps {
    orders: Order[];
    onOrderSelect: (orderId: string | null) => void;
    selectedOrderId: string | null;
}

type StatusVariant = "default" | "secondary" | "outline" | "destructive";

const statusVariantMap: Record<Order['status'], StatusVariant> = {
    Shipped: "default",
    Delivered: "secondary",
    Processing: "outline",
    Cancelled: "destructive",
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function RealTimeOrders({ orders, onOrderSelect, selectedOrderId }: RealTimeOrdersProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Delivery</TableHead>
          <TableHead className="text-right">Payment</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
            const amountDue = order.totalAmount - order.amountPaid;
            return (
                <TableRow 
                    key={order.id} 
                    className={cn(
                        "cursor-pointer",
                        selectedOrderId === order.id && "bg-muted/80"
                    )}
                    onClick={() => onOrderSelect(order.id === selectedOrderId ? null : order.id)}
                >
                    <TableCell>
                        <Button variant="link" className="p-0 h-auto font-medium">
                            {order.id}
                        </Button>
                    </TableCell>
                    <TableCell>
                        <div>{order.customerName}</div>
                        <div className="text-xs text-muted-foreground">{order.customerId}</div>
                    </TableCell>
                    <TableCell>
                        <div>Ordered: {order.orderDate}</div>
                        <div className="text-xs text-muted-foreground">Expected: {order.expectedDate}</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={statusVariantMap[order.status] || 'outline'}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>{order.deliveryType}</TableCell>
                    <TableCell className="text-right">
                        <div>{formatCurrency(order.totalAmount)}</div>
                        {amountDue > 0 ? (
                             <div className="text-xs text-destructive">Due: {formatCurrency(amountDue)}</div>
                        ) : (
                             <div className="text-xs text-green-600">Paid in full</div>
                        )}
                    </TableCell>
                </TableRow>
            )
        })}
      </TableBody>
    </Table>
  );
}
