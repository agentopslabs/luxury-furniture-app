
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
  startTime: string | number;
  endTime: string | number;
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

class GHLService {
  isMockMode(): boolean {
    const token = process.env.NEXT_PUBLIC_GHL_ACCESS_TOKEN;
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    return !token || token === 'your_access_token' || !locationId;
  }

  async getContacts(limit: number = 50): Promise<GHLContact[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const response = await apiClient.get('/contacts', {
        params: { locationId, limit }
      });
      return response.data.contacts || [];
    } catch (error) {
      return [];
    }
  }

  async searchContacts(query: string): Promise<GHLContact[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const response = await apiClient.get('/contacts', {
        params: { locationId, query, limit: 10 }
      });
      return response.data.contacts || [];
    } catch (error) {
      return [];
    }
  }

  async getContact(id: string): Promise<GHLContact> {
    try {
      const response = await apiClient.get(`/contacts/${id}`);
      return response.data.contact;
    } catch (error) {
      if (id === 'mock_id') return this.getMockContact();
      throw error;
    }
  }

  async updateContact(id: string, data: Partial<GHLContact>): Promise<GHLContact> {
    try {
      // V2 PUT /contacts/{contactId}
      const response = await apiClient.put(`/contacts/${id}`, data);
      return response.data.contact;
    } catch (error) {
      console.error("GHL Update Contact Error:", error);
      throw error;
    }
  }

  async deleteContact(id: string): Promise<void> {
    try {
      // V2 DELETE /contacts/{contactId}
      await apiClient.delete(`/contacts/${id}`);
    } catch (error) {
      console.error("GHL Delete Contact Error:", error);
      throw error;
    }
  }

  async getAllAppointments(): Promise<GHLAppointment[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const now = Date.now();
      const startTime = now - (30 * 24 * 60 * 60 * 1000);
      const endTime = now + (90 * 24 * 60 * 60 * 1000);

      const response = await apiClient.get('/appointments', {
        params: { 
          locationId, 
          startTime, 
          endTime,
          limit: 100
        }
      });
      
      const appts = response.data.appointments || [];
      return appts.sort((a: GHLAppointment, b: GHLAppointment) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    } catch (error: any) {
      return [];
    }
  }

  async getAppointments(contactId: string): Promise<GHLAppointment[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const now = Date.now();
      const response = await apiClient.get('/appointments', {
        params: { 
          locationId, 
          contactId,
          startTime: now - (365 * 24 * 60 * 60 * 1000),
          endTime: now + (365 * 24 * 60 * 60 * 1000)
        }
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
      const response = await apiClient.get('/calendars', {
        params: { locationId }
      });
      return response.data.calendars || [];
    } catch (error) {
      return [];
    }
  }

  async getConversations(): Promise<GHLConversation[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const response = await apiClient.get('/conversations', {
        params: { locationId, limit: 50 }
      });
      return response.data.conversations || [];
    } catch (error) {
      return [];
    }
  }

  async getPipelines(): Promise<GHLPipeline[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const response = await apiClient.get('/opportunities/pipelines', {
        params: { locationId }
      });
      return response.data.pipelines || [];
    } catch (error) {
      return [];
    }
  }

  async getOpportunities(): Promise<GHLOpportunity[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (!locationId) return [];

    try {
      const response = await apiClient.get('/opportunities', {
        params: { locationId, limit: 20 }
      });
      return response.data.opportunities || [];
    } catch (error) {
      return [];
    }
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
}

export const ghl = new GHLService();
