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

/**
 * Helper to safely handle fetch responses
 */
async function handleResponse(response: Response, defaultError: string) {
  if (!response.ok) {
    let message = defaultError;
    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch (e) {
      message = `${response.status} ${response.statusText}`;
    }
    throw new Error(message);
  }
  
  try {
    return await response.json();
  } catch (e) {
    // For successful responses that might be empty
    if (response.status === 204) return null;
    throw new Error('Server returned an invalid response format.');
  }
}

// --- CONTACTS ---

export async function getContacts(limit: number = 50): Promise<GHLContact[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/contacts`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'Failed to fetch contacts');
    return data?.contacts || [];
  } catch (error) {
    console.error('getContacts error:', error);
    return [];
  }
}

export async function searchContacts(query: string = ""): Promise<GHLContact[]> {
  try {
    if (query) {
      const searchUrl = new URL(`${GHL_API_BASE_URL}/contacts/search`);
      searchUrl.searchParams.append('locationId', GHL_LOCATION_ID);
      searchUrl.searchParams.append('query', query);
      const response = await fetch(searchUrl.toString(), { headers, next: { revalidate: 0 } });
      const data = await handleResponse(response, 'Search failed');
      return data?.contacts || [];
    }
    return getContacts(20);
  } catch (error) {
    return [];
  }
}

export async function createContact(contactData: Partial<GHLContact>): Promise<GHLContact> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...contactData,
        locationId: GHL_LOCATION_ID,
      }),
    });
    const data = await handleResponse(response, 'Failed to create contact');
    return data.contact;
  } catch (error: any) {
    throw new Error(error.message || 'Could not create contact in GHL');
  }
}

export async function updateContact(id: string, contactData: Partial<GHLContact>): Promise<GHLContact> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/contacts/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(contactData),
    });
    const data = await handleResponse(response, 'Failed to update contact');
    return data.contact;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update contact in GHL');
  }
}

export async function deleteContact(id: string): Promise<void> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers,
    });
    await handleResponse(response, 'Failed to delete contact');
  } catch (error) {
    throw new Error('Failed to delete contact in GHL');
  }
}

// --- APPOINTMENTS ---

export async function getAllAppointments(): Promise<GHLAppointment[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/appointments`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    
    const now = new Date();
    const startTime = now.getTime() - (30 * 24 * 60 * 60 * 1000); 
    const endTime = now.getTime() + (90 * 24 * 60 * 60 * 1000);  
    
    url.searchParams.append('startTime', startTime.toString());
    url.searchParams.append('endTime', endTime.toString());

    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'Failed to fetch appointments');
    return (data?.appointments || []).sort((a: any, b: any) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  } catch (error) {
    return [];
  }
}

export async function createAppointment(apptData: {
  calendarId: string;
  contactId: string;
  startTime: string; 
  title: string;
}): Promise<GHLAppointment> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...apptData,
        locationId: GHL_LOCATION_ID,
      }),
    });
    const data = await handleResponse(response, 'Failed to book appointment');
    return data.appointment;
  } catch (error: any) {
    throw new Error(error.message || 'Could not sync appointment with GHL backend');
  }
}

export async function updateAppointmentStatus(id: string, status: string): Promise<void> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/appointments/${id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    });
    await handleResponse(response, 'Failed to update status');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update appointment status in GHL');
  }
}

export async function getCalendars(): Promise<GHLCalendar[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/calendars`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    const response = await fetch(url.toString(), { headers });
    const data = await handleResponse(response, 'Failed to fetch calendars');
    return data?.calendars || [];
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
    const data = await handleResponse(response, 'Failed to fetch conversations');
    return data?.conversations || [];
  } catch (error) {
    return [];
  }
}

export async function sendMessage(conversationId: string, body: string, type: 'email' | 'sms' = 'sms'): Promise<void> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type,
        body,
        locationId: GHL_LOCATION_ID,
      }),
    });
    await handleResponse(response, 'Failed to send message');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send message via GHL');
  }
}

// --- PIPELINES & OPPORTUNITIES ---

export async function getPipelines(): Promise<GHLPipeline[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/opportunities/pipelines`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    const response = await fetch(url.toString(), { headers });
    const data = await handleResponse(response, 'Failed to fetch pipelines');
    return data?.pipelines || [];
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
    const data = await handleResponse(response, 'Failed to fetch opportunities');
    return data?.opportunities || [];
  } catch (error) {
    return [];
  }
}

export async function createOpportunity(oppData: any): Promise<GHLOpportunity> {
  try {
    const payload: any = {
      ...oppData,
      locationId: GHL_LOCATION_ID,
    };
    
    // Ensure numeric types
    if (payload.monetaryValue) {
      payload.monetaryValue = Number(payload.monetaryValue);
    }

    // GHL V2 POST Opportunities often requires locationId as a query param too
    const url = new URL(`${GHL_API_BASE_URL}/opportunities`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await handleResponse(response, 'Failed to create opportunity in GHL registry');
    return data.opportunity;
  } catch (error: any) {
    throw new Error(error.message || 'Could not sync opportunity record with GHL backend');
  }
}

export async function updateOpportunity(id: string, oppData: Partial<GHLOpportunity>): Promise<GHLOpportunity> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/opportunities/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(oppData),
    });
    const data = await handleResponse(response, 'Failed to update opportunity');
    return data.opportunity;
  } catch (error: any) {
    throw new Error(error.message || 'Could not update opportunity in GHL');
  }
}

export async function updateOpportunityStatus(id: string, status: string): Promise<void> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/opportunities/${id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    });
    await handleResponse(response, 'Failed to update status');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update opportunity status in GHL');
  }
}

export async function deleteOpportunity(id: string): Promise<void> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/opportunities/${id}`, {
      method: 'DELETE',
      headers,
    });
    await handleResponse(response, 'Failed to delete opportunity');
  } catch (error: any) {
    throw new Error(error.message || 'Could not delete opportunity from GHL');
  }
}
