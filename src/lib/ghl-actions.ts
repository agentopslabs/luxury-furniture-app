'use server';

/**
 * @fileOverview Secure server actions for LeadConnector V2 API.
 * Handles live synchronization for Contacts, Appointments, Conversations, and Pipelines.
 */

import { GHLContact, GHLAppointment, GHLCalendar, GHLConversation, GHLPipeline, GHLOpportunity } from './ghl';

const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_ACCESS_TOKEN = 'pit-fde7a892-d292-4304-8a9d-a9ffe205ec78';
const GHL_LOCATION_ID = 'nBYJTjYbHTIsJGiqT0W4';

const headers = {
  'Authorization': `Bearer ${GHL_ACCESS_TOKEN}`,
  'Version': '2021-07-28',
  'Content-Type': 'application/json',
};

// --- CONTACTS ---

export async function getContacts(limit: number = 50): Promise<GHLContact[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/contacts`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    if (!response.ok) return [];
    const data = await response.json();
    return data.contacts || [];
  } catch (error) {
    return [];
  }
}

export async function updateContact(id: string, contactData: Partial<GHLContact>): Promise<GHLContact> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/contacts/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(contactData),
    });
    const data = await response.json();
    return data.contact;
  } catch (error) {
    throw new Error('Failed to update contact in GHL');
  }
}

export async function deleteContact(id: string): Promise<void> {
  try {
    await fetch(`${GHL_API_BASE_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers,
    });
  } catch (error) {
    throw new Error('Failed to delete contact in GHL');
  }
}

// --- APPOINTMENTS ---

export async function getAllAppointments(): Promise<GHLAppointment[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/appointments`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    
    // GHL V2 requires numeric timestamps (ms) for filters
    const now = new Date();
    const startTime = now.getTime() - (30 * 24 * 60 * 60 * 1000); // Past 30 days
    const endTime = now.getTime() + (90 * 24 * 60 * 60 * 1000);  // Next 90 days
    
    url.searchParams.append('startTime', startTime.toString());
    url.searchParams.append('endTime', endTime.toString());

    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.appointments || []).sort((a: any, b: any) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  } catch (error) {
    return [];
  }
}

export async function updateAppointmentStatus(id: string, status: string): Promise<void> {
  try {
    await fetch(`${GHL_API_BASE_URL}/appointments/${id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    throw new Error('Failed to update appointment status in GHL');
  }
}

export async function getCalendars(): Promise<GHLCalendar[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/calendars`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    const response = await fetch(url.toString(), { headers });
    const data = await response.json();
    return data.calendars || [];
  } catch (error) {
    return [];
  }
}

// --- CONVERSATIONS ---

export async function getConversations(): Promise<GHLConversation[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/conversations/search`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', '50');

    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    if (!response.ok) return [];
    const data = await response.json();
    return data.conversations || [];
  } catch (error) {
    return [];
  }
}

export async function sendMessage(conversationId: string, body: string, type: 'email' | 'sms' = 'sms'): Promise<void> {
  try {
    await fetch(`${GHL_API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type,
        body,
        locationId: GHL_LOCATION_ID,
      }),
    });
  } catch (error) {
    throw new Error('Failed to send message via GHL');
  }
}

// --- PIPELINES & OPPORTUNITIES ---

export async function getPipelines(): Promise<GHLPipeline[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/opportunities/pipelines`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    const response = await fetch(url.toString(), { headers });
    const data = await response.json();
    return data.pipelines || [];
  } catch (error) {
    return [];
  }
}

export async function getOpportunities(): Promise<GHLOpportunity[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/opportunities/search`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', '50');
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    if (!response.ok) {
      const errorText = await response.text();
      return [];
    }
    const data = await response.json();
    return data.opportunities || [];
  } catch (error) {
    return [];
  }
}

export async function updateOpportunityStatus(id: string, status: string): Promise<void> {
  try {
    await fetch(`${GHL_API_BASE_URL}/opportunities/${id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    throw new Error('Failed to update opportunity status in GHL');
  }
}
