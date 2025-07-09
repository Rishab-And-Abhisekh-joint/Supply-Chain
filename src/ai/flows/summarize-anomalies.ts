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
  summary: z.string().describe('A concise summary of anomalies in the event stream.'),
  suggestedActions: z
    .string()
    .describe('Suggested actions to address the identified anomalies.'),
});
export type SummarizeAnomaliesOutput = z.infer<typeof SummarizeAnomaliesOutputSchema>;

export async function summarizeAnomalies(input: SummarizeAnomaliesInput): Promise<SummarizeAnomaliesOutput> {
  return summarizeAnomaliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAnomaliesPrompt',
  input: {schema: SummarizeAnomaliesInputSchema},
  output: {schema: SummarizeAnomaliesOutputSchema},
  prompt: `You are a supply chain analyst. Summarize the following event stream, highlight any anomalies, and suggest actions to address them.\n\nEvent Stream:\n{{eventStream}}`,
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
