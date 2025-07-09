"use server";

import { predictProductDemand, type PredictProductDemandInput } from "@/ai/flows/predict-product-demand";
import { z } from "zod";

const formSchema = z.object({
  productName: z.string().min(1, "Product name is required."),
  historicalData: z.string().min(1, "Historical data is required."),
  forecastHorizon: z.coerce.number().int().positive("Forecast horizon must be a positive number."),
});

export async function getDemandForecast(values: z.infer<typeof formSchema>) {
  try {
    const validatedInput: PredictProductDemandInput = formSchema.parse(values);
    const result = await predictProductDemand(validatedInput);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input." };
    }
    console.error("Error in getDemandForecast:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
