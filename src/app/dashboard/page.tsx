
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import InventoryChart, { type InventoryData } from "@/components/inventory-chart";
import OrderStatusTable from "@/components/order-status-table";
import { AlertCircle, PackageCheck, Truck } from "lucide-react";
import LiveRoutesMap from '@/components/live-routes-map';

const initialInventoryData: InventoryData[] = [
  { name: "Laptops", total: 1500, previous: 1500 },
  { name: "Monitors", total: 2200, previous: 2200 },
  { name: "Keyboards", total: 4500, previous: 4500 },
  { name: "Mice", total: 6000, previous: 6000 },
  { name: "Webcams", total: 3100, previous: 3100 },
  { name: "Headsets", total: 2800, previous: 2800 },
  { name: "Cables", total: 8500, previous: 8500 },
];

const calculateTotal = (data: InventoryData[]) => data.reduce((sum, item) => sum + item.total, 0);

export default function DashboardPage() {
  const [anomalyCount, setAnomalyCount] = useState(3);
  const [inventoryData, setInventoryData] = useState<InventoryData[]>(initialInventoryData);
  const [totalInventory, setTotalInventory] = useState(calculateTotal(initialInventoryData));
  const [previousInventory, setPreviousInventory] = useState(totalInventory);

  useEffect(() => {
    const anomalyInterval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance to increase anomaly count every 4 seconds
          setAnomalyCount(prev => prev + 1);
      }
    }, 4000);

    const inventoryInterval = setInterval(() => {
        setInventoryData(prevData => {
            const newData = prevData.map(item => {
                const change = (Math.floor(Math.random() * 100) - 45); // Fluctuate between -45 and +54
                const newTotal = Math.max(0, item.total + change);
                return { name: item.name, total: newTotal, previous: item.total };
            });
            
            setPreviousInventory(calculateTotal(prevData));
            setTotalInventory(calculateTotal(newData));
            
            return newData;
        });
    }, 5000);

    return () => {
        clearInterval(anomalyInterval);
        clearInterval(inventoryInterval);
    };
  }, []);

  const inventoryChange = totalInventory - previousInventory;
  const percentageChange = previousInventory === 0 ? 0 : (inventoryChange / previousInventory) * 100;
  const changeColor = percentageChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
  const changePrefix = percentageChange >= 0 ? '+' : '';

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
            <div className="text-2xl font-bold">{totalInventory.toLocaleString()} units</div>
            <p className={`text-xs ${changeColor}`}>
              {changePrefix}{percentageChange.toFixed(2)}% from last update
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
            <InventoryChart data={inventoryData} />
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
