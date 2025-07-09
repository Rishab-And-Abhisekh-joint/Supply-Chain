import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import InventoryChart from "@/components/inventory-chart";
import OrderStatusTable from "@/components/order-status-table";
import { AlertCircle, PackageCheck, Truck } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inventory
            </CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14,284 units</div>
            <p className="text-xs text-muted-foreground">
              +5.2% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Deliveries In-Transit
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              +2 since last hour
            </p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50 text-destructive dark:border-destructive">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Anomalies Detected
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground text-destructive/80">
              Immediate action required
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Inventory Levels</CardTitle>
            <CardDescription>Current stock levels across all products.</CardDescription>
          </CardHeader>
          <CardContent>
            <InventoryChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
           <CardHeader>
            <CardTitle>Live Delivery Routes</CardTitle>
            <CardDescription>Real-time location of in-transit deliveries.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[300px] w-full overflow-hidden rounded-lg">
                <Image
                    src="https://placehold.co/600x400.png"
                    alt="Map of delivery routes"
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="map route"
                />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Overview of the most recent orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrderStatusTable />
        </CardContent>
      </Card>
    </div>
  );
}
