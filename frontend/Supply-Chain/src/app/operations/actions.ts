"use server";

import { summarizeAnomalies, type SummarizeAnomaliesInput } from "@/ai/flows/summarize-anomalies";
import { z } from "zod";

const formSchema = z.object({
  eventStream: z.string().min(1, "Event stream cannot be empty."),
});

export async function getAnomalySummary(values: z.infer<typeof formSchema>) {
  try {
    const validatedInput: SummarizeAnomaliesInput = formSchema.parse(values);
    const result = await summarizeAnomalies(validatedInput);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input." };
    }
    console.error("Error in getAnomalySummary:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
