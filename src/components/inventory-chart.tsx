
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LabelList, type TooltipProps } from "recharts";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";

const CRITICAL_THRESHOLD = 1000;

export interface InventoryData {
  name: string;
  total: number;
  previous: number;
}

interface InventoryChartProps {
    data: InventoryData[];
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        const data: InventoryData = payload[0].payload;
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

const CustomizedLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value < CRITICAL_THRESHOLD) {
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


export default function InventoryChart({ data }: InventoryChartProps) {
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

  if (!chartColors.primary || data.length === 0) {
    return <Skeleton className="h-[300px] w-full" />;
  }
  
  const getBarColor = (item: InventoryData) => {
    if (item.total < CRITICAL_THRESHOLD) {
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

  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 25, right: 10, left: 0, bottom: 0 }}>
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
                    content={<CustomTooltip />}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                   {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                    ))}
                    <LabelList dataKey="total" content={<CustomizedLabel />} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
