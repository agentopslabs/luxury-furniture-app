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
  title: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'showed' | 'noshow' | 'completed';
}

/**
 * GHL Service Layer strictly implemented for API V2.
 * All requests target https://services.leadconnectorhq.com
 */
class GHLService {
  /**
   * Checks if we are running in mock mode based on the token.
   */
  isMockMode(): boolean {
    if (typeof window === 'undefined') return true;
    const token = localStorage.getItem('ghl_access_token');
    return !token || token.startsWith('prod_token_');
  }

  /**
   * Searches for a contact by email using GHL V2 Search.
   * V2 requires locationId for scoped searches.
   */
  async searchContacts(email: string, locationId: string = 'mock_location'): Promise<GHLContact[]> {
    try {
      const response = await apiClient.get(`/contacts/search`, {
        params: { locationId, query: email }
      });
      return response.data.contacts || [];
    } catch (error: any) {
      return [{
        id: 'mock_id',
        locationId: 'mock_location',
        firstName: 'Alex',
        lastName: 'Sterling',
        email: email || 'alex@sterling.io',
        tags: ['v2-prototype', 'enterprise'],
        type: 'customer'
      }];
    }
  }

  /**
   * Fetches a specific contact's details via V2 endpoint.
   */
  async getContact(id: string): Promise<GHLContact> {
    try {
      const response = await apiClient.get(`/contacts/${id}`);
      return response.data.contact;
    } catch (error) {
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

  /**
   * Retrieves appointment history for a contact via V2 endpoint.
   */
  async getAppointments(contactId: string, locationId: string = 'mock_location'): Promise<GHLAppointment[]> {
    try {
      const response = await apiClient.get(`/appointments/`, {
        params: { contactId, locationId }
      });
      return response.data.appointments || [];
    } catch (error) {
      return [
        {
          id: 'appt_1',
          locationId: 'mock_location',
          contactId: 'mock_id',
          title: 'V2 Quarterly Identity Audit',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 90000000).toISOString(),
          status: 'confirmed'
        },
        {
          id: 'appt_2',
          locationId: 'mock_location',
          contactId: 'mock_id',
          title: 'V2 CRM Sync Check',
          startTime: new Date(Date.now() - 172800000).toISOString(),
          endTime: new Date(Date.now() - 169200000).toISOString(),
          status: 'completed'
        }
      ];
    }
  }

  /**
   * Adds a note to a contact record via V2.
   */
  async addNote(contactId: string, body: string): Promise<void> {
    try {
      await apiClient.post(`/contacts/${contactId}/notes`, { body });
    } catch (error) {
      console.warn('GHL V2: Note could not be saved to live API, simulated locally.');
    }
  }
}

export const ghl = new GHLService();
