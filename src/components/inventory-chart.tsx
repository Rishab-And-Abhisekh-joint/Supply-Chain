
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LabelList, type TooltipProps } from "recharts";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";

const CRITICAL_THRESHOLD = 10; // For single-item customer view
const ADMIN_CRITICAL_THRESHOLD = 1000; // For multi-warehouse admin view

export interface WarehouseStock {
    name: string;
    total: number;
    previous: number;
}

export interface InventoryData {
  name: string;
  warehouses: WarehouseStock[];
}

interface InventoryChartProps {
    data: InventoryData[];
    view: 'admin' | 'customer';
}

const CustomerTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        const data: { name: string; total: number; previous: number } = payload[0].payload;
        const change = data.total - data.previous;
        const percentageChange = data.previous === 0 ? 0 : (change / data.previous) * 100;
        const changeColor = change >= 0 ? 'text-green-500' : 'text-red-500';
        const ChangeIcon = change >= 0 ? TrendingUp : TrendingDown;
        
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <div className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
                    <span className="font-bold text-foreground">{data.total.toLocaleString()} units</span>
                    <div className={`flex items-center text-xs ${changeColor}`}>
                        <ChangeIcon className="mr-1 h-3 w-3" />
                        <span>{change.toLocaleString()} ({percentageChange.toFixed(2)}%)</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const AdminTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        const data: { name: string; warehouses: WarehouseStock[] } = payload[0].payload;
        
        return (
            <div className="rounded-lg border bg-background p-3 shadow-sm min-w-[200px]">
                <div className="mb-2">
                    <span className="text-sm font-bold uppercase text-foreground">{label}</span>
                    <p className="text-xs text-muted-foreground">Warehouse Breakdown</p>
                </div>
                <div className="space-y-1">
                    {data.warehouses.map(w => {
                        const change = w.total - w.previous;
                        const changeColor = change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-muted-foreground';
                        const changePrefix = change > 0 ? '+' : '';
                        const ChangeIcon = change >= 0 ? TrendingUp : TrendingDown;

                        return (
                            <div key={w.name} className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">{w.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">{w.total.toLocaleString()}</span>
                                    <div className={`flex items-center ${changeColor}`}>
                                         {change !== 0 && <ChangeIcon className="h-3 w-3 mr-1" />}
                                         <span>{changePrefix}{change}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }
    return null;
};

const CustomizedLabel = (props: any) => {
    const { x, y, width, value, view, dataKey } = props;
    const item = props.payload;
    const total = item.warehouses.reduce((sum: number, w: WarehouseStock) => sum + w.total, 0);

    const threshold = view === 'admin' ? ADMIN_CRITICAL_THRESHOLD : CRITICAL_THRESHOLD;

    if (total < threshold) {
        return (
            <g>
                <AlertTriangle 
                    x={x + width / 2 - 8} 
                    y={y - 20} 
                    width={16} 
                    height={16} 
                    className="text-amber-500 dark:text-amber-400"
                />
            </g>
        );
    }
    return null;
};

export default function InventoryChart({ data, view }: InventoryChartProps) {
  const { theme } = useTheme();
  const [chartColors, setChartColors] = useState({
    primary: "",
    foreground: "",
    mutedForeground: "",
    card: "",
    red: "hsl(0 72% 51%)",
    green: "hsl(142 71% 45%)",
    yellow: "hsl(48 96% 53%)",
  });

  useEffect(() => {
    const style = getComputedStyle(document.body);
    setChartColors(prev => ({
        ...prev,
        primary: `hsl(${style.getPropertyValue("--primary")})`,
        foreground: `hsl(${style.getPropertyValue("--foreground")})`,
        mutedForeground: `hsl(${style.getPropertyValue("--muted-foreground")})`,
        card: `hsl(${style.getPropertyValue("--card")})`,
    }));
  }, [theme]);
  
  const chartData = data.map(item => {
    const total = item.warehouses.reduce((sum, w) => sum + w.total, 0);
    const previous = item.warehouses.reduce((sum, w) => sum + w.previous, 0);
    return {
      name: item.name,
      total,
      previous,
      warehouses: item.warehouses,
    };
  });

  if (!chartColors.primary || data.length === 0) {
    return <Skeleton className="h-[300px] w-full" />;
  }
  
  const getBarColor = (item: typeof chartData[0]) => {
    const threshold = view === 'admin' ? ADMIN_CRITICAL_THRESHOLD : CRITICAL_THRESHOLD;
    if (item.total < threshold) {
      return chartColors.yellow;
    }
    if (item.total > item.previous) {
      return chartColors.green;
    }
    if (item.total < item.previous) {
      return chartColors.red;
    }
    return chartColors.primary;
  };

  const TooltipComponent = view === 'admin' ? AdminTooltip : CustomerTooltip;

  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 25, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                    dataKey="name"
                    stroke={chartColors.mutedForeground}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke={chartColors.mutedForeground}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                    cursor={{ fill: 'hsla(var(--primary), 0.1)' }}
                    content={<TooltipComponent />}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                   {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                    ))}
                    <LabelList dataKey="total" content={<CustomizedLabel view={view} />} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
