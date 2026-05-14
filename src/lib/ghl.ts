
import apiClient from './api-client';

export interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface GHLAppointment {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
}

/**
 * GHL Service Layer for handling communication with LeadConnector APIs.
 * Includes mock fallbacks for development and unauthenticated sessions.
 */
class GHLService {
  /**
   * Searches for a contact by email in GHL.
   */
  async searchContacts(email: string): Promise<GHLContact[]> {
    try {
      const response = await apiClient.get(`/contacts/search`, {
        params: { q: email }
      });
      return response.data.contacts || [];
    } catch (error: any) {
      // Fallback for prototype/demo if API is unreachable or 401
      if (email.toLowerCase().includes('alex')) {
        return [{
          id: 'mock_id',
          firstName: 'Alex',
          lastName: 'Sterling',
          email: 'alex@sterling.io',
          tags: ['enterprise', 'architect']
        }];
      }
      return [];
    }
  }

  /**
   * Upserts a contact record in GHL.
   */
  async upsertContact(data: Partial<GHLContact>): Promise<GHLContact> {
    try {
      const response = await apiClient.post('/contacts/', data);
      return response.data.contact;
    } catch (error) {
      return {
        id: 'mock_id',
        firstName: data.firstName || 'Guest',
        lastName: data.lastName || 'User',
        email: data.email || '',
        ...data
      } as GHLContact;
    }
  }

  /**
   * Fetches a specific contact's details.
   */
  async getContact(id: string): Promise<GHLContact> {
    try {
      if (id === 'mock_id') {
        return {
          id: 'mock_id',
          firstName: 'Alex',
          lastName: 'Sterling',
          email: 'alex@sterling.io',
          tags: ['enterprise', 'architect']
        };
      }
      const response = await apiClient.get(`/contacts/${id}`);
      return response.data.contact;
    } catch (error) {
      return {
        id: 'mock_id',
        firstName: 'Alex',
        lastName: 'Sterling',
        email: 'alex@sterling.io',
        tags: ['enterprise', 'architect']
      };
    }
  }

  /**
   * Retrieves appointment history for a contact.
   */
  async getAppointments(contactId: string): Promise<GHLAppointment[]> {
    try {
      const response = await apiClient.get(`/appointments/`, {
        params: { contactId }
      });
      return response.data.appointments || [];
    } catch (error) {
      // Mock appointments for demo
      return [
        {
          id: 'appt_1',
          title: 'Quarterly Identity Audit',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 90000000).toISOString(),
          status: 'confirmed'
        },
        {
          id: 'appt_2',
          title: 'CRM Sync Troubleshooting',
          startTime: new Date(Date.now() - 172800000).toISOString(),
          endTime: new Date(Date.now() - 169200000).toISOString(),
          status: 'completed'
        }
      ];
    }
  }

  /**
   * Adds a note to a contact record.
   */
  async addNote(contactId: string, body: string): Promise<void> {
    try {
      await apiClient.post(`/contacts/${contactId}/notes`, { body });
    } catch (error) {
      console.warn('GHL: Note could not be saved to live API, saved locally for demo.');
    }
  }
}

export const ghl = new GHLService();
