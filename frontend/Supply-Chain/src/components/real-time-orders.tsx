
'use client';

import { useState } from 'react';
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
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';

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
    onPayDue: (orderId: string, amount: number) => void;
}

interface PaymentDialogState {
    isOpen: boolean;
    order: Order | null;
    amount: string;
}

type StatusVariant = "default" | "secondary" | "outline" | "destructive";

const statusVariantMap: Record<Order['status'], StatusVariant> = {
    Shipped: "default",
    Delivered: "secondary",
    Processing: "outline",
    Cancelled: "destructive",
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

export default function RealTimeOrders({ orders, onOrderSelect, selectedOrderId, onPayDue }: RealTimeOrdersProps) {
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogState>({ isOpen: false, order: null, amount: '' });
  const { toast } = useToast();

  const handlePayClick = (order: Order) => {
    const amountDue = order.totalAmount - order.amountPaid;
    setPaymentDialog({ isOpen: true, order, amount: String(amountDue.toFixed(2)) });
  };

  const handlePaymentSubmit = () => {
    if (paymentDialog.order && paymentDialog.amount) {
      const paymentAmount = parseFloat(paymentDialog.amount);
      if (paymentAmount > 0) {
        onPayDue(paymentDialog.order.id, paymentAmount);
        toast({
          title: "Payment Submitted",
          description: `${formatCurrency(paymentAmount)} has been paid for Order ${paymentDialog.order.id}.`,
        });
        setPaymentDialog({ isOpen: false, order: null, amount: '' });
      }
    }
  };


  return (
    <>
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
                        {amountDue > 0.01 ? (
                             <Button 
                                variant="link"
                                className="p-0 h-auto text-xs text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePayClick(order);
                                }}
                             >
                                Due: {formatCurrency(amountDue)}
                             </Button>
                        ) : (
                             <div className="text-xs text-green-600">Paid in full</div>
                        )}
                    </TableCell>
                </TableRow>
            )
        })}
      </TableBody>
    </Table>
    
    <Dialog open={paymentDialog.isOpen} onOpenChange={(isOpen) => setPaymentDialog(prev => ({ ...prev, isOpen }))}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Make a Payment</DialogTitle>
                <DialogDescription>
                    Enter the amount to pay for Order {paymentDialog.order?.id}.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                        Amount (₹)
                    </Label>
                    <Input
                        id="amount"
                        type="number"
                        value={paymentDialog.amount}
                        onChange={(e) => setPaymentDialog(prev => ({...prev, amount: e.target.value}))}
                        className="col-span-3"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handlePaymentSubmit}>Pay Now</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
