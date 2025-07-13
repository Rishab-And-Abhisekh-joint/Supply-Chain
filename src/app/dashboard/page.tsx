
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import InventoryChart, { type InventoryData } from "@/components/inventory-chart";
import { AlertCircle, PackageCheck, Truck } from "lucide-react";
import LiveRoutesMap from '@/components/live-routes-map';
import RealTimeOrders, { type Order } from '@/components/real-time-orders';

const initialInventoryData: InventoryData[] = [
  { name: "Laptops", total: 1500, previous: 1500 },
  { name: "Monitors", total: 2200, previous: 2200 },
  { name: "Keyboards", total: 4500, previous: 4500 },
  { name: "Mice", total: 6000, previous: 6000 },
  { name: "Webcams", total: 3100, previous: 3100 },
  { name: "Headsets", total: 2800, previous: 2800 },
  { name: "Cables", total: 8500, previous: 8500 },
];

const initialOrders: Order[] = [
    { id: 'ORD789', customerName: 'Liam Johnson', customerId: 'CUST001', orderDate: '2023-10-23', expectedDate: '2023-10-28', status: 'Shipped', deliveryType: 'Truck', totalAmount: 250.00, amountPaid: 250.00, transitId: 'truck-1' },
    { id: 'ORD790', customerName: 'Olivia Smith', customerId: 'CUST002', orderDate: '2023-10-24', expectedDate: '2023-10-29', status: 'Shipped', deliveryType: 'Truck', totalAmount: 150.00, amountPaid: 150.00, transitId: 'truck-1' },
    { id: 'ORD791', customerName: 'Noah Williams', customerId: 'CUST003', orderDate: '2023-10-24', expectedDate: '2023-11-01', status: 'Shipped', deliveryType: 'Truck', totalAmount: 350.00, amountPaid: 350.00, transitId: 'truck-2' },
    { id: 'ORD801', customerName: 'Emma Brown', customerId: 'CUST004', orderDate: '2023-10-22', expectedDate: '2023-11-05', status: 'Shipped', deliveryType: 'Train', totalAmount: 450.00, amountPaid: 450.00, transitId: 'train-1' },
    { id: 'ORD905', customerName: 'Ava Jones', customerId: 'CUST005', orderDate: '2023-10-21', expectedDate: '2023-10-25', status: 'Shipped', deliveryType: 'Flight', totalAmount: 550.00, amountPaid: 550.00, transitId: 'flight-1' },
    { id: 'ORD999', customerName: 'James Miller', customerId: 'CUST006', orderDate: '2023-10-25', expectedDate: '2023-11-02', status: 'Processing', deliveryType: 'Truck', totalAmount: 200.00, amountPaid: 50.00, transitId: null },
    { id: 'ORD998', customerName: 'Sophia Davis', customerId: 'CUST007', orderDate: '2023-10-25', expectedDate: '2023-11-03', status: 'Processing', deliveryType: 'Train', totalAmount: 800.00, amountPaid: 200.00, transitId: null },
];

const generateNewOrder = (orderCount: number): Order => {
    const newId = `ORD${1000 + orderCount}`;
    const customers = [['Lucas', 'Martinez'], ['Chloe', 'Garcia'], ['Mason', 'Rodriguez'], ['Zoe', 'Lee']];
    const customer = customers[orderCount % customers.length];
    const total = Math.floor(Math.random() * 500) + 50;
    const paid = Math.random() > 0.6 ? total : Math.floor(Math.random() * total);
    return {
        id: newId,
        customerName: `${customer[0]} ${customer[1]}`,
        customerId: `CUST${String(100 + orderCount).padStart(3, '0')}`,
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Processing',
        deliveryType: 'Truck',
        totalAmount: total,
        amountPaid: paid,
        transitId: null
    };
}


const calculateTotal = (data: InventoryData[]) => data.reduce((sum, item) => sum + item.total, 0);

export default function DashboardPage() {
  const [anomalyCount, setAnomalyCount] = useState(3);
  const [inventoryData, setInventoryData] = useState<InventoryData[]>(initialInventoryData);
  const [totalInventory, setTotalInventory] = useState(calculateTotal(initialInventoryData));
  const [previousInventory, setPreviousInventory] = useState(totalInventory);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Anomaly simulation
    const anomalyInterval = setInterval(() => {
      if (Math.random() > 0.7) { 
          setAnomalyCount(prev => prev + 1);
      }
    }, 4000);

    // Inventory simulation
    const inventoryInterval = setInterval(() => {
        setInventoryData(prevData => {
            const newData = prevData.map(item => {
                const forceCritical = item.name === 'Webcams' && Math.random() > 0.8;
                let change;
                if (forceCritical) {
                    change = -(item.total - 900);
                } else {
                    change = (Math.floor(Math.random() * 100) - 45);
                }
                const newTotal = Math.max(0, item.total + change);
                return { name: item.name, total: newTotal, previous: item.total };
            });
            
            const currentTotal = calculateTotal(prevData);
            const newTotalInventory = calculateTotal(newData);
            
            setPreviousInventory(currentTotal);
            setTotalInventory(newTotalInventory);
            
            return newData;
        });
    }, 5000);
    
    // Order status simulation
    const orderStatusInterval = setInterval(() => {
        setOrders(prevOrders => {
            const orderToUpdateIndex = Math.floor(Math.random() * prevOrders.length);
            return prevOrders.map((order, index) => {
                if (index === orderToUpdateIndex && order.status === "Shipped") {
                    if(Math.random() > 0.8) {
                        return { ...order, status: "Delivered", expectedDate: new Date().toISOString().split('T')[0] };
                    }
                }
                return order;
            });
        });
    }, 7000);

    // New order simulation
    const newOrderInterval = setInterval(() => {
        setOrders(prev => [generateNewOrder(prev.length), ...prev]);
    }, 15000);
    
    // Completed order cleanup
    const cleanupInterval = setInterval(() => {
        setOrders(prev => prev.filter(order => {
            const isDelivered = order.status === 'Delivered';
            const isPaid = order.amountPaid >= order.totalAmount;
            return !isDelivered || !isPaid;
        }));
    }, 10000);

    return () => {
        clearInterval(anomalyInterval);
        clearInterval(inventoryInterval);
        clearInterval(orderStatusInterval);
        clearInterval(newOrderInterval);
        clearInterval(cleanupInterval);
    };
  }, []);

  const handlePayment = (orderId: string, amount: number) => {
    setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
            const newAmountPaid = Math.min(order.totalAmount, order.amountPaid + amount);
            return { ...order, amountPaid: newAmountPaid };
        }
        return order;
    }));
  };

  const inventoryChange = totalInventory - previousInventory;
  const percentageChange = previousInventory === 0 ? 0 : (inventoryChange / previousInventory) * 100;
  const changeColor = inventoryChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
  const changePrefix = inventoryChange >= 0 ? '+' : '';

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
              {changePrefix}{inventoryChange.toLocaleString()} ({changePrefix}{percentageChange.toFixed(2)}%)
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
            <div className="text-2xl font-bold">{orders.filter(o => o.status === 'Shipped').length}</div>
            <p className="text-xs text-muted-foreground">
              Updating in real-time
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
                <LiveRoutesMap orders={orders} selectedOrderId={selectedOrderId} />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Orders</CardTitle>
          <CardDescription>Live overview of incoming and in-transit orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <RealTimeOrders 
            orders={orders} 
            onOrderSelect={setSelectedOrderId} 
            selectedOrderId={selectedOrderId}
            onPayDue={handlePayment}
            />
        </CardContent>
      </Card>
    </div>
  );
}
