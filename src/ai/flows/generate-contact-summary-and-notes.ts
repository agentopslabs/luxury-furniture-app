'use server';
/**
 * @fileOverview A Genkit flow that analyzes a contact's appointment history
 * to generate a concise executive summary and suggested contact notes.
 *
 * - generateContactSummaryAndNotes - A function that orchestrates the AI generation.
 * - GenerateContactSummaryAndNotesInput - The input type for the generateContactSummaryAndNotes function.
 * - GenerateContactSummaryAndNotesOutput - The return type for the generateContactSummaryAndNotes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateContactSummaryAndNotesInputSchema = z.object({
  contactName: z.string().describe('The full name of the contact.'),
  appointmentHistory: z.array(
    z.object({
      date: z.string().describe('The date of the appointment in a readable format (e.g., YYYY-MM-DD).'),
      summary: z.string().describe('A brief summary of the appointment outcome or discussion.'),
    })
  ).describe('A chronological list of the contact\'s past appointments, each with a date and a summary.'),
});
export type GenerateContactSummaryAndNotesInput = z.infer<typeof GenerateContactSummaryAndNotesInputSchema>;

const GenerateContactSummaryAndNotesOutputSchema = z.object({
  executiveSummary: z.string().describe('A concise executive summary of the contact\'s engagement and key interactions based on their appointment history.'),
  suggestedNotes: z.string().describe('Bullet-point suggested contact notes based on the appointment history, suitable for adding to a CRM record to maintain accurate and up-to-date information.'),
});
export type GenerateContactSummaryAndNotesOutput = z.infer<typeof GenerateContactSummaryAndNotesOutputSchema>;

/**
 * Generates an executive summary and suggested contact notes based on a contact's appointment history.
 *
 * @param input - The input containing the contact's name and appointment history.
 * @returns An object with an executive summary and suggested notes.
 */
export async function generateContactSummaryAndNotes(
  input: GenerateContactSummaryAndNotesInput
): Promise<GenerateContactSummaryAndNotesOutput> {
  return generateContactSummaryAndNotesFlow(input);
}

const generateContactSummaryAndNotesPrompt = ai.definePrompt({
  name: 'generateContactSummaryAndNotesPrompt',
  input: { schema: GenerateContactSummaryAndNotesInputSchema },
  output: { schema: GenerateContactSummaryAndNotesOutputSchema },
  prompt: `You are an AI assistant designed to help CRM users quickly understand contact engagement and maintain accurate records.
Your task is to analyze the provided appointment history for a contact and generate a concise executive summary of their overall engagement and bullet-point suggested contact notes.

Contact Name: {{{contactName}}}

Appointment History:
{{#if appointmentHistory}}
  {{#each appointmentHistory}}
    - Date: {{{date}}}
      Summary: {{{summary}}}
  {{/each}}
{{else}}
  No appointment history available.
{{/if}}

Please generate a JSON object with two fields: 'executiveSummary' and 'suggestedNotes'.
The 'executiveSummary' should be a concise overview of the contact's engagement.
The 'suggestedNotes' should be bullet points summarizing key interactions and suitable for CRM record keeping.
`,
});

const generateContactSummaryAndNotesFlow = ai.defineFlow(
  {
    name: 'generateContactSummaryAndNotesFlow',
    inputSchema: GenerateContactSummaryAndNotesInputSchema,
    outputSchema: GenerateContactSummaryAndNotesOutputSchema,
  },
  async (input) => {
    const { output } = await generateContactSummaryAndNotesPrompt(input);
    return output!;
  }
);
