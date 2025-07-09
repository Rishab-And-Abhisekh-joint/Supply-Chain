"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const generateData = () => [
  { name: "Laptops", total: Math.floor(Math.random() * 2000) + 500 },
  { name: "Monitors", total: Math.floor(Math.random() * 2000) + 500 },
  { name: "Keyboards", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Mice", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Webcams", total: Math.floor(Math.random() * 3000) + 800 },
  { name: "Headsets", total: Math.floor(Math.random() * 4000) + 600 },
  { name: "Cables", total: Math.floor(Math.random() * 8000) + 2000 },
];

export default function InventoryChart() {
  const { theme } = useTheme();
  const [data, setData] = useState<ReturnType<typeof generateData>>([]);
  const [chartColors, setChartColors] = useState({
    primary: "",
    foreground: "",
    mutedForeground: "",
    card: "",
  });

  useEffect(() => {
    // This will only run on the client, after initial hydration
    setData(generateData());
  }, []);

  useEffect(() => {
    const style = getComputedStyle(document.body);
    setChartColors({
      primary: style.getPropertyValue("--primary"),
      foreground: style.getPropertyValue("--foreground"),
      mutedForeground: style.getPropertyValue("--muted-foreground"),
      card: style.getPropertyValue("--card"),
    });
  }, [theme]);

  if (!chartColors.primary || data.length === 0) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke={`hsl(${chartColors.mutedForeground})`}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke={`hsl(${chartColors.mutedForeground})`}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                    cursor={{ fill: `hsla(${chartColors.primary}, 0.1)` }}
                    contentStyle={{
                        backgroundColor: `hsl(${chartColors.card})`,
                        borderColor: `hsl(${chartColors.primary})`,
                        color: `hsl(${chartColors.foreground})`,
                    }}
                />
                <Bar dataKey="total" fill={`hsl(${chartColors.primary})`} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
