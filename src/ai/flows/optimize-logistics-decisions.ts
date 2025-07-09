// src/ai/flows/optimize-logistics-decisions.ts
'use server';

/**
 * @fileOverview Orchestrates processes for logistics optimization with human-in-the-loop exception handling.
 *
 * - optimizeLogisticsDecisions - Orchestrates logistics decisions using AI agents and human input.
 * - OptimizeLogisticsDecisionsInput - The input type for the optimizeLogisticsDecisions function.
 * - OptimizeLogisticsDecisionsOutput - The return type for the optimizeLogisticsDecisions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeLogisticsDecisionsInputSchema = z.object({
  shipmentDetails: z
    .string()
    .describe('Details about the shipment, including origin, destination, and contents.'),
  deliveryDeadline: z.string().describe('The date and time of the delivery deadline.'),
  availableRoutes: z
    .string()
    .describe('A description of the available routes, including distance, traffic, and tolls.'),
  currentConditions: z
    .string()
    .describe('Current conditions that may affect delivery, such as weather or road closures.'),
  exceptions: z.string().optional().describe('Any exceptions or special circumstances.'),
});
export type OptimizeLogisticsDecisionsInput = z.infer<typeof OptimizeLogisticsDecisionsInputSchema>;

const OptimizeLogisticsDecisionsOutputSchema = z.object({
  optimalRoute: z.string().describe('The recommended optimal route.'),
  estimatedArrivalTime: z.string().describe('The estimated arrival time for the optimal route.'),
  suggestedActions: z
    .string()
    .describe('Suggested actions for the logistics manager based on the analysis.'),
  reasoning: z.string().describe('The AI agent’s reasoning for the suggested route and actions.'),
  humanInTheLoopApprovalRequired: z
    .boolean()
    .describe('Indicates whether human approval is required for the suggested actions.'),
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
  prompt: `You are an AI logistics expert, responsible for optimizing delivery routes and actions.

  Analyze the following information to determine the optimal route, estimated arrival time, and suggest actions for the logistics manager.

  Shipment Details: {{{shipmentDetails}}}
  Delivery Deadline: {{{deliveryDeadline}}}
  Available Routes: {{{availableRoutes}}}
  Current Conditions: {{{currentConditions}}}
  Exceptions: {{{exceptions}}}

  Consider all factors and provide a clear reasoning for your suggestions.

  Finally, determine if human approval is required based on the criticality and potential impact of the decision.
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
