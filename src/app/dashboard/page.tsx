
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import InventoryChart from "@/components/inventory-chart";
import OrderStatusTable from "@/components/order-status-table";
import { AlertCircle, PackageCheck, Truck } from "lucide-react";
import LiveRoutesMap from '@/components/live-routes-map';

export default function DashboardPage() {
  const [anomalyCount, setAnomalyCount] = useState(3);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance to increase anomaly count every 4 seconds
          setAnomalyCount(prev => prev + 1);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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
        <Link href="/operations">
          <Card className="border-destructive text-destructive transition-all hover:bg-destructive/10">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Anomalies Detected
              </CardTitle>
              <AlertCircle className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{anomalyCount}</div>
              <p className="text-xs text-destructive/80">
                Immediate action required
              </p>
            </CardContent>
          </Card>
        </Link>
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
                <LiveRoutesMap />
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
