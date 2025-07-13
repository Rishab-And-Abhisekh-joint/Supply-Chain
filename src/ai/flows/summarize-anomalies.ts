'use server';
/**
 * @fileOverview Summarizes real-time event streams to highlight anomalies and suggest actions.
 *
 * - summarizeAnomalies - A function that takes event streams as input and returns a concise summary.
 * - SummarizeAnomaliesInput - The input type for the summarizeAnomalies function.
 * - SummarizeAnomaliesOutput - The return type for the summarizeAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAnomaliesInputSchema = z.object({
  eventStream: z
    .string()
    .describe(
      'A stream of events in the supply chain, formatted as a single string.'
    ),
});
export type SummarizeAnomaliesInput = z.infer<typeof SummarizeAnomaliesInputSchema>;

const SummarizeAnomaliesOutputSchema = z.object({
  anomalies: z.array(z.object({
      summary: z.string().describe('A concise summary of a single identified anomaly.'),
      suggestedAction: z.string().describe('The suggested action to address this specific anomaly.'),
  })).describe('A list of identified anomalies, each with a summary and a suggested action.'),
});
export type SummarizeAnomaliesOutput = z.infer<typeof SummarizeAnomaliesOutputSchema>;

export async function summarizeAnomalies(input: SummarizeAnomaliesInput): Promise<SummarizeAnomaliesOutput> {
  return summarizeAnomaliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAnomaliesPrompt',
  input: {schema: SummarizeAnomaliesInputSchema},
  output: {schema: SummarizeAnomaliesOutputSchema},
  prompt: `You are a supply chain analyst. Analyze the following event stream. For each anomaly you identify, provide a concise summary of the issue and a specific, scannable, and actionable suggested action to address it. Structure your response as a list of anomalies.

Event Stream:
{{eventStream}}`,
});

const summarizeAnomaliesFlow = ai.defineFlow(
  {
    name: 'summarizeAnomaliesFlow',
    inputSchema: SummarizeAnomaliesInputSchema,
    outputSchema: SummarizeAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
