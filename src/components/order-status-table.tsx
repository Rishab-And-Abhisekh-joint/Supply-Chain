import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const orders = [
  {
    id: "ORD001",
    customer: "Liam Johnson",
    date: "2023-06-23",
    status: "Shipped",
    total: "$250.00",
  },
  {
    id: "ORD002",
    customer: "Olivia Smith",
    date: "2023-06-22",
    status: "Delivered",
    total: "$150.00",
  },
  {
    id: "ORD003",
    customer: "Noah Williams",
    date: "2023-06-21",
    status: "Processing",
    total: "$350.00",
  },
  {
    id: "ORD004",
    customer: "Emma Brown",
    date: "2023-06-20",
    status: "Delivered",
    total: "$450.00",
  },
  {
    id: "ORD005",
    customer: "Ava Jones",
    date: "2023-06-19",
    status: "Cancelled",
    total: "$550.00",
  },
];

type StatusVariant = "default" | "secondary" | "outline" | "destructive";

const statusVariantMap: Record<string, StatusVariant> = {
    Shipped: "default",
    Delivered: "secondary",
    Processing: "outline",
    Cancelled: "destructive",
};

export default function OrderStatusTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id}</TableCell>
            <TableCell>{order.customer}</TableCell>
            <TableCell>{order.date}</TableCell>
            <TableCell>
              <Badge variant={statusVariantMap[order.status] || 'outline'}>{order.status}</Badge>
            </TableCell>
            <TableCell className="text-right">{order.total}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
