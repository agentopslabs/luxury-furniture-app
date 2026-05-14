
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
  status: 'confirmed' | 'cancelled' | 'showed' | 'noshow' | 'completed';
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
    return !token || token === '';
  }

  /**
   * Fetches all contacts for the configured location.
   */
  async getContacts(limit: number = 20): Promise<GHLContact[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId || this.isMockMode()) return this.getMockContacts("");

    try {
      const response = await apiClient.get('/contacts/', {
        params: { locationId, limit }
      });
      return response.data.contacts || [];
    } catch (error: any) {
      return this.getMockContacts("");
    }
  }

  /**
   * Searches for a contact by email using GHL V2.
   */
  async searchContacts(email: string): Promise<GHLContact[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId || this.isMockMode()) return this.getMockContacts(email);

    try {
      const response = await apiClient.get(`/contacts/`, {
        params: { locationId, query: email }
      });
      return response.data.contacts || [];
    } catch (error: any) {
      return this.getMockContacts(email);
    }
  }

  /**
   * Fetches a specific contact's details via V2 endpoint.
   */
  async getContact(id: string): Promise<GHLContact> {
    if (id === 'mock_id' || this.isMockMode()) return this.getMockContact();

    try {
      const response = await apiClient.get(`/contacts/${id}`);
      return response.data.contact;
    } catch (error) {
      return this.getMockContact();
    }
  }

  /**
   * Retrieves all appointments for the location.
   */
  async getAllAppointments(): Promise<GHLAppointment[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId || this.isMockMode()) return this.getMockAppointments();

    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).getTime();

      const response = await apiClient.get('/appointments/', {
        params: { locationId, startDate, endDate }
      });
      return response.data.appointments || [];
    } catch (error) {
      return this.getMockAppointments();
    }
  }

  async getAppointments(contactId: string): Promise<GHLAppointment[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId || contactId === 'mock_id' || this.isMockMode()) return this.getMockAppointments();
    
    try {
      const response = await apiClient.get(`/appointments/`, {
        params: { contactId, locationId }
      });
      return response.data.appointments || [];
    } catch (error) {
      return this.getMockAppointments();
    }
  }

  async getCalendars(): Promise<GHLCalendar[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId || this.isMockMode()) return [];

    try {
      const response = await apiClient.get('/calendars/', {
        params: { locationId }
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
    if (!locationId || this.isMockMode()) return [];

    try {
      const response = await apiClient.get('/conversations/', {
        params: { locationId, limit }
      });
      return response.data.conversations || [];
    } catch (error) {
      console.error('GHL V2 getConversations failed');
      return [];
    }
  }

  /**
   * Fetches V2 Pipelines.
   */
  async getPipelines(): Promise<GHLPipeline[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId || this.isMockMode()) return [];

    try {
      const response = await apiClient.get(`/opportunities/pipelines`, {
        params: { locationId }
      });
      return response.data.pipelines || [];
    } catch (error) {
      console.error('GHL V2 getPipelines failed');
      return [];
    }
  }

  /**
   * Fetches V2 Opportunities for a location.
   */
  async getOpportunities(limit: number = 20): Promise<GHLOpportunity[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId || this.isMockMode()) return [];

    try {
      const response = await apiClient.get('/opportunities/', {
        params: { locationId, limit }
      });
      return response.data.opportunities || [];
    } catch (error) {
      console.error('GHL V2 getOpportunities failed');
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
