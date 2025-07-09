"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useTheme } from "next-themes";
import { useMemo } from "react";

const data = [
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
  const colors = useMemo(() => {
    const style = getComputedStyle(document.body);
    return {
      primary: style.getPropertyValue("--primary"),
      foreground: style.getPropertyValue("--foreground"),
      mutedForeground: style.getPropertyValue("--muted-foreground"),
      card: style.getPropertyValue("--card"),
    };
  }, [theme]);

  if (!colors.primary) return null;

  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke={`hsl(${colors.mutedForeground})`}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke={`hsl(${colors.mutedForeground})`}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                    cursor={{ fill: `hsla(${colors.primary}, 0.1)` }}
                    contentStyle={{
                        backgroundColor: `hsl(${colors.card})`,
                        borderColor: `hsl(${colors.primary})`,
                        color: `hsl(${colors.foreground})`,
                    }}
                />
                <Bar dataKey="total" fill={`hsl(${colors.primary})`} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
