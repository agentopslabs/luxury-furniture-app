/**
 * @fileOverview Types and interfaces for the LeadConnector GHL V2 API, and the ghl singleton.
 */

import * as actions from './ghl-actions';

export interface GHLContact {
  id: string;
  locationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tags?: string[];
  type?: 'lead' | 'customer';
  dateAdded?: string;
}

export interface GHLAppointment {
  id: string;
  locationId: string;
  contactId: string;
  calendarId?: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'showed' | 'noshow' | 'completed' | 'booked';
}

export interface GHLCalendar {
  id: string;
  name: string;
  description?: string;
  locationId: string;
  isActive?: boolean;
}

export interface GHLConversation {
  id: string;
  contactId: string;
  locationId: string;
  lastMessageBody?: string;
  lastMessageDate?: string | number;
  lastMessageType?: string;
  contactName?: string;
  fullName?: string;
  unreadCount?: number;
  type?: string;
  email?: string;
  phone?: string;
  inbox?: boolean;
  assignedTo?: string;
}

export interface GHLMessage {
  id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  dateAdded: string;
  type?: number;
  messageType?: string;
  contentType?: string;
  source?: string;
  attachments?: string[];
  conversationId?: string;
  contactId?: string;
}

export interface GHLPipeline {
  id: string;
  name: string;
  stages: { id: string; name: string }[];
}

export interface GHLOpportunity {
  id: string;
  name: string;
  pipelineId: string;
  pipelineStageId: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  monetaryValue?: number;
  contact?: {
    id?: string;
    name?: string;
    email?: string;
  };
}

/**
 * The ghl singleton provides a unified interface for GHL V2 operations.
 * It primarily wraps server actions to bypass CORS and secure credentials.
 */
export const ghl = {
  ...actions,
  isMockMode: () => false,
  /**
   * Helper to get a single contact by ID.
   */
  getContact: async (id: string): Promise<GHLContact | null> => {
    const contacts = await actions.getContacts(100);
    if (id === "mock_id" && contacts.length > 0) return contacts[0];
    return contacts.find(c => c.id === id) || null;
  },
  /**
   * Helper to get appointments for a specific contact.
   */
  getAppointments: async (contactId: string): Promise<GHLAppointment[]> => {
    const all = await actions.getAllAppointments();
    return all.filter(a => a.contactId === contactId);
  }
};