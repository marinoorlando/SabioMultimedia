'use server';

/**
 * @fileOverview A flow for generating detailed image prompts.
 *
 * - generateImagePrompt - A function that creates a detailed image prompt from a basic description.
 * - GenerateImagePromptInput - The input type for the generateImagePrompt function.
 * - GenerateImagePromptOutput - The return type for the generateImagePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImagePromptInputSchema = z.object({
  description: z.string().describe('A basic description of the desired image.'),
});
export type GenerateImagePromptInput = z.infer<typeof GenerateImagePromptInputSchema>;

const GenerateImagePromptOutputSchema = z.object({
  imagePrompt: z.string().describe('A detailed, descriptive prompt for an image generator, in English.'),
});
export type GenerateImagePromptOutput = z.infer<typeof GenerateImagePromptOutputSchema>;

export async function generateImagePrompt(input: GenerateImagePromptInput): Promise<GenerateImagePromptOutput> {
  return generateImagePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImagePrompt',
  input: {schema: GenerateImagePromptInputSchema},
  output: {schema: GenerateImagePromptOutputSchema},
  prompt: `You are an expert prompt engineer for AI image generators like Midjourney or DALL-E.
Your task is to take a simple description and transform it into a rich, detailed, and evocative prompt in English.
The prompt should include details about the subject, setting, lighting, style, and composition to generate a high-quality, visually appealing image.

Simple Description: {{{description}}}

Generate a detailed image prompt based on the description provided. The output must be in English.
`,
});

const generateImagePromptFlow = ai.defineFlow(
  {
    name: 'generateImagePromptFlow',
    inputSchema: GenerateImagePromptInputSchema,
    outputSchema: GenerateImagePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
