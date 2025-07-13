
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const CRITICAL_THRESHOLD = 1000;

export interface InventoryData {
  name: string;
  total: number;
  previous: number;
}

interface InventoryChartProps {
    data: InventoryData[];
}

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
            <BarChart data={data}>
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
                    cursor={{ fill: `hsla(${chartColors.primary}, 0.1)` }}
                    contentStyle={{
                        backgroundColor: chartColors.card,
                        borderColor: chartColors.primary,
                        color: chartColors.foreground,
                    }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                   {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
