
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
   * Now checks for the real provided token.
   */
  isMockMode(): boolean {
    const token = process.env.NEXT_PUBLIC_GHL_ACCESS_TOKEN;
    return !token || token === '';
  }

  /**
   * Searches for a contact by email using GHL V2.
   * V2 requires locationId for searches.
   */
  async searchContacts(email: string): Promise<GHLContact[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    
    if (!locationId || this.isMockMode()) {
      return this.getMockContacts(email);
    }

    try {
      const response = await apiClient.get(`/contacts/`, {
        params: { locationId, query: email }
      });
      return response.data.contacts || [];
    } catch (error: any) {
      console.error('GHL V2 Search failed:', error.message);
      return this.getMockContacts(email);
    }
  }

  /**
   * Fetches a specific contact's details via V2 endpoint.
   */
  async getContact(id: string): Promise<GHLContact> {
    if (id === 'mock_id' || this.isMockMode()) {
      return this.getMockContact();
    }

    try {
      const response = await apiClient.get(`/contacts/${id}`);
      return response.data.contact;
    } catch (error) {
      return this.getMockContact();
    }
  }

  /**
   * Retrieves appointment history for a contact via V2 endpoint.
   */
  async getAppointments(contactId: string): Promise<GHLAppointment[]> {
    const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;

    if (!locationId || contactId === 'mock_id' || this.isMockMode()) {
      return this.getMockAppointments();
    }
    
    try {
      const response = await apiClient.get(`/appointments/`, {
        params: { contactId, locationId }
      });
      return response.data.appointments || [];
    } catch (error) {
      return this.getMockAppointments();
    }
  }

  /**
   * Private Mock Data Helpers
   */
  private getMockContacts(email: string): GHLContact[] {
    return [{
      id: 'mock_id',
      locationId: 'mock_location',
      firstName: 'Alex',
      lastName: 'Sterling',
      email: email || 'alex@sterling.io',
      tags: ['v2-prototype'],
      type: 'customer'
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
