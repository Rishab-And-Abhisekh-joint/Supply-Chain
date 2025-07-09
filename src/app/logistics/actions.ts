"use server";

import { optimizeLogisticsDecisions, type OptimizeLogisticsDecisionsInput } from "@/ai/flows/optimize-logistics-decisions";
import { z } from "zod";

const formSchema = z.object({
  shipmentDetails: z.string().min(1, "Shipment details are required."),
  deliveryDeadline: z.string().min(1, "Delivery deadline is required."),
  availableRoutes: z.string().min(1, "Available routes are required."),
  currentConditions: z.string().min(1, "Current conditions are required."),
  exceptions: z.string().optional(),
});

export async function getLogisticsOptimization(values: z.infer<typeof formSchema>) {
  try {
    const validatedInput: OptimizeLogisticsDecisionsInput = formSchema.parse(values);
    const result = await optimizeLogisticsDecisions(validatedInput);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input." };
    }
    console.error("Error in getLogisticsOptimization:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
