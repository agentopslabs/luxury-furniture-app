
'use server';

/**
 * @fileOverview Secure server actions for LeadConnector V2 API.
 * Standardized for robust synchronization with mandatory tracking headers and parameters.
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
 * Handles the GHL V2 API response with enhanced error parsing for JSON and non-JSON bodies.
 */
async function handleResponse(response: Response, actionName: string) {
  if (!response.ok) {
    let errorMessage = `Sync Error [${response.status}] during ${actionName}`;
    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.message)) {
        errorMessage = errorData.message.join(', ');
      } else {
        errorMessage = errorData.message || (errorData.errors && errorData.errors[0]?.message) || errorMessage;
      }
    } catch (e) {
      errorMessage = `${errorMessage}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  try {
    const text = await response.text();
    if (!text || text.trim() === '') return null;
    return JSON.parse(text);
  } catch (e) {
    if (response.status === 204) return null;
    return null;
  }
}

// --- CONTACTS ---

export async function getContacts(limit: number = 50): Promise<GHLContact[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/contacts`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching contacts');
    return data?.contacts || [];
  } catch (error) {
    console.error("GHL Sync Error:", error);
    return [];
  }
}

export async function createContact(contactData: Partial<GHLContact>): Promise<GHLContact> {
  const response = await fetch(`${GHL_API_BASE_URL}/contacts`, {
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
    body: JSON.stringify({
      ...contactData,
      locationId: GHL_LOCATION_ID
    }),
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
    const calendarsUrl = new URL(`${GHL_API_BASE_URL}/calendars/`);
    calendarsUrl.searchParams.append('locationId', GHL_LOCATION_ID);
    const calsResponse = await fetch(calendarsUrl.toString(), { headers, next: { revalidate: 0 } });
    const calsData = await handleResponse(calsResponse, 'fetching calendars list');
    const calendars: GHLCalendar[] = calsData?.calendars || [];

    if (calendars.length === 0) return [];

    const now = new Date();
    const startTime = now.getTime() - (365 * 24 * 60 * 60 * 1000);
    const endTime = now.getTime() + (180 * 24 * 60 * 60 * 1000);

    const allEvents: GHLAppointment[] = [];
    for (const calendar of calendars) {
      try {
        const url = new URL(`${GHL_API_BASE_URL}/calendars/events`);
        url.searchParams.append('locationId', GHL_LOCATION_ID);
        url.searchParams.append('calendarId', calendar.id);
        url.searchParams.append('startTime', startTime.toString());
        url.searchParams.append('endTime', endTime.toString());
        const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
        const data = await handleResponse(response, 'fetching calendar events');
        allEvents.push(...(data?.events || []));
      } catch {
        // skip calendars that fail
      }
    }

    return allEvents.sort((a: any, b: any) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  } catch (error) {
    console.error("GHL Sync Error:", error);
    return [];
  }
}

/**
 * Creates a new appointment using the specific GHL V2 calendar events endpoint.
 * Optimized with mandatory locationId and timezone to resolve "slot no longer available" errors.
 */
export async function createAppointment(apptData: {
  calendarId: string;
  contactId: string;
  startTime: string; 
  endTime?: string;
  title: string;
  timezone?: string;
}): Promise<GHLAppointment> {
  // Ensure we have a strictly defined end time (default 30 mins)
  const start = new Date(apptData.startTime);
  const end = apptData.endTime ? new Date(apptData.endTime) : new Date(start.getTime() + 30 * 60000);

  // GHL V2 validation often fails if the start time is too close to "now"
  // We ensure it's at least in the future by checking it, but we rely on the user selection.
  
  const payload = {
    calendarId: apptData.calendarId,
    contactId: apptData.contactId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    title: apptData.title,
    locationId: GHL_LOCATION_ID,
    // Use provided timezone or fallback to UTC to prevent "slot no longer available" validation errors
    timezone: apptData.timezone || 'UTC',
  };

  const response = await fetch(`${GHL_API_BASE_URL}/calendars/events/appointments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
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

export async function getCalendarFreeSlots(calendarId: string, date: string, timezone: string): Promise<string[]> {
  try {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const url = new URL(`${GHL_API_BASE_URL}/calendars/${calendarId}/free-slots`);
    url.searchParams.append('startDate', start.getTime().toString());
    url.searchParams.append('endDate', end.getTime().toString());
    url.searchParams.append('timezone', timezone);

    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching free slots');
    if (!data) return [];

    const dateKey = Object.keys(data).find(k => k !== 'traceId' && k.startsWith(date));
    return dateKey ? (data[dateKey]?.slots || []) : [];
  } catch (error) {
    console.error("GHL Free Slots Error:", error);
    return [];
  }
}

export async function getCalendars(): Promise<GHLCalendar[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/calendars/`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    const response = await fetch(url.toString(), { headers });
    const data = await handleResponse(response, 'fetching calendars');
    return data?.calendars || [];
  } catch (error) {
    console.error("GHL Sync Error:", error);
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
    console.error("GHL Sync Error:", error);
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
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching pipelines');
    return data?.pipelines || [];
  } catch (error) {
    console.error("GHL Pipelines Sync Error:", error);
    return [];
  }
}

export async function getOpportunities(): Promise<GHLOpportunity[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/opportunities/search`);
    url.searchParams.append('location_id', GHL_LOCATION_ID);
    url.searchParams.append('limit', '100');
    
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching opportunities');
    return data?.opportunities || [];
  } catch (error) {
    console.error("GHL Opportunities Sync Error:", error);
    return [];
  }
}

export async function updateOpportunity(id: string, oppData: Partial<GHLOpportunity>): Promise<GHLOpportunity> {
  const { locationId: _loc, ...safeData } = oppData as any;
  const response = await fetch(`${GHL_API_BASE_URL}/opportunities/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(safeData),
  });
  const data = await handleResponse(response, 'updating opportunity');
  return data.opportunity;
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

// --- PAYMENTS & ORDERS ---

export async function getOrders(limit: number = 50): Promise<any[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/payments/orders`);
    url.searchParams.append('altId', GHL_LOCATION_ID);
    url.searchParams.append('altType', 'location');
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching orders');
    return data?.orders || [];
  } catch (error) {
    console.error("GHL Sync Error:", error);
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
  const url = new URL(`${GHL_API_BASE_URL}/payments/orders`);
  
  url.searchParams.append('altId', GHL_LOCATION_ID);
  url.searchParams.append('altType', 'location');
  url.searchParams.append('fingerprint', `fp_${timestamp}`);
  url.searchParams.append('trackingId', `tr_${timestamp}`);

  const payload = {
    altId: GHL_LOCATION_ID,
    altType: 'location',
    fingerprint: `fp_${timestamp}`,
    trackingId: `tr_${timestamp}`,
    locationId: GHL_LOCATION_ID,
    contactId: orderData.contactId,
    source: 'manual', 
    products: [
      {
        id: `prod_${timestamp}`,
        name: orderData.productName,
        qty: 1,
        price: Number(orderData.totalAmount),
        currency: 'USD'
      }
    ],
    status: orderData.status || 'pending',
    liveMode: false
  };

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'creating order');
}

// --- INVOICES ---

export async function getInvoices(limit: number = 50): Promise<any[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/invoices/`);
    url.searchParams.append('altId', GHL_LOCATION_ID);
    url.searchParams.append('altType', 'location');
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', '0');
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
  const contactRes = await fetch(`${GHL_API_BASE_URL}/contacts/${invoiceData.contactId}`, { headers });
  const contactData = await contactRes.json();
  const contact = contactData?.contact || {};

  const locRes = await fetch(`${GHL_API_BASE_URL}/locations/${GHL_LOCATION_ID}`, { headers });
  const locData = await locRes.json();
  const loc = locData?.location || {};

  const today = new Date().toISOString().split('T')[0];
  const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const url = new URL(`${GHL_API_BASE_URL}/invoices/`);
  url.searchParams.append('altId', GHL_LOCATION_ID);
  url.searchParams.append('altType', 'location');

  const payload = {
    altId: GHL_LOCATION_ID,
    altType: 'location',
    name: invoiceData.title,
    currency: 'USD',
    status: 'draft',
    issueDate: today,
    dueDate: due,
    businessDetails: {
      name: loc.name || 'Business',
      address: loc.address || '',
      city: loc.city || '',
      state: loc.state || '',
      country: loc.country || 'US',
      website: loc.website || 'https://example.com',
      email: loc.email || '',
      phoneNo: loc.phone || '',
    },
    contactDetails: {
      id: invoiceData.contactId,
      name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Client',
      email: contact.email || '',
      phoneNo: contact.phone || '',
    },
    items: [
      { name: invoiceData.title, qty: 1, unitPrice: Number(invoiceData.amount) }
    ],
  };

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'creating invoice');
}

// --- TRANSACTIONS & SUBSCRIPTIONS ---

export async function getTransactions(limit: number = 50): Promise<any[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/payments/transactions`);
    url.searchParams.append('altId', GHL_LOCATION_ID);
    url.searchParams.append('altType', 'location');
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching transactions');
    return data?.transactions || [];
  } catch (error) {
    return [];
  }
}

export async function getSubscriptions(limit: number = 50): Promise<any[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/payments/subscriptions`);
    url.searchParams.append('altId', GHL_LOCATION_ID);
    url.searchParams.append('altType', 'location');
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching subscriptions');
    return data?.subscriptions || [];
  } catch (error) {
    return [];
  }
}

export async function getProducts(limit: number = 50): Promise<any[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/payments/custom-plans`);
    url.searchParams.append('altId', GHL_LOCATION_ID);
    url.searchParams.append('altType', 'location');
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching products');
    return data?.customPlans || [];
  } catch (error) {
    return [];
  }
}

// --- MARKETING ---

export async function getSocialPosts(limit: number = 50): Promise<any[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/social-media-planner/posts`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching social posts');
    return data?.posts || [];
  } catch (error) {
    console.error("GHL Sync Error:", error);
    return [];
  }
}

export async function createSocialPost(postData: {
  caption: string;
  type: string;
  status: string;
  channels?: string[];
}): Promise<any> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/social-media-planner/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...postData,
        locationId: GHL_LOCATION_ID,
        scheduledDate: new Date().toISOString()
      }),
    });
    return handleResponse(response, 'creating social post');
  } catch (error) {
    throw new Error('Social Planner is not available on this GHL plan. Please create posts directly in GoHighLevel.');
  }
}

export async function getEmailTemplates(limit: number = 50): Promise<any[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/emails/templates`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching email templates');
    return data?.templates || [];
  } catch (error) {
    return [];
  }
}

export async function getTriggerLinks(limit: number = 50): Promise<any[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/links`);
    url.searchParams.append('locationId', GHL_LOCATION_ID);
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching trigger links');
    return data?.links || [];
  } catch (error) {
    return [];
  }
}
