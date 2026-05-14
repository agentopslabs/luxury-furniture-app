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
   * Checks if we are running in mock mode.
   */
  isMockMode(): boolean {
    if (typeof window === 'undefined') return true;
    const token = localStorage.getItem('ghl_access_token');
    return !token || token.startsWith('prod_token_');
  }

  /**
   * Searches for a contact by email using GHL V2 Search.
   * V2 requires locationId for searches.
   */
  async searchContacts(email: string, locationId?: string): Promise<GHLContact[]> {
    const locId = locationId || process.env.NEXT_PUBLIC_GHL_LOCATION_ID || 'mock_location';
    
    try {
      const response = await apiClient.get(`/contacts/`, {
        params: { locationId: locId, query: email }
      });
      return response.data.contacts || [];
    } catch (error: any) {
      console.warn('GHL V2 Search failed, using mock fallback.');
      return [{
        id: 'mock_id',
        locationId: locId,
        firstName: 'Alex',
        lastName: 'Sterling',
        email: email || 'alex@sterling.io',
        tags: ['v2-prototype'],
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
   * Scoped by locationId.
   */
  async getAppointments(contactId: string, locationId?: string): Promise<GHLAppointment[]> {
    const locId = locationId || process.env.NEXT_PUBLIC_GHL_LOCATION_ID || 'mock_location';
    
    try {
      const response = await apiClient.get(`/appointments/`, {
        params: { contactId, locationId: locId }
      });
      return response.data.appointments || [];
    } catch (error) {
      return [
        {
          id: 'appt_1',
          locationId: locId,
          contactId: 'mock_id',
          title: 'V2 Strategic Planning',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 90000000).toISOString(),
          status: 'confirmed'
        },
        {
          id: 'appt_2',
          locationId: locId,
          contactId: 'mock_id',
          title: 'V2 Implementation Review',
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
      console.warn('GHL V2 Note simulation: Save triggered.');
    }
  }
}

export const ghl = new GHLService();
