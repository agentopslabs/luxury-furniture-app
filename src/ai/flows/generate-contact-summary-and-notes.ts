
'use server';
/**
 * @fileOverview A Genkit flow that analyzes contact activities (Appointment Booked, New Lead, Message Sent)
 * to generate a concise executive summary and suggested contact notes.
 *
 * - generateContactSummaryAndNotes - A function that orchestrates the AI generation.
 * - GenerateContactSummaryAndNotesInput - The input type for the generateContactSummaryAndNotes function.
 * - GenerateContactSummaryAndNotesOutput - The return type for the generateContactSummaryAndNotes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ActivityTypeSchema = z.enum(['appointment_booked', 'new_lead', 'message_sent']);
export type ActivityType = z.infer<typeof ActivityTypeSchema>;

const ActivitySchema = z.object({
  type: ActivityTypeSchema.describe('The specific type of activity (Appointment Booked, New Lead, or Message Sent).'),
  date: z.string().describe('The date of the activity.'),
  description: z.string().describe('Brief details about the activity.'),
});

const GenerateContactSummaryAndNotesInputSchema = z.object({
  contactName: z.string().describe('The full name of the contact.'),
  activities: z.array(ActivitySchema).describe('A list of activities for analysis.'),
});
export type GenerateContactSummaryAndNotesInput = z.infer<typeof GenerateContactSummaryAndNotesInputSchema>;

const GenerateContactSummaryAndNotesOutputSchema = z.object({
  executiveSummary: z.string().describe('A concise executive summary focus on the engagement markers (Leads, Bookings, Messages).'),
  suggestedNotes: z.string().describe('Bullet-point suggested contact notes based on these markers.'),
});
export type GenerateContactSummaryAndNotesOutput = z.infer<typeof GenerateContactSummaryAndNotesOutputSchema>;

export async function generateContactSummaryAndNotes(
  input: GenerateContactSummaryAndNotesInput
): Promise<GenerateContactSummaryAndNotesOutput> {
  return generateContactSummaryAndNotesFlow(input);
}

const generateContactSummaryAndNotesPrompt = ai.definePrompt({
  name: 'generateContactSummaryAndNotesPrompt',
  input: { schema: GenerateContactSummaryAndNotesInputSchema },
  output: { schema: GenerateContactSummaryAndNotesOutputSchema },
  prompt: `You are an AI assistant designed to help CRM users quickly understand contact engagement.
Analyze the provided activity history for a contact. Focus on these three engagement types: Appointment Booked, New Lead, and Message Sent.

Contact Name: {{{contactName}}}

Activities:
{{#if activities}}
  {{#each activities}}
    - [{{{type}}}] Date: {{{date}}}
      Details: {{{description}}}
  {{/each}}
{{else}}
  No categorized activities available for analysis.
{{/if}}

Please generate a JSON object with 'executiveSummary' and 'suggestedNotes'.
Focus on the significance of their lead status, booking frequency, and messaging interaction level.
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
