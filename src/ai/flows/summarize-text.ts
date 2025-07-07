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
  prompt: `You are an expert summarizer, able to create summaries of varying lengths and focuses.

  Summarize the following text in the specified length, focus, and format.

  Text: {{{text}}}

  Length: {{{length}}}
  Focus: {{{focus}}}
  Format: {{{format}}}
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

