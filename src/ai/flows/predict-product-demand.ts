'use server';

/**
 * @fileOverview A product demand prediction AI agent.
 *
 * - predictProductDemand - A function that handles the product demand prediction process.
 * - PredictProductDemandInput - The input type for the predictProductDemand function.
 * - PredictProductDemandOutput - The return type for the predictProductDemand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictProductDemandInputSchema = z.object({
  productName: z.string().describe('The name of the product to forecast demand for.'),
  historicalData: z.string().describe('Historical sales data for the product, as a comma-separated list of values.'),
  forecastHorizon: z.number().describe('The number of periods (e.g., days, weeks, months) to forecast into the future.'),
});
export type PredictProductDemandInput = z.infer<typeof PredictProductDemandInputSchema>;

const PredictProductDemandOutputSchema = z.object({
  forecastedDemand: z.array(z.number()).describe('An array of forecasted demand values for each period in the forecast horizon.'),
  modelAccuracy: z.number().describe('A measure of the accuracy of the SARIMAX model used for forecasting (e.g., Mean Absolute Percentage Error).'),
  confidenceIntervals: z.array(z.object({
    lowerBound: z.number(),
    upperBound: z.number(),
  })).describe('Confidence intervals for the forecasted demand values.'),
});
export type PredictProductDemandOutput = z.infer<typeof PredictProductDemandOutputSchema>;

export async function predictProductDemand(input: PredictProductDemandInput): Promise<PredictProductDemandOutput> {
  return predictProductDemandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictProductDemandPrompt',
  input: {schema: PredictProductDemandInputSchema},
  output: {schema: PredictProductDemandOutputSchema},
  prompt: `You are an expert inventory analyst. You are tasked with forecasting demand for a given product using historical sales data and SARIMAX models.

Product Name: {{{productName}}}
Historical Data: {{{historicalData}}}
Forecast Horizon: {{{forecastHorizon}}}

Analyze the historical data, train a SARIMAX model, and forecast demand for the specified forecast horizon.  Also, provide the model accuracy and confidence intervals for the forecasted demand values.

Ensure the output is a valid JSON object conforming to the PredictProductDemandOutputSchema schema.`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const predictProductDemandFlow = ai.defineFlow(
  {
    name: 'predictProductDemandFlow',
    inputSchema: PredictProductDemandInputSchema,
    outputSchema: PredictProductDemandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
