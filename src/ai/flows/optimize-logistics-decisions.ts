// src/ai/flows/optimize-logistics-decisions.ts
'use server';

/**
 * @fileOverview Orchestrates processes for logistics optimization.
 *
 * - optimizeLogisticsDecisions - Orchestrates logistics decisions using AI to find the best route.
 * - OptimizeLogisticsDecisionsInput - The input type for the optimizeLogisticsDecisions function.
 * - OptimizeLogisticsDecisionsOutput - The return type for the optimizeLogisticsDecisions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeLogisticsDecisionsInputSchema = z.object({
  origin: z.string().describe('The starting address for the delivery route.'),
  destination: z.string().describe('The ending address for the delivery route.'),
});
export type OptimizeLogisticsDecisionsInput = z.infer<typeof OptimizeLogisticsDecisionsInputSchema>;

const OptimizeLogisticsDecisionsOutputSchema = z.object({
  optimalRouteSummary: z.string().describe('A summary of the recommended optimal route, including key landmarks and turns.'),
  estimatedTime: z.string().describe('The estimated travel time for the optimal route.'),
  estimatedDistance: z.string().describe('The estimated travel distance for the optimal route.'),
  reasoning: z.string().describe('The AI agent’s reasoning for choosing this route, considering factors like traffic and efficiency.'),
});
export type OptimizeLogisticsDecisionsOutput = z.infer<typeof OptimizeLogisticsDecisionsOutputSchema>;

export async function optimizeLogisticsDecisions(
  input: OptimizeLogisticsDecisionsInput
): Promise<OptimizeLogisticsDecisionsOutput> {
  return optimizeLogisticsDecisionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeLogisticsDecisionsPrompt',
  input: {schema: OptimizeLogisticsDecisionsInputSchema},
  output: {schema: OptimizeLogisticsDecisionsOutputSchema},
  prompt: `You are an AI logistics expert, responsible for optimizing delivery routes.

  Your task is to determine the most efficient route between the given origin and destination.

  Origin: {{{origin}}}
  Destination: {{{destination}}}

  Analyze the route considering current traffic conditions, road closures, and overall efficiency. Provide a summary of the route, the estimated time and distance, and a clear reasoning for your choice.
  `,
});

const optimizeLogisticsDecisionsFlow = ai.defineFlow(
  {
    name: 'optimizeLogisticsDecisionsFlow',
    inputSchema: OptimizeLogisticsDecisionsInputSchema,
    outputSchema: OptimizeLogisticsDecisionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
