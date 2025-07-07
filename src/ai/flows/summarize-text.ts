'use server';

/**
 * @fileOverview A text summarization AI agent.
 *
 * - summarizeText - A function that handles the text summarization process.
 * - SummarizeTextInput - The input type for the summarizeText function.
 * - SummarizeTextOutput - The return type for the summarizeText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTextInputSchema = z.object({
  text: z.string().describe('The text to summarize.'),
  length: z
    .enum(['short', 'medium', 'long'])
    .default('medium')
    .describe('The desired length of the summary.'),
  focus:
    z
      .enum(['informative', 'critical', 'narrative', 'technical'])
      .default('informative')
      .describe('The focus of the summary.'),
  format: z
    .enum(['list', 'paragraph', 'mixed'])
    .default('paragraph')
    .describe('The desired format of the summary.'),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

const SummarizeTextOutputSchema = z.object({
  summary: z.string().describe('The generated summary of the text.'),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

export async function summarizeText(input: SummarizeTextInput): Promise<SummarizeTextOutput> {
  return summarizeTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: {schema: SummarizeTextInputSchema},
  output: {schema: SummarizeTextOutputSchema},
  prompt: `Eres un experto resumidor, capaz de crear resúmenes de diversas longitudes y enfoques.

  Resume el siguiente texto en español, con la longitud, el enfoque y el formato especificados.

  Texto: {{{text}}}

  Longitud: {{{length}}}
  Enfoque: {{{focus}}}
  Formato: {{{format}}}
  `,
});

const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
