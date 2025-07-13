
"use server";

import { predictProductDemand, type PredictProductDemandInput } from "@/ai/flows/predict-product-demand";
import { z } from "zod";

const formSchema = z.object({
  productName: z.string().min(1, "Product name is required."),
  historicalDataRange: z.coerce.number().int().positive("Historical data range is required."),
  forecastHorizon: z.coerce.number().int().positive("Forecast horizon must be a positive number."),
});

// Helper function to generate mock historical data
const generateHistoricalData = (months: number, productName: string): string => {
  let baseValue = 150;
  if (productName === 'Monitors') baseValue = 100;
  if (productName === 'Keyboards') baseValue = 300;
  
  const data = Array.from({ length: months }, (_, i) => {
    const seasonality = Math.sin((i / 12) * 2 * Math.PI) * 20; // Simple yearly seasonality
    const trend = i * 2; // Simple upward trend
    const noise = (Math.random() - 0.5) * 10;
    return Math.round(baseValue + trend + seasonality + noise);
  });
  return data.join(', ');
};

export async function getDemandForecast(values: z.infer<typeof formSchema>) {
  try {
    const validatedInput = formSchema.parse(values);
    
    const historicalData = generateHistoricalData(validatedInput.historicalDataRange, validatedInput.productName);

    const aiInput: PredictProductDemandInput = {
        productName: validatedInput.productName,
        historicalData,
        forecastHorizon: validatedInput.forecastHorizon
    }
    
    const result = await predictProductDemand(aiInput);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input." };
    }
    console.error("Error in getDemandForecast:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
