
import apiClient from './api-client';

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
}

export interface GHLConversation {
  id: string;
  contactId: string;
  locationId: string;
  lastMessageBody?: string;
  lastMessageDate?: string;
  contactName?: string;
  unreadCount?: number;
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
    name: string;
    email?: string;
  };
}

/**
 * GHL Service Layer strictly implemented for API V2.
 * All requests target https://services.leadconnectorhq.com
 */
class GHLService {
  /**
   * Checks if we are running in mock mode.
   */
  isMockMode(): boolean {
    const token = process.env.NEXT_PUBLIC_GHL_ACCESS_TOKEN;
    // If no token is provided or it's a known placeholder, we might be in mock mode
    // However, if a Location ID is provided, we should prefer live.
    return !token || token.includes('your_') || token.includes('mock');
  }

  /**
   * Fetches all contacts for the configured location.
   */
  async getContacts(limit: number = 20): Promise<GHLContact[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const response = await apiClient.get('/contacts/', {
        params: { locationId, limit, _t: Date.now() }
      });
      return response.data.contacts || [];
    } catch (error: any) {
      if (this.isMockMode()) return this.getMockContacts("");
      return [];
    }
  }

  /**
   * Searches for a contact by email using GHL V2.
   */
  async searchContacts(email: string): Promise<GHLContact[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const response = await apiClient.get(`/contacts/`, {
        params: { locationId, query: email, _t: Date.now() }
      });
      return response.data.contacts || [];
    } catch (error: any) {
      if (this.isMockMode()) return this.getMockContacts(email);
      return [];
    }
  }

  /**
   * Fetches a specific contact's details via V2 endpoint.
   */
  async getContact(id: string): Promise<GHLContact> {
    try {
      const response = await apiClient.get(`/contacts/${id}`, {
        params: { _t: Date.now() }
      });
      return response.data.contact;
    } catch (error) {
      if (this.isMockMode() || id === 'mock_id') return this.getMockContact();
      throw error;
    }
  }

  /**
   * Retrieves all appointments for the location.
   * Uses GHL V2 startTime/endTime parameters (Unix timestamps in ms).
   */
  async getAllAppointments(): Promise<GHLAppointment[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const now = new Date();
      // Range: 90 days back, 120 days forward
      const startTimestamp = now.getTime() - (90 * 24 * 60 * 60 * 1000);
      const endTimestamp = now.getTime() + (120 * 24 * 60 * 60 * 1000);

      const response = await apiClient.get('/appointments/', {
        params: { 
          locationId, 
          startTime: startTimestamp, 
          endTime: endTimestamp,
          limit: 100,
          _t: Date.now()
        }
      });
      
      const appointments = response.data.appointments || [];
      return appointments.sort((a: any, b: any) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    } catch (error) {
      if (this.isMockMode()) return this.getMockAppointments();
      return [];
    }
  }

  async getAppointments(contactId: string): Promise<GHLAppointment[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId || contactId === 'mock_id') {
      if (this.isMockMode()) return this.getMockAppointments();
      return [];
    }
    
    try {
      const response = await apiClient.get(`/appointments/`, {
        params: { contactId, locationId, _t: Date.now() }
      });
      return response.data.appointments || [];
    } catch (error) {
      return [];
    }
  }

  async getCalendars(): Promise<GHLCalendar[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const response = await apiClient.get('/calendars/', {
        params: { locationId, _t: Date.now() }
      });
      return response.data.calendars || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetches V2 Conversations.
   */
  async getConversations(limit: number = 20): Promise<GHLConversation[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const response = await apiClient.get('/conversations/', {
        params: { locationId, limit, _t: Date.now() }
      });
      return response.data.conversations || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetches V2 Pipelines.
   */
  async getPipelines(): Promise<GHLPipeline[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const response = await apiClient.get(`/opportunities/pipelines`, {
        params: { locationId, _t: Date.now() }
      });
      return response.data.pipelines || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetches V2 Opportunities for a location.
   */
  async getOpportunities(limit: number = 20): Promise<GHLOpportunity[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const response = await apiClient.get('/opportunities/', {
        params: { locationId, limit, _t: Date.now() }
      });
      return response.data.opportunities || [];
    } catch (error) {
      return [];
    }
  }

  private getMockContacts(email: string): GHLContact[] {
    return [{
      id: 'mock_id',
      locationId: 'mock_location',
      firstName: 'Alex',
      lastName: 'Sterling',
      email: email || 'alex@sterling.io',
      tags: ['v2-prototype'],
      type: 'customer',
      dateAdded: new Date().toISOString()
    }];
  }

  private getMockContact(): GHLContact {
    return {
      id: 'mock_id',
      locationId: 'mock_location',
      firstName: 'Alex',
      lastName: 'Sterling',
      email: 'alex@sterling.io',
      tags: ['v2-prototype', 'demo-mode']
    };
  }

  private getMockAppointments(): GHLAppointment[] {
    return [
      {
        id: 'appt_1',
        locationId: 'mock_location',
        contactId: 'mock_id',
        title: 'V2 Strategic Planning',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
        status: 'confirmed'
      },
      {
        id: 'appt_2',
        locationId: 'mock_location',
        contactId: 'mock_id',
        title: 'V2 Implementation Review',
        startTime: new Date(Date.now() - 172800000).toISOString(),
        endTime: new Date(Date.now() - 169200000).toISOString(),
        status: 'completed'
      }
    ];
  }
}

export const ghl = new GHLService();
