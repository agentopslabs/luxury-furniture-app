'use server';

/**
 * @fileOverview Secure server actions for LeadConnector V2 API.
 * Handles live synchronization with enhanced error handling and resiliency.
 */

import { GHLContact, GHLAppointment, GHLCalendar, GHLConversation, GHLPipeline, GHLOpportunity } from './ghl';

const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_ACCESS_TOKEN = 'pit-fde7a892-d292-4304-8a9d-a9ffe205ec78';
const GHL_LOCATION_ID = 'nBYJTjYbHTIsJGiqT0W4';

const headers = {
  'Authorization': `Bearer ${GHL_ACCESS_TOKEN}`,
  'Version': '2021-07-28',
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

/**
 * Resilient response handler to provide clear diagnostics for Sync Errors.
 */
async function handleResponse(response: Response, actionName: string) {
  if (!response.ok) {
    let errorMessage = `GHL API Error [${response.status}] during ${actionName}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || (errorData.errors && errorData.errors[0]?.message) || (Array.isArray(errorData.message) ? errorData.message.join(',') : errorMessage);
    } catch (e) {
      errorMessage = `${errorMessage}: ${response.statusText}`;
    }
    console.error(`[SYNC FAILURE] ${errorMessage}`);
    throw new Error(errorMessage);
  }
  
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (e) {
    if (response.status === 204) return null;
    throw new Error(`[PARSE ERROR] Invalid JSON from GHL in ${actionName}`);
  }
}

// --- CONTACTS ---

export async function getContacts(limit: number = 50): Promise<GHLContact[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/contacts/`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching contacts');
    return data?.contacts || [];
  } catch (error) {
    return [];
  }
}

export async function searchContacts(query: string = ""): Promise<GHLContact[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/contacts/`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    if (query) url.searchParams.append('query', query);
    
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'searching contacts');
    return data?.contacts || [];
  } catch (error) {
    return [];
  }
}

export async function createContact(contactData: Partial<GHLContact>): Promise<GHLContact> {
  const response = await fetch(`${GHL_API_BASE_URL}/contacts/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...contactData,
      locationId: GHL_LOCATION_ID,
    }),
  });
  const data = await handleResponse(response, 'creating contact');
  return data.contact;
}

export async function updateContact(id: string, contactData: Partial<GHLContact>): Promise<GHLContact> {
  const response = await fetch(`${GHL_API_BASE_URL}/contacts/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(contactData),
  });
  const data = await handleResponse(response, 'updating contact');
  return data.contact;
}

export async function deleteContact(id: string): Promise<void> {
  const response = await fetch(`${GHL_API_BASE_URL}/contacts/${id}`, {
    method: 'DELETE',
    headers,
  });
  await handleResponse(response, 'deleting contact');
}

// --- APPOINTMENTS ---

export async function getAllAppointments(): Promise<GHLAppointment[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/appointments/`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    
    const now = new Date();
    const startTime = now.getTime() - (30 * 24 * 60 * 60 * 1000); 
    const endTime = now.getTime() + (90 * 24 * 60 * 60 * 1000);  
    
    url.searchParams.append('startTime', startTime.toString());
    url.searchParams.append('endTime', endTime.toString());

    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching appointments');
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
  const response = await fetch(`${GHL_API_BASE_URL}/appointments/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...apptData,
      locationId: GHL_LOCATION_ID,
    }),
  });
  const data = await handleResponse(response, 'booking appointment');
  return data.appointment;
}

export async function updateAppointmentStatus(id: string, status: string): Promise<void> {
  const response = await fetch(`${GHL_API_BASE_URL}/appointments/${id}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status }),
  });
  await handleResponse(response, 'updating appointment status');
}

export async function getCalendars(): Promise<GHLCalendar[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/calendars/`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    const response = await fetch(url.toString(), { headers });
    const data = await handleResponse(response, 'fetching calendars');
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
    const data = await handleResponse(response, 'fetching conversations');
    return data?.conversations || [];
  } catch (error) {
    return [];
  }
}

export async function sendMessage(conversationId: string, body: string, type: 'email' | 'sms' = 'sms'): Promise<void> {
  const response = await fetch(`${GHL_API_BASE_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type,
      body,
      locationId: GHL_LOCATION_ID,
    }),
  });
  await handleResponse(response, 'sending message');
}

// --- PIPELINES & OPPORTUNITIES ---

export async function getPipelines(): Promise<GHLPipeline[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/opportunities/pipelines`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    const response = await fetch(url.toString(), { headers });
    const data = await handleResponse(response, 'fetching pipelines');
    return data?.pipelines || [];
  } catch (error) {
    return [];
  }
}

export async function getOpportunities(): Promise<GHLOpportunity[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/opportunities/search`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', '100');
    
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching opportunities');
    return data?.opportunities || [];
  } catch (error) {
    return [];
  }
}

export async function createOpportunity(oppData: {
  name: string;
  pipelineId: string;
  pipelineStageId: string;
  status: string;
  monetaryValue?: number;
  contactId?: string;
}): Promise<GHLOpportunity> {
  const payload: any = {
    name: oppData.name,
    pipelineId: oppData.pipelineId,
    pipelineStageId: oppData.pipelineStageId,
    status: oppData.status || 'open',
    locationId: GHL_LOCATION_ID,
    monetaryValue: oppData.monetaryValue ? Number(oppData.monetaryValue) : 0,
  };
  
  if (oppData.contactId && oppData.contactId.trim()) {
    payload.contactId = oppData.contactId;
  }

  const response = await fetch(`${GHL_API_BASE_URL}/opportunities/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await handleResponse(response, 'creating opportunity');
  return data.opportunity;
}

export async function updateOpportunity(id: string, oppData: Partial<GHLOpportunity>): Promise<GHLOpportunity> {
  const response = await fetch(`${GHL_API_BASE_URL}/opportunities/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(oppData),
  });
  const data = await handleResponse(response, 'updating opportunity');
  return data.opportunity;
}

// --- PAYMENTS & ORDERS ---

export async function getOrders(limit: number = 50): Promise<any[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/payments/orders`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching orders');
    return data?.orders || [];
  } catch (error) {
    return [];
  }
}

export async function createOrder(orderData: {
  productName: string;
  totalAmount: number;
  contactId: string;
  status: string;
}): Promise<any> {
  const timestamp = Date.now().toString();
  // Refined payload for GHL V2 Order Creation compliance
  const payload = {
    altId: GHL_LOCATION_ID,
    altType: 'location',
    locationId: GHL_LOCATION_ID,
    contactId: orderData.contactId,
    source: { type: 'api' }, // Changed string to nested object as per API requirement
    products: [
      {
        id: `custom_${timestamp}`, // Added mandatory product ID
        productName: orderData.productName,
        qty: 1,
        price: Number(orderData.totalAmount),
        currency: 'USD'
      }
    ],
    fingerprint: `kore_${timestamp}`,
    trackingId: `track_${timestamp}`,
    status: orderData.status || 'pending'
  };

  const response = await fetch(`${GHL_API_BASE_URL}/payments/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'creating order');
}

// --- INVOICES (DOCUMENTS & CONTRACTS) ---

export async function getInvoices(limit: number = 50): Promise<any[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/payments/invoices`);
    url.searchParams.append('altId', GHL_LOCATION_ID);
    url.searchParams.append('altType', 'location');
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching invoices');
    return data?.invoices || [];
  } catch (error) {
    return [];
  }
}

export async function createInvoice(invoiceData: {
  title: string;
  amount: number;
  contactId: string;
}): Promise<any> {
  const payload = {
    altId: GHL_LOCATION_ID,
    altType: 'location',
    contactId: invoiceData.contactId,
    title: invoiceData.title,
    liveMode: false,
    currency: 'USD',
    items: [
      {
        name: invoiceData.title,
        amount: Number(invoiceData.amount),
        qty: 1
      }
    ]
  };

  const response = await fetch(`${GHL_API_BASE_URL}/payments/invoices`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'creating invoice');
}

export async function getTransactions(limit: number = 50): Promise<any[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/payments/transactions`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching transactions');
    return data?.transactions || [];
  } catch (error) {
    return [];
  }
}

export async function deleteOpportunity(id: string): Promise<void> {
  const response = await fetch(`${GHL_API_BASE_URL}/opportunities/${id}`, {
    method: 'DELETE',
    headers,
  });
  await handleResponse(response, 'deleting opportunity');
}
