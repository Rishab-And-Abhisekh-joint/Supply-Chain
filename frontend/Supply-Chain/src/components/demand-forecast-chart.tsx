"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PredictProductDemandOutput } from '@/ai/flows/predict-product-demand';
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Skeleton } from './ui/skeleton';

interface DemandForecastChartProps {
  forecastData: PredictProductDemandOutput;
}

export default function DemandForecastChart({ forecastData }: DemandForecastChartProps) {
  const { theme } = useTheme();
  const [chartColors, setChartColors] = useState({
      primary: "",
      accent: "",
      foreground: "",
      mutedForeground: "",
      card: "",
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const style = getComputedStyle(document.body);
      setChartColors({
          primary: style.getPropertyValue("--primary"),
          accent: style.getPropertyValue("--accent"),
          foreground: style.getPropertyValue("--foreground"),
          mutedForeground: style.getPropertyValue("--muted-foreground"),
          card: style.getPropertyValue("--card"),
      });
    }
  }, [theme]);


  const chartData = forecastData.forecastedDemand.map((demand, index) => ({
    period: `P${index + 1}`,
    demand,
    confidence: [
      forecastData.confidenceIntervals[index].lowerBound,
      forecastData.confidenceIntervals[index].upperBound
    ],
  }));

  if (!chartColors.primary) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
            <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke={`hsla(${chartColors.mutedForeground}, 0.2)`} />
                <XAxis dataKey="period" stroke={`hsl(${chartColors.mutedForeground})`} fontSize={12} />
                <YAxis stroke={`hsl(${chartColors.mutedForeground})`} fontSize={12} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: `hsl(${chartColors.card})`,
                        borderColor: `hsl(${chartColors.primary})`,
                        color: `hsl(${chartColors.foreground})`,
                    }}
                />
                <Legend />
                <Line type="monotone" dataKey="demand" stroke={`hsl(${chartColors.primary})`} strokeWidth={2} name="Forecasted Demand" />
                <Line type="monotone" dataKey="confidence[0]" stroke={`hsla(${chartColors.accent})`} strokeWidth={1} strokeDasharray="5 5" name="Lower Confidence" dot={false} />
                <Line type="monotone" dataKey="confidence[1]" stroke={`hsla(${chartColors.accent})`} strokeWidth={1} strokeDasharray="5 5" name="Upper Confidence" dot={false} />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
}
