
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
    } catch (error) {
      console.error('GHL: Search failed', error);
      return [];
    }
  }

  /**
   * Upserts a contact record in GHL.
   */
  async upsertContact(data: Partial<GHLContact>): Promise<GHLContact> {
    const response = await apiClient.post('/contacts/', data);
    return response.data.contact;
  }

  /**
   * Fetches a specific contact's details.
   */
  async getContact(id: string): Promise<GHLContact> {
    const response = await apiClient.get(`/contacts/${id}`);
    return response.data.contact;
  }

  /**
   * Retrieves appointment history for a contact.
   */
  async getAppointments(contactId: string): Promise<GHLAppointment[]> {
    const response = await apiClient.get(`/appointments/`, {
      params: { contactId }
    });
    return response.data.appointments || [];
  }

  /**
   * Adds a note to a contact record.
   */
  async addNote(contactId: string, body: string): Promise<void> {
    await apiClient.post(`/contacts/${contactId}/notes`, { body });
  }
}

export const ghl = new GHLService();
