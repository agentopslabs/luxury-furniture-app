
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
        const response = await fetch(url.toString(), {
          headers: { ...headers, 'Version': '2021-04-15' },
          next: { revalidate: 0 },
          cache: 'no-store',
        });
        const data = await handleResponse(response, 'fetching calendar events');

        // GHL v2 may return events under different keys — handle all variants
        const rawEvents: any[] =
          data?.events ||
          data?.data ||
          data?.appointments ||
          (Array.isArray(data) ? data : []);

        const events = rawEvents.map((e: any) => ({
          ...e,
          calendarId: e.calendarId || calendar.id,
          status: e.status ?? e.appointmentStatus ?? e.appoinmentStatus ?? 'confirmed',
        }));
        allEvents.push(...events);
      } catch (err) {
        console.error(`[GHL] Failed to fetch events for calendar "${calendar.name}":`, err);
      }
    }

    return allEvents.sort((a: any, b: any) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  } catch (error) {
    console.error("GHL Sync Error (getAllAppointments):", error);
    return [];
  }
}

/**
 * Creates a new appointment using the GHL V2 calendar events endpoint.
 * Sends the slot time exactly as received from the free-slots API to avoid
 * timezone double-conversion issues that cause "slot no longer available" errors.
 */
export async function createAppointment(apptData: {
  calendarId: string;
  contactId: string;
  startTime: string;
  endTime?: string;
  title: string;
  timezone?: string;
}): Promise<{ appointment: GHLAppointment }> {
  // Use the slot ISO string directly — do NOT re-parse through new Date().toISOString()
  // because that converts to UTC and GHL rejects it when the timezone doesn't match.
  const startTime = apptData.startTime;
  const startMs = new Date(startTime).getTime();
  const endTime = apptData.endTime || new Date(startMs + 60 * 60000).toISOString();

  const payload = {
    calendarId: apptData.calendarId,
    contactId: apptData.contactId,
    startTime,
    endTime,
    title: apptData.title,
    locationId: GHL_LOCATION_ID,
    timezone: apptData.timezone || 'UTC',
    toNotify: false,
  };

  const response = await fetch(`${GHL_API_BASE_URL}/calendars/events/appointments`, {
    method: 'POST',
    headers: {
      ...headers,
      'Version': '2021-04-15',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errMsg = '';
    try {
      const e = await response.json();
      errMsg = Array.isArray(e.message) ? e.message.join(', ') : (e.message || '');
    } catch {}
    throw new Error(errMsg || `Booking failed (${response.status})`);
  }

  const data = await handleResponse(response, 'booking appointment');
  return { appointment: data.appointment || data };
}

export async function createContactNote(contactId: string, body: string): Promise<void> {
  const response = await fetch(`${GHL_API_BASE_URL}/contacts/${contactId}/notes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body }),
  });
  await handleResponse(response, 'creating contact note');
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
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const url = new URL(`${GHL_API_BASE_URL}/calendars/${calendarId}/free-slots`);
  url.searchParams.append('startDate', start.getTime().toString());
  url.searchParams.append('endDate', end.getTime().toString());
  url.searchParams.append('timezone', timezone);

  const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });

  if (!response.ok) {
    let errMsg = '';
    try { const e = await response.json(); errMsg = e.message || ''; } catch {}
    if (errMsg.toLowerCase().includes('inactive')) throw new Error('This calendar is inactive and cannot accept bookings.');
    throw new Error(errMsg || `Slots fetch failed (${response.status})`);
  }

  const data = await response.json();
  if (!data) return [];

  // Handle flat structure: { slots: [...] }
  if (Array.isArray(data.slots)) return data.slots;

  // Handle nested structure: { "YYYY-MM-DD": { slots: [...] } }
  // Try exact date key first
  if (data[date]?.slots) return data[date].slots;

  // Try any key that starts with the date
  const dateKey = Object.keys(data).find(k => k !== 'traceId' && typeof data[k] === 'object' && k.startsWith(date));
  if (dateKey) return data[dateKey]?.slots || [];

  // Collect all slots from any date key that has a slots array
  const allSlots: string[] = [];
  for (const key of Object.keys(data)) {
    if (key === 'traceId') continue;
    const val = data[key];
    if (val && Array.isArray(val.slots)) {
      allSlots.push(...val.slots);
    }
  }
  return allSlots;
}

/**
 * Fetches a single calendar by ID to read its current openHours configuration.
 */
export async function getCalendarById(calendarId: string): Promise<any> {
  const response = await fetch(`${GHL_API_BASE_URL}/calendars/${calendarId}`, {
    headers,
    next: { revalidate: 0 },
  });
  const data = await handleResponse(response, 'fetching calendar');
  return data?.calendar || data;
}

/**
 * Updates a calendar's openHours to include Saturday (6) and Sunday (0)
 * so bookings can be made on weekends.
 */
export async function enableCalendarWeekends(calendarId: string): Promise<void> {
  // 1. Fetch current calendar settings
  const cal = await getCalendarById(calendarId);

  // GHL may return openHours as an array OR as a non-array object — normalise defensively
  const rawHours = cal?.openHours;
  const existingHours: any[] = Array.isArray(rawHours) ? rawHours : [];

  const weekendDays = [0, 6]; // 0 = Sunday, 6 = Saturday
  const alreadyCovered = new Set(
    existingHours.flatMap((oh: any) =>
      Array.isArray(oh.daysOfTheWeek) ? oh.daysOfTheWeek : []
    )
  );

  const newEntries = weekendDays
    .filter(day => !alreadyCovered.has(day))
    .map(day => ({
      daysOfTheWeek: [day],
      hours: [{ openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 }],
    }));

  if (newEntries.length === 0) return; // weekends already enabled

  // If we couldn't read existing hours (non-array structure from GHL),
  // bootstrap a full Mon–Fri + weekend schedule so we don't wipe anything.
  const baseHours =
    existingHours.length > 0
      ? existingHours
      : [1, 2, 3, 4, 5].map(day => ({
          daysOfTheWeek: [day],
          hours: [{ openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 }],
        }));

  const updatedHours = [...baseHours, ...newEntries];

  const response = await fetch(`${GHL_API_BASE_URL}/calendars/${calendarId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ openHours: updatedHours }),
  });

  if (!response.ok) {
    let msg = '';
    try { const e = await response.json(); msg = e.message || ''; } catch {}
    throw new Error(msg || `Failed to enable weekends (${response.status})`);
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

const ACTIVITY_MESSAGE_TYPES = [
  'TYPE_ACTIVITY_OPPORTUNITY',
  'TYPE_ACTIVITY_APPOINTMENT',
  'TYPE_ACTIVITY_CONTACT',
  'TYPE_ACTIVITY_EMPLOYEE_ACTION_LOG',
  'TYPE_ACTIVITY_PAYMENT',
  'TYPE_ACTIVITY_CONVERSATION',
  'TYPE_NO_SHOW',
  'TYPE_CALL_CONNECTED',
  'TYPE_CALL_ENDED',
];

export async function getConversationMessages(conversationId: string): Promise<any[]> {
  try {
    const url = new URL(`${GHL_API_BASE_URL}/conversations/${conversationId}/messages`);
    url.searchParams.append('limit', '100');
    const response = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
    const data = await handleResponse(response, 'fetching messages');

    if (!data) return [];

    // GHL V2: { messages: { lastMessageId, nextPage, messages: [...] }, traceId }
    const outer = data.messages;
    let all: any[] = [];
    if (Array.isArray(outer)) {
      all = outer;
    } else if (outer && Array.isArray(outer.messages)) {
      all = outer.messages;
    }

    // Filter out system activity entries — keep only real conversation messages
    return all.filter((m: any) => {
      if (!m.body && !m.attachments?.length) return false;
      if (ACTIVITY_MESSAGE_TYPES.includes(m.messageType)) return false;
      return true;
    });
  } catch (error) {
    console.error('GHL Messages Sync Error:', error);
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

// --- MARKETING / SOCIAL PLANNER ---

const socialPlannerHeaders = {
  'Authorization': `Bearer ${GHL_ACCESS_TOKEN}`,
  'Version': '2021-04-15',
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

const SOCIAL_BASE = `${GHL_API_BASE_URL}/social-media-posting/${GHL_LOCATION_ID}`;

export async function getSocialPlannerPosts(options?: {
  startDate?: number;
  endDate?: number;
  skip?: number;
  limit?: number;
}): Promise<any[]> {
  try {
    const pageLimit = options?.limit ?? 100;
    const allPosts: any[] = [];
    let skip = options?.skip ?? 0;

    // GHL Social Planner uses POST /posts/list with skip & limit as query params
    while (true) {
      const url = new URL(`${SOCIAL_BASE}/posts/list`);
      url.searchParams.append('skip', String(skip));
      url.searchParams.append('limit', String(pageLimit));

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: socialPlannerHeaders,
        body: JSON.stringify({}),
        cache: 'no-store',
      });
      if (!response.ok) break;

      const data = await handleResponse(response, 'fetching social planner posts');
      const page: any[] = data?.results?.posts || data?.posts || data?.data || data?.result || [];
      const total: number = data?.results?.count ?? data?.count ?? 0;

      if (page.length === 0) break;
      allPosts.push(...page);

      // If we got fewer than the limit, or reached the total, stop
      if (page.length < pageLimit || allPosts.length >= total) break;

      // If caller specified an explicit skip, don't auto-paginate
      if (options?.skip !== undefined) break;

      skip += pageLimit;

      // Safety cap at 2000 posts
      if (allPosts.length >= 2000) break;
    }

    return allPosts;
  } catch {
    return [];
  }
}

export async function getSocialPlannerAccounts(): Promise<any[]> {
  try {
    const url = new URL(`${SOCIAL_BASE}/accounts`);
    const response = await fetch(url.toString(), { headers: socialPlannerHeaders, cache: 'no-store' });
    if (!response.ok) return [];
    const data = await handleResponse(response, 'fetching social planner accounts');
    // GHL returns: { results: { accounts: [...], groups: [...] } }
    return data?.results?.accounts || data?.accounts || data?.data || [];
  } catch {
    return [];
  }
}

export async function createSocialPlannerPost(postData: {
  accountIds: string[];
  summary: string;
  type?: string;
  scheduleDateTime?: string;
  mediaUrls?: string[];
  userId?: string;
}): Promise<any> {
  // Build media array from URLs
  const EXT_MIME: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', heic: 'image/heic', avif: 'image/avif',
    mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
    avi: 'video/x-msvideo', mkv: 'video/x-matroska',
  };
  const media: any[] = (postData.mediaUrls || []).map(url => {
    const ext = (url.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
    const type = EXT_MIME[ext] || 'image/jpeg';
    return { url, type };
  });

  const payload: any = {
    accountIds: postData.accountIds,
    summary: postData.summary,
    type: postData.type || 'post',
    media,
    userId: postData.userId || 'system',
  };
  if (postData.scheduleDateTime) {
    payload.scheduleDate = postData.scheduleDateTime;
    payload.status = 'scheduled';
  }

  // Correct endpoint: POST /social-media-posting/{locationId}/posts
  const response = await fetch(`${SOCIAL_BASE}/posts`, {
    method: 'POST',
    headers: socialPlannerHeaders,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let msg = '';
    try {
      const e = await response.json();
      msg = Array.isArray(e.message) ? e.message.join(', ') : (e.message || '');
    } catch {}
    throw new Error(msg || `Failed to create post (${response.status})`);
  }
  return await handleResponse(response, 'creating social planner post');
}

export async function deleteScheduledPost(postId: string): Promise<void> {
  const response = await fetch(`${SOCIAL_BASE}/posts/${postId}`, {
    method: 'DELETE',
    headers: socialPlannerHeaders,
  });
  if (!response.ok) {
    let msg = '';
    try { const e = await response.json(); msg = Array.isArray(e.message) ? e.message.join(', ') : (e.message || ''); } catch {}
    throw new Error(msg || `Failed to delete post (${response.status})`);
  }
}

export async function updateScheduledPost(postId: string, data: {
  summary?: string;
  scheduleDate?: string;
  accountIds?: string[];
}): Promise<any> {
  const payload: any = {};
  if (data.summary !== undefined) payload.summary = data.summary;
  if (data.scheduleDate) { payload.scheduleDate = data.scheduleDate; payload.status = 'scheduled'; }
  if (data.accountIds) payload.accountIds = data.accountIds;

  const response = await fetch(`${SOCIAL_BASE}/posts/${postId}`, {
    method: 'PATCH',
    headers: socialPlannerHeaders,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let msg = '';
    try { const e = await response.json(); msg = Array.isArray(e.message) ? e.message.join(', ') : (e.message || ''); } catch {}
    throw new Error(msg || `Failed to update post (${response.status})`);
  }
  return response.json().catch(() => ({}));
}

// Combined fetch for marketing page — one server action call instead of four
export async function fetchMarketingData(): Promise<{
  posts: any[];
  accounts: any[];
  emails: any[];
  links: any[];
}> {
  const [posts, accounts, emails, links] = await Promise.all([
    getSocialPlannerPosts().catch(() => []),
    getSocialPlannerAccounts().catch(() => []),
    getEmailTemplates(20).catch(() => []),
    getTriggerLinks(20).catch(() => []),
  ]);
  return { posts: posts || [], accounts: accounts || [], emails: emails || [], links: links || [] };
}

// Legacy aliases kept for any remaining references
export async function getSocialPosts(): Promise<any[]> { return getSocialPlannerPosts(); }
export async function getSocialAccounts(): Promise<any[]> { return getSocialPlannerAccounts(); }
export async function getSocialOAuthUrl(_platform: string): Promise<string | null> { return null; }
export async function createSocialPost(postData: any): Promise<any> {
  return createSocialPlannerPost({ accountIds: postData.channels || [], summary: postData.caption, mediaUrls: postData.mediaUrls });
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
