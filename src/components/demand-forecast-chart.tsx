"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PredictProductDemandOutput } from '@/ai/flows/predict-product-demand';
import { useTheme } from "next-themes";
import { useMemo } from "react";

interface DemandForecastChartProps {
  forecastData: PredictProductDemandOutput;
}

export default function DemandForecastChart({ forecastData }: DemandForecastChartProps) {
  const { theme } = useTheme();
  const colors = useMemo(() => {
    const style = getComputedStyle(document.body);
    return {
      primary: style.getPropertyValue("--primary"),
      accent: style.getPropertyValue("--accent"),
      foreground: style.getPropertyValue("--foreground"),
      mutedForeground: style.getPropertyValue("--muted-foreground"),
      card: style.getPropertyValue("--card"),
    };
  }, [theme]);

  const chartData = forecastData.forecastedDemand.map((demand, index) => ({
    period: `P${index + 1}`,
    demand,
    confidence: [
      forecastData.confidenceIntervals[index].lowerBound,
      forecastData.confidenceIntervals[index].upperBound
    ],
  }));

  if (!colors.primary) return null;

  return (
    <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
            <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke={`hsla(${colors.mutedForeground}, 0.2)`} />
                <XAxis dataKey="period" stroke={`hsl(${colors.mutedForeground})`} fontSize={12} />
                <YAxis stroke={`hsl(${colors.mutedForeground})`} fontSize={12} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: `hsl(${colors.card})`,
                        borderColor: `hsl(${colors.primary})`,
                        color: `hsl(${colors.foreground})`,
                    }}
                />
                <Legend />
                <Line type="monotone" dataKey="demand" stroke={`hsl(${colors.primary})`} strokeWidth={2} name="Forecasted Demand" />
                <Line type="monotone" dataKey="confidence[0]" stroke={`hsla(${colors.accent})`} strokeWidth={1} strokeDasharray="5 5" name="Lower Confidence" dot={false} />
                <Line type="monotone" dataKey="confidence[1]" stroke={`hsla(${colors.accent})`} strokeWidth={1} strokeDasharray="5 5" name="Upper Confidence" dot={false} />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
}
